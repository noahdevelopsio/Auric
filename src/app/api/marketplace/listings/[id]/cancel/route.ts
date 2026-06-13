import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { verifyBitcoinWalletAuth } from "@/lib/auth/bitcoinAuth";
import { rateLimit } from "@/lib/utils/rateLimit";
import type { ApiResponse } from "@/types/api";

const AUTH_ACTION = "cancel listing";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const limited = await rateLimit(request, "marketplace");
  if (limited) return limited;

  let body: {
    address?: string;
    signature?: string;
    timestamp?: number;
  };

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

  const authError = verifyBitcoinWalletAuth({ action: AUTH_ACTION, address, signature, timestamp });
  if (authError) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: authError }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { data: existing, error: existingError } = await supabase
    .from("ordinal_listings")
    .select("id, status, seller_address")
    .eq("id", params.id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: existingError.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Listing not found" }, { status: 404 });
  }

  const listing = existing as { id: string; status: string; seller_address: string };
  if (address !== listing.seller_address) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "address must match the listing's seller" }, { status: 403 });
  }
  if (listing.status !== "active") {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Listing is no longer active" }, { status: 409 });
  }

  // Note: cancellation is advisory/off-chain. The seller's signed PSBT remains
  // technically broadcastable until the underlying UTXO is spent — the same
  // residual risk as other OpenOrdex-style marketplaces. This is mitigated by
  // never exposing `signed_psbt` via the public GET endpoint.
  const { error } = await supabase
    .from("ordinal_listings")
    .update({ status: "cancelled" })
    .eq("id", params.id)
    .eq("status", "active");

  if (error) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json<ApiResponse<{ id: string }>>({ success: true, data: { id: params.id } });
}
