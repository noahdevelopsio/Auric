import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { validateSolanaAddress, validateProfile } from "@/lib/utils/validation";
import { verifyWalletAuth } from "@/lib/auth/walletAuth";
import { AVATAR_GRADIENTS, BANNER_GRADIENTS, DEFAULT_PROFILE } from "@/store/profileStore";
import type { ApiResponse } from "@/types/api";

const AUTH_ACTION = "update profile";

interface ProfileDto {
  address: string;
  displayName: string;
  bio: string;
  avatarGradient: string;
  bannerGradient: string;
}

interface ProfileRow {
  display_name: string | null;
  bio: string | null;
  avatar_gradient: string | null;
  banner_gradient: string | null;
}

function toDto(address: string, row: ProfileRow | null): ProfileDto {
  return {
    address,
    displayName: row?.display_name ?? DEFAULT_PROFILE.displayName,
    bio: row?.bio ?? DEFAULT_PROFILE.bio,
    avatarGradient: row?.avatar_gradient ?? DEFAULT_PROFILE.avatarGradient,
    bannerGradient: row?.banner_gradient ?? DEFAULT_PROFILE.bannerGradient,
  };
}

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Missing address parameter" },
      { status: 400 }
    );
  }

  const addressError = validateSolanaAddress(address);
  if (addressError) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: addressError }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, bio, avatar_gradient, banner_gradient")
    .eq("wallet_address", address)
    .maybeSingle();

  if (error) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json<ApiResponse<ProfileDto>>({ success: true, data: toDto(address, data) });
}

export async function PATCH(request: NextRequest) {
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

  const addressError = validateSolanaAddress(address);
  if (addressError) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: addressError }, { status: 400 });
  }

  const authError = verifyWalletAuth({ action: AUTH_ACTION, address, signature, timestamp });
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
    wallet_address: address,
    updated_at: new Date().toISOString(),
  };
  if (displayName !== undefined) update.display_name = displayName;
  if (bio !== undefined) update.bio = bio;
  if (avatarGradient !== undefined) update.avatar_gradient = avatarGradient;
  if (bannerGradient !== undefined) update.banner_gradient = bannerGradient;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .upsert(update, { onConflict: "wallet_address" })
    .select("display_name, bio, avatar_gradient, banner_gradient")
    .single();

  if (error) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json<ApiResponse<ProfileDto>>({ success: true, data: toDto(address, data) });
}
