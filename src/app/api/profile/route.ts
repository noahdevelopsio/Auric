import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { detectAddressChain, validateProfile } from "@/lib/utils/validation";
import { verifyWalletAuth } from "@/lib/auth/walletAuth";
import { verifyBitcoinWalletAuth } from "@/lib/auth/bitcoinAuth";
import { findAccount, getOrCreateAccount, toProfileDto } from "@/lib/supabase/accounts";
import { AVATAR_GRADIENTS, BANNER_GRADIENTS } from "@/store/profileStore";
import { rateLimit } from "@/lib/utils/rateLimit";
import type { ApiResponse } from "@/types/api";
import type { ProfileDto } from "@/types/account";

const AUTH_ACTION = "update profile";

export async function GET(request: NextRequest) {
  const limited = await rateLimit(request, "profile");
  if (limited) return limited;

  const address = request.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Missing address parameter" },
      { status: 400 }
    );
  }

  const chain = detectAddressChain(address);
  if (!chain) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Invalid wallet address" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  try {
    const account = await findAccount(supabase, address);
    return NextResponse.json<ApiResponse<ProfileDto>>({ success: true, data: toProfileDto(address, account) });
  } catch (err: unknown) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: err instanceof Error ? err.message : "Failed to load profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const limited = await rateLimit(request, "profile");
  if (limited) return limited;

  let body: {
    address?: string;
    signature?: string;
    timestamp?: number;
    displayName?: string;
    bio?: string;
    avatarGradient?: string;
    bannerGradient?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { address, signature, timestamp, displayName, bio, avatarGradient, bannerGradient } = body;

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

  const profileErrors = validateProfile({ displayName, bio });
  if (profileErrors.length > 0) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: profileErrors[0].message },
      { status: 400 }
    );
  }

  if (avatarGradient !== undefined && !(AVATAR_GRADIENTS as readonly string[]).includes(avatarGradient)) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Invalid avatar gradient" }, { status: 400 });
  }

  if (bannerGradient !== undefined && !(BANNER_GRADIENTS as readonly string[]).includes(bannerGradient)) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Invalid banner gradient" }, { status: 400 });
  }

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (displayName !== undefined) update.display_name = displayName;
  if (bio !== undefined) update.bio = bio;
  if (avatarGradient !== undefined) update.avatar_gradient = avatarGradient;
  if (bannerGradient !== undefined) update.banner_gradient = bannerGradient;

  const supabase = getSupabaseAdmin();
  try {
    const account = await getOrCreateAccount(supabase, address, chain);

    const { error } = await supabase.from("accounts").update(update).eq("id", account.accountId);
    if (error) throw new Error(error.message);

    const updated = await findAccount(supabase, address);
    return NextResponse.json<ApiResponse<ProfileDto>>({ success: true, data: toProfileDto(address, updated) });
  } catch (err: unknown) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: err instanceof Error ? err.message : "Failed to update profile" },
      { status: 500 }
    );
  }
}
