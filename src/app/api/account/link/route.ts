import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { detectAddressChain } from "@/lib/utils/validation";
import { verifyWalletAuth } from "@/lib/auth/walletAuth";
import { verifyBitcoinWalletAuth } from "@/lib/auth/bitcoinAuth";
import { attachWallet, deleteAccount, findAccount, getOrCreateAccount, moveWalletToAccount, toProfileDto } from "@/lib/supabase/accounts";
import { rateLimit } from "@/lib/utils/rateLimit";
import type { ApiResponse } from "@/types/api";
import type { ProfileDto } from "@/types/account";

interface WalletProof {
  address?: string;
  signature?: string;
  timestamp?: number;
}

function verifyProof(proof: WalletProof, otherAddress: string): { address: string; chain: "solana" | "bitcoin" } | { error: string } {
  const { address, signature, timestamp } = proof;
  if (!address || !signature || typeof timestamp !== "number") {
    return { error: "address, signature, and timestamp are required for both wallets" };
  }

  const chain = detectAddressChain(address);
  if (!chain) return { error: `Invalid wallet address: ${address}` };

  const action = `link wallet ${otherAddress}`;
  const authError =
    chain === "solana"
      ? verifyWalletAuth({ action, address, signature, timestamp })
      : verifyBitcoinWalletAuth({ action, address, signature, timestamp });
  if (authError) return { error: authError };

  return { address, chain };
}

// Links two wallets (one Solana, one Bitcoin) into a single account.
// `a` is the address of the profile page the user is on — its account is
// kept and stays primary. `b` is the other connected wallet being attached.
export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, "account");
  if (limited) return limited;

  let body: { a?: WalletProof; b?: WalletProof };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.a || !body.b) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Both wallets (a and b) are required" }, { status: 400 });
  }

  const a = verifyProof(body.a, body.b.address ?? "");
  if ("error" in a) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: a.error }, { status: 401 });
  }

  const b = verifyProof(body.b, a.address);
  if ("error" in b) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: b.error }, { status: 401 });
  }

  if (a.chain === b.chain) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Cannot link two wallets on the same chain" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  try {
    const accountA = await getOrCreateAccount(supabase, a.address, a.chain);
    const accountB = await findAccount(supabase, b.address);

    if (accountB && accountB.accountId !== accountA.accountId) {
      if (accountB.wallets.length > 1) {
        return NextResponse.json<ApiResponse<never>>(
          { success: false, error: "This wallet is already linked to another account" },
          { status: 409 }
        );
      }
      await moveWalletToAccount(supabase, b.address, accountA.accountId, false);
      await deleteAccount(supabase, accountB.accountId);
    } else if (!accountB) {
      await attachWallet(supabase, b.address, accountA.accountId, b.chain, false);
    }
    // else: accountB already belongs to accountA — already linked, no-op.

    const updated = await findAccount(supabase, a.address);
    return NextResponse.json<ApiResponse<ProfileDto>>({ success: true, data: toProfileDto(a.address, updated) });
  } catch (err: unknown) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: err instanceof Error ? err.message : "Failed to link wallets" },
      { status: 500 }
    );
  }
}
