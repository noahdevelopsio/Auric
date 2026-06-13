import { NextRequest, NextResponse } from "next/server";
import * as bitcoin from "bitcoinjs-lib";
import { validateBtcAddress } from "@/lib/utils/validation";
import { rateLimit } from "@/lib/utils/rateLimit";
import { fetchTxHex } from "@/lib/bitcoin/mempool";
import { buildListingPsbt } from "@/lib/bitcoin/marketplacePsbt";
import type { ApiResponse } from "@/types/api";
import type { OrdinalsInscription } from "@/types/ordinals";
import type { PreparedListingPsbt } from "@/types/marketplace";

const HIRO_API_URL = "https://api.hiro.so";
const MAX_ID_LENGTH = 200;

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, "marketplace");
  if (limited) return limited;

  let body: {
    inscriptionId?: string;
    ordinalsAddress?: string;
    paymentAddress?: string;
    publicKey?: string;
    priceSats?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { inscriptionId, ordinalsAddress, paymentAddress, publicKey, priceSats } = body;

  if (!inscriptionId || inscriptionId.length > MAX_ID_LENGTH) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: `inscriptionId is required and must be ${MAX_ID_LENGTH} characters or less` },
      { status: 400 }
    );
  }

  if (!ordinalsAddress) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "ordinalsAddress is required" }, { status: 400 });
  }
  const ordinalsAddressError = validateBtcAddress(ordinalsAddress);
  if (ordinalsAddressError) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: `ordinalsAddress: ${ordinalsAddressError}` }, { status: 400 });
  }

  if (!paymentAddress) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "paymentAddress is required" }, { status: 400 });
  }
  const paymentAddressError = validateBtcAddress(paymentAddress);
  if (paymentAddressError) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: `paymentAddress: ${paymentAddressError}` }, { status: 400 });
  }

  if (!publicKey) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "publicKey is required" }, { status: 400 });
  }

  if (!priceSats || !Number.isInteger(priceSats) || priceSats <= 0) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "priceSats must be a positive integer" }, { status: 400 });
  }

  const inscriptionRes = await fetch(`${HIRO_API_URL}/ordinals/v1/inscriptions/${encodeURIComponent(inscriptionId)}`);
  if (!inscriptionRes.ok) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: `Ordinals lookup failed with status ${inscriptionRes.status}` },
      { status: 502 }
    );
  }

  const inscription: OrdinalsInscription = await inscriptionRes.json();

  if (inscription.address !== ordinalsAddress) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "ordinalsAddress does not own this inscription" },
      { status: 403 }
    );
  }

  const [txid, voutStr] = inscription.satpoint.split(":");
  const vout = parseInt(voutStr, 10);
  if (!txid || !Number.isInteger(vout)) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Could not determine inscription's UTXO" }, { status: 502 });
  }

  let txHex: string;
  try {
    txHex = await fetchTxHex(txid);
  } catch {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Failed to look up inscription's transaction" }, { status: 502 });
  }

  const tx = bitcoin.Transaction.fromHex(txHex);
  const output = tx.outs[vout];
  if (!output) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Inscription UTXO output not found" }, { status: 502 });
  }

  const psbt = buildListingPsbt({
    ordinalUtxo: {
      txid,
      vout,
      value: Number(output.value),
      scriptPubKey: Buffer.from(output.script),
      internalPubkey: Buffer.from(publicKey, "hex"),
    },
    sellerPaymentAddress: paymentAddress,
    priceSats,
  });

  const prepared: PreparedListingPsbt = {
    psbt: psbt.toBase64(),
    signInputs: { [ordinalsAddress]: [0] },
  };

  return NextResponse.json<ApiResponse<PreparedListingPsbt>>({ success: true, data: prepared });
}
