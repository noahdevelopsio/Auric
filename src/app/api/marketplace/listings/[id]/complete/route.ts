import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { validateBtcAddress } from "@/lib/utils/validation";
import { verifyBitcoinWalletAuth } from "@/lib/auth/bitcoinAuth";
import { rateLimit } from "@/lib/utils/rateLimit";
import type { ApiResponse } from "@/types/api";

const AUTH_ACTION = "complete purchase";
const MAX_TX_ID_LENGTH = 200;

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const limited = await rateLimit(request, "marketplace");
  if (limited) return limited;

  let body: {
    buyerAddress?: string;
    saleTxId?: string;
    address?: string;
    signature?: string;
    timestamp?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { buyerAddress, saleTxId, address, signature, timestamp } = body;

  if (!buyerAddress) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "buyerAddress is required" }, { status: 400 });
  }
  const buyerAddressError = validateBtcAddress(buyerAddress);
  if (buyerAddressError) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: `buyerAddress: ${buyerAddressError}` }, { status: 400 });
  }

  if (!saleTxId || saleTxId.length > MAX_TX_ID_LENGTH) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: `saleTxId is required and must be ${MAX_TX_ID_LENGTH} characters or less` },
      { status: 400 }
    );
  }

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

  if (address !== buyerAddress) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "address must match buyerAddress" }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();

  const { data: existing, error: existingError } = await supabase
    .from("ordinal_listings")
    .select("id, status")
    .eq("id", params.id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: existingError.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Listing not found" }, { status: 404 });
  }
  if ((existing as { status: string }).status !== "active") {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Listing is no longer active" }, { status: 409 });
  }

  const { error } = await supabase
    .from("ordinal_listings")
    .update({
      status: "sold",
      buyer_address: buyerAddress,
      sale_tx_id: saleTxId,
      sold_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .eq("status", "active");

  if (error) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json<ApiResponse<{ id: string }>>({ success: true, data: { id: params.id } });
}
