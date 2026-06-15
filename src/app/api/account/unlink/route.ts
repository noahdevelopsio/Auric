import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { detectAddressChain } from "@/lib/utils/validation";
import { verifyWalletAuth } from "@/lib/auth/walletAuth";
import { verifyBitcoinWalletAuth } from "@/lib/auth/bitcoinAuth";
import { createAccount, findAccount, moveWalletToAccount, setPrimaryWallet, toProfileDto } from "@/lib/supabase/accounts";
import { rateLimit } from "@/lib/utils/rateLimit";
import type { ApiResponse } from "@/types/api";
import type { ProfileDto } from "@/types/account";

const AUTH_ACTION = "unlink wallet";

// Splits `address` off of its current account into a brand-new account of
// its own. Requires the account to have at least 2 wallets.
export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, "account");
  if (limited) return limited;

  let body: { address?: string; signature?: string; timestamp?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { address, signature, timestamp } = body;
  if (!address || !signature || typeof timestamp !== "number") {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "address, signature, and timestamp are required" },
      { status: 400 }
    );
  }

  const chain = detectAddressChain(address);
  if (!chain) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Invalid wallet address" }, { status: 400 });
  }

  const authError =
    chain === "solana"
      ? verifyWalletAuth({ action: AUTH_ACTION, address, signature, timestamp })
      : verifyBitcoinWalletAuth({ action: AUTH_ACTION, address, signature, timestamp });
  if (authError) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: authError }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  try {
    const account = await findAccount(supabase, address);
    if (!account || account.wallets.length < 2) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "This wallet has no linked wallets to unlink" },
        { status: 400 }
      );
    }

    const wasPrimary = account.wallets.find((w) => w.address === address)?.isPrimary ?? false;
    const remaining = account.wallets.find((w) => w.address !== address)!;

    // Move the departing wallet to a fresh account first (it can't stay
    // primary on the old account while we promote `remaining`, since the
    // partial unique index allows only one is_primary row per account).
    const newAccountId = await createAccount(supabase);
    await moveWalletToAccount(supabase, address, newAccountId, true);

    if (wasPrimary) {
      await setPrimaryWallet(supabase, remaining.address, account.accountId);
    }

    const updated = await findAccount(supabase, address);
    return NextResponse.json<ApiResponse<ProfileDto>>({ success: true, data: toProfileDto(address, updated) });
  } catch (err: unknown) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: err instanceof Error ? err.message : "Failed to unlink wallet" },
      { status: 500 }
    );
  }
}
