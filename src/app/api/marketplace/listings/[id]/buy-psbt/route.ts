import { NextRequest, NextResponse } from "next/server";
import * as bitcoin from "bitcoinjs-lib";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { validateBtcAddress } from "@/lib/utils/validation";
import { rateLimit } from "@/lib/utils/rateLimit";
import { fetchAddressUtxos, fetchRecommendedFees } from "@/lib/bitcoin/mempool";
import { buildBuyPsbt, getBitcoinNetwork, validateListingPsbt, type BuyerUtxoInput } from "@/lib/bitcoin/marketplacePsbt";
import type { ApiResponse } from "@/types/api";
import type { PreparedBuyPsbt } from "@/types/marketplace";

interface ListingRow {
  id: string;
  status: string;
  signed_psbt: string;
  utxo_txid: string;
  utxo_vout: number;
  price_sats: number;
  seller_payment_address: string;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const limited = await rateLimit(request, "marketplace");
  if (limited) return limited;

  let body: {
    buyerOrdinalsAddress?: string;
    buyerPaymentAddress?: string;
    buyerPublicKey?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { buyerOrdinalsAddress, buyerPaymentAddress, buyerPublicKey } = body;

  if (!buyerOrdinalsAddress) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "buyerOrdinalsAddress is required" }, { status: 400 });
  }
  const ordinalsAddressError = validateBtcAddress(buyerOrdinalsAddress);
  if (ordinalsAddressError) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: `buyerOrdinalsAddress: ${ordinalsAddressError}` }, { status: 400 });
  }

  if (!buyerPaymentAddress) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "buyerPaymentAddress is required" }, { status: 400 });
  }
  const paymentAddressError = validateBtcAddress(buyerPaymentAddress);
  if (paymentAddressError) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: `buyerPaymentAddress: ${paymentAddressError}` }, { status: 400 });
  }

  if (!buyerPublicKey) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "buyerPublicKey is required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("ordinal_listings")
    .select("id, status, signed_psbt, utxo_txid, utxo_vout, price_sats, seller_payment_address")
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Listing not found" }, { status: 404 });
  }

  const listing = data as unknown as ListingRow;
  if (listing.status !== "active") {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Listing is no longer active" }, { status: 409 });
  }

  const validation = validateListingPsbt({
    signedPsbtBase64: listing.signed_psbt,
    expectedTxid: listing.utxo_txid,
    expectedVout: listing.utxo_vout,
    expectedPriceSats: listing.price_sats,
    expectedSellerPaymentAddress: listing.seller_payment_address,
  });
  if (!validation.valid) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: validation.error ?? "Listing PSBT is no longer valid" }, { status: 409 });
  }

  let utxos;
  let fees;
  try {
    [utxos, fees] = await Promise.all([fetchAddressUtxos(buyerPaymentAddress), fetchRecommendedFees()]);
  } catch {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Failed to look up buyer UTXOs or fee rates" }, { status: 502 });
  }

  const confirmed = utxos.filter((u) => u.status.confirmed).sort((a, b) => b.value - a.value);
  if (confirmed.length === 0) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "No spendable UTXOs found for buyerPaymentAddress" }, { status: 400 });
  }

  const network = getBitcoinNetwork();
  const scriptPubKey = Buffer.from(bitcoin.address.toOutputScript(buyerPaymentAddress, network));
  const internalPubkey = Buffer.from(buyerPublicKey, "hex");
  const feeRateSatsPerVb = fees.halfHourFee;

  let result: ReturnType<typeof buildBuyPsbt> | null = null;
  for (let count = 1; count <= confirmed.length; count++) {
    const buyerUtxos: BuyerUtxoInput[] = confirmed.slice(0, count).map((u) => ({
      txid: u.txid,
      vout: u.vout,
      value: u.value,
      scriptPubKey,
      internalPubkey,
    }));

    try {
      result = buildBuyPsbt({
        sellerSignedPsbt: listing.signed_psbt,
        buyerOrdinalsAddress,
        buyerUtxos,
        buyerChangeAddress: buyerPaymentAddress,
        feeRateSatsPerVb,
      });
      break;
    } catch {
      continue;
    }
  }

  if (!result) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Insufficient funds to cover price and network fee" }, { status: 400 });
  }

  const prepared: PreparedBuyPsbt = {
    psbt: result.psbt.toBase64(),
    signInputs: { [buyerPaymentAddress]: result.signInputIndexes },
    totalSats: listing.price_sats + result.networkFeeSats,
    networkFeeSats: result.networkFeeSats,
  };

  return NextResponse.json<ApiResponse<PreparedBuyPsbt>>({ success: true, data: prepared });
}
