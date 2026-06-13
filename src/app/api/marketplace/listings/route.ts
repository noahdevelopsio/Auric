import { NextRequest, NextResponse } from "next/server";
import * as bitcoin from "bitcoinjs-lib";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { validateBtcAddress, validateName } from "@/lib/utils/validation";
import { verifyBitcoinWalletAuth } from "@/lib/auth/bitcoinAuth";
import { rateLimit } from "@/lib/utils/rateLimit";
import { getBitcoinNetwork, normalizePsbtInput, validateListingPsbt } from "@/lib/bitcoin/marketplacePsbt";
import { PAGE_SIZE } from "@/lib/utils/constants";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { OrdinalListing } from "@/types/marketplace";

const LISTING_STATUSES: OrdinalListing["status"][] = ["active", "sold", "cancelled"];
const MAX_ID_LENGTH = 200;
const AUTH_ACTION = "list nft";

const PUBLIC_COLUMNS =
  "id, inscription_id, seller_address, seller_payment_address, price_sats, utxo_txid, utxo_vout, utxo_value_sats, status, nft_name, nft_image, buyer_address, sale_tx_id, sold_at, created_at";

interface OrdinalListingRow {
  id: string;
  inscription_id: string;
  seller_address: string;
  seller_payment_address: string;
  price_sats: number;
  utxo_txid: string;
  utxo_vout: number;
  utxo_value_sats: number;
  status: OrdinalListing["status"];
  nft_name: string | null;
  nft_image: string | null;
  buyer_address: string | null;
  sale_tx_id: string | null;
  sold_at: string | null;
  created_at: string;
}

function toListing(row: OrdinalListingRow): OrdinalListing {
  return {
    id: row.id,
    inscriptionId: row.inscription_id,
    sellerAddress: row.seller_address,
    sellerPaymentAddress: row.seller_payment_address,
    priceSats: row.price_sats,
    utxoTxid: row.utxo_txid,
    utxoVout: row.utxo_vout,
    utxoValueSats: row.utxo_value_sats,
    status: row.status,
    nftName: row.nft_name ?? undefined,
    nftImage: row.nft_image ?? undefined,
    buyerAddress: row.buyer_address ?? undefined,
    saleTxId: row.sale_tx_id ?? undefined,
    soldAt: row.sold_at ?? undefined,
    createdAt: row.created_at,
  };
}

export async function GET(request: NextRequest) {
  const limited = await rateLimit(request, "marketplace");
  if (limited) return limited;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") ?? "active";
  const inscriptionId = searchParams.get("inscription_id");

  if (!LISTING_STATUSES.includes(status as OrdinalListing["status"])) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: `status must be one of: ${LISTING_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? String(PAGE_SIZE), 10) || PAGE_SIZE));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("ordinal_listings")
    .select(PUBLIC_COLUMNS, { count: "exact" })
    .eq("status", status)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (inscriptionId) query = query.eq("inscription_id", inscriptionId);

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: error.message }, { status: 500 });
  }

  const listings = ((data ?? []) as unknown as OrdinalListingRow[]).map(toListing);
  const total = count ?? listings.length;

  return NextResponse.json<PaginatedResponse<OrdinalListing>>({
    success: true,
    data: listings,
    pagination: { page, limit, total, has_more: from + listings.length < total },
  });
}

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, "marketplace");
  if (limited) return limited;

  let body: {
    inscriptionId?: string;
    sellerAddress?: string;
    sellerPaymentAddress?: string;
    priceSats?: number;
    signedPsbt?: string;
    nftName?: string;
    nftImage?: string;
    address?: string;
    signature?: string;
    timestamp?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { inscriptionId, sellerAddress, sellerPaymentAddress, priceSats, signedPsbt, nftName, nftImage, address, signature, timestamp } = body;

  if (!inscriptionId || inscriptionId.length > MAX_ID_LENGTH) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: `inscriptionId is required and must be ${MAX_ID_LENGTH} characters or less` },
      { status: 400 }
    );
  }

  if (!sellerAddress) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "sellerAddress is required" }, { status: 400 });
  }
  const sellerAddressError = validateBtcAddress(sellerAddress);
  if (sellerAddressError) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: `sellerAddress: ${sellerAddressError}` }, { status: 400 });
  }

  if (!sellerPaymentAddress) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "sellerPaymentAddress is required" }, { status: 400 });
  }
  const sellerPaymentAddressError = validateBtcAddress(sellerPaymentAddress);
  if (sellerPaymentAddressError) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: `sellerPaymentAddress: ${sellerPaymentAddressError}` }, { status: 400 });
  }

  if (!priceSats || !Number.isInteger(priceSats) || priceSats <= 0) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "priceSats must be a positive integer" }, { status: 400 });
  }

  if (!signedPsbt) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "signedPsbt is required" }, { status: 400 });
  }

  if (nftName) {
    const nameError = validateName(nftName);
    if (nameError) {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: nameError }, { status: 400 });
    }
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

  if (address !== sellerAddress) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "address must match sellerAddress" },
      { status: 403 }
    );
  }

  // Extract the ordinal UTXO being offered directly from the signed PSBT.
  let utxoTxid: string;
  let utxoVout: number;
  let utxoValueSats: number;
  try {
    const psbt = bitcoin.Psbt.fromBase64(normalizePsbtInput(signedPsbt), { network: getBitcoinNetwork() });
    const txInput = psbt.txInputs[0];
    const witnessUtxo = psbt.data.inputs[0]?.witnessUtxo;
    if (!txInput || !witnessUtxo) {
      throw new Error("Missing input data");
    }
    utxoTxid = Buffer.from(txInput.hash).reverse().toString("hex");
    utxoVout = txInput.index;
    utxoValueSats = Number(witnessUtxo.value);
  } catch {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "signedPsbt could not be parsed" }, { status: 400 });
  }

  const validation = validateListingPsbt({
    signedPsbtBase64: signedPsbt,
    expectedTxid: utxoTxid,
    expectedVout: utxoVout,
    expectedPriceSats: priceSats,
    expectedSellerPaymentAddress: sellerPaymentAddress,
  });
  if (!validation.valid) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: validation.error ?? "Invalid listing PSBT" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: existing, error: existingError } = await supabase
    .from("ordinal_listings")
    .select("id")
    .eq("inscription_id", inscriptionId)
    .eq("status", "active")
    .maybeSingle();

  if (existingError) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: existingError.message }, { status: 500 });
  }
  if (existing) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "This inscription already has an active listing" }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("ordinal_listings")
    .insert({
      inscription_id: inscriptionId,
      seller_address: sellerAddress,
      seller_payment_address: sellerPaymentAddress,
      price_sats: priceSats,
      signed_psbt: normalizePsbtInput(signedPsbt),
      utxo_txid: utxoTxid,
      utxo_vout: utxoVout,
      utxo_value_sats: utxoValueSats,
      nft_name: nftName?.trim() || null,
      nft_image: nftImage || null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: "This inscription already has an active listing" }, { status: 409 });
    }
    return NextResponse.json<ApiResponse<never>>({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json<ApiResponse<{ id: string }>>({ success: true, data: { id: (data as { id: string }).id } }, { status: 201 });
}
