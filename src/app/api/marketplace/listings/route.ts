import { NextRequest, NextResponse } from "next/server";
import * as bitcoin from "bitcoinjs-lib";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { validateBtcAddress, validateSolanaAddress, validateName, validateRoyalty } from "@/lib/utils/validation";
import { verifyBitcoinWalletAuth } from "@/lib/auth/bitcoinAuth";
import { verifyWalletAuth } from "@/lib/auth/walletAuth";
import { rateLimit } from "@/lib/utils/rateLimit";
import { getBitcoinNetwork, normalizePsbtInput, validateListingPsbt } from "@/lib/bitcoin/marketplacePsbt";
import { PAGE_SIZE } from "@/lib/utils/constants";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { OrdinalListing, SolanaListing, Listing } from "@/types/marketplace";

const LISTING_STATUSES: OrdinalListing["status"][] = ["active", "sold", "cancelled"];
const MAX_ID_LENGTH = 200;
const AUTH_ACTION = "list nft";
const SATS_PER_BTC = 100_000_000;
const LAMPORTS_PER_SOL = 1_000_000_000;
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

const ORDINAL_COLUMNS =
  "id, inscription_id, seller_address, seller_payment_address, price_sats, utxo_txid, utxo_vout, utxo_value_sats, status, nft_name, nft_image, buyer_address, sale_tx_id, sold_at, created_at";

const SOLANA_COLUMNS =
  "id, mint_address, listing_address, seller_address, price_lamports, royalty_bps, tx_signature, status, nft_name, nft_image, buyer_address, sale_tx_signature, sold_at, expires_at, created_at";

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

interface SolanaListingRow {
  id: string;
  mint_address: string;
  listing_address: string;
  seller_address: string;
  price_lamports: number;
  royalty_bps: number;
  tx_signature: string;
  status: SolanaListing["status"];
  nft_name: string | null;
  nft_image: string | null;
  buyer_address: string | null;
  sale_tx_signature: string | null;
  sold_at: string | null;
  expires_at: string | null;
  created_at: string;
}

function ordinalToListing(row: OrdinalListingRow): Listing {
  return {
    id: row.id,
    mintAddress: row.inscription_id,
    nftName: row.nft_name ?? "Untitled",
    nftImage: row.nft_image ?? undefined,
    chain: "bitcoin",
    sellerAddress: row.seller_address,
    priceSOL: row.price_sats / SATS_PER_BTC,
    priceSats: row.price_sats,
    royaltyBps: 0,
    expiresAt: new Date(row.created_at).getTime() + ONE_YEAR_MS,
    txSignature: "",
    listingAddress: row.id,
    listedAt: new Date(row.created_at).getTime(),
  };
}

function solanaToListing(row: SolanaListingRow): Listing {
  return {
    id: row.id,
    mintAddress: row.mint_address,
    nftName: row.nft_name ?? "Untitled",
    nftImage: row.nft_image ?? undefined,
    chain: "solana",
    sellerAddress: row.seller_address,
    priceSOL: row.price_lamports / LAMPORTS_PER_SOL,
    royaltyBps: row.royalty_bps,
    expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : new Date(row.created_at).getTime() + ONE_YEAR_MS,
    txSignature: row.tx_signature,
    listingAddress: row.listing_address,
    listedAt: new Date(row.created_at).getTime(),
  };
}

export async function GET(request: NextRequest) {
  const limited = await rateLimit(request, "marketplace");
  if (limited) return limited;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") ?? "active";
  const chainParam = searchParams.get("chain");
  const inscriptionId = searchParams.get("inscription_id");
  const mintAddress = searchParams.get("mint_address");
  const sellerAddress = searchParams.get("seller_address");

  if (!LISTING_STATUSES.includes(status as OrdinalListing["status"])) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: `status must be one of: ${LISTING_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  if (chainParam && chainParam !== "solana" && chainParam !== "bitcoin") {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "chain must be 'solana' or 'bitcoin'" },
      { status: 400 }
    );
  }

  // Infer chain from an id filter when not explicitly given, for back-compat
  // with callers that only know one chain's identifier.
  let chain = chainParam as "solana" | "bitcoin" | null;
  if (!chain) {
    if (inscriptionId) chain = "bitcoin";
    else if (mintAddress) chain = "solana";
  }

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? String(PAGE_SIZE), 10) || PAGE_SIZE));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = getSupabaseAdmin();

  if (chain === "bitcoin") {
    let query = supabase
      .from("ordinal_listings")
      .select(ORDINAL_COLUMNS, { count: "exact" })
      .eq("status", status)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (inscriptionId) query = query.eq("inscription_id", inscriptionId);
    if (sellerAddress) query = query.eq("seller_address", sellerAddress);

    const { data, error, count } = await query;
    if (error) {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: error.message }, { status: 500 });
    }

    const listings = ((data ?? []) as unknown as OrdinalListingRow[]).map(ordinalToListing);
    const total = count ?? listings.length;

    return NextResponse.json<PaginatedResponse<Listing>>({
      success: true,
      data: listings,
      pagination: { page, limit, total, has_more: from + listings.length < total },
    });
  }

  if (chain === "solana") {
    let query = supabase
      .from("solana_listings")
      .select(SOLANA_COLUMNS, { count: "exact" })
      .eq("status", status)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (mintAddress) query = query.eq("mint_address", mintAddress);
    if (sellerAddress) query = query.eq("seller_address", sellerAddress);

    const { data, error, count } = await query;
    if (error) {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: error.message }, { status: 500 });
    }

    const listings = ((data ?? []) as unknown as SolanaListingRow[]).map(solanaToListing);
    const total = count ?? listings.length;

    return NextResponse.json<PaginatedResponse<Listing>>({
      success: true,
      data: listings,
      pagination: { page, limit, total, has_more: from + listings.length < total },
    });
  }

  // No chain specified: merge both tables, most-recent first.
  let ordinalQuery = supabase
    .from("ordinal_listings")
    .select(ORDINAL_COLUMNS, { count: "exact" })
    .eq("status", status)
    .order("created_at", { ascending: false })
    .range(0, to);
  let solanaQuery = supabase
    .from("solana_listings")
    .select(SOLANA_COLUMNS, { count: "exact" })
    .eq("status", status)
    .order("created_at", { ascending: false })
    .range(0, to);

  if (sellerAddress) {
    ordinalQuery = ordinalQuery.eq("seller_address", sellerAddress);
    solanaQuery = solanaQuery.eq("seller_address", sellerAddress);
  }

  const [ordinalResult, solanaResult] = await Promise.all([ordinalQuery, solanaQuery]);

  if (ordinalResult.error) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: ordinalResult.error.message }, { status: 500 });
  }
  if (solanaResult.error) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: solanaResult.error.message }, { status: 500 });
  }

  const combined: Listing[] = [
    ...((ordinalResult.data ?? []) as unknown as OrdinalListingRow[]).map(ordinalToListing),
    ...((solanaResult.data ?? []) as unknown as SolanaListingRow[]).map(solanaToListing),
  ].sort((a, b) => b.listedAt - a.listedAt);

  const total = (ordinalResult.count ?? 0) + (solanaResult.count ?? 0);
  const page_data = combined.slice(from, to + 1);

  return NextResponse.json<PaginatedResponse<Listing>>({
    success: true,
    data: page_data,
    pagination: { page, limit, total, has_more: from + page_data.length < total },
  });
}

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, "marketplace");
  if (limited) return limited;

  let body: {
    chain?: "solana" | "bitcoin";
    // Bitcoin fields
    inscriptionId?: string;
    sellerPaymentAddress?: string;
    priceSats?: number;
    signedPsbt?: string;
    // Solana fields
    mintAddress?: string;
    listingAddress?: string;
    priceLamports?: number;
    royaltyBps?: number;
    txSignature?: string;
    expiresAt?: number;
    // Shared fields
    sellerAddress?: string;
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

  if (body.chain === "solana") {
    return handleSolanaPost(body);
  }
  return handleBitcoinPost(body);
}

async function handleSolanaPost(body: {
  mintAddress?: string;
  listingAddress?: string;
  priceLamports?: number;
  royaltyBps?: number;
  txSignature?: string;
  expiresAt?: number;
  sellerAddress?: string;
  nftName?: string;
  nftImage?: string;
  address?: string;
  signature?: string;
  timestamp?: number;
}) {
  const { mintAddress, listingAddress, priceLamports, royaltyBps, txSignature, expiresAt, sellerAddress, nftName, nftImage, address, signature, timestamp } = body;

  if (!mintAddress) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "mintAddress is required" }, { status: 400 });
  }
  const mintAddressError = validateSolanaAddress(mintAddress);
  if (mintAddressError) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: `mintAddress: ${mintAddressError}` }, { status: 400 });
  }

  if (!listingAddress || listingAddress.length > MAX_ID_LENGTH) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: `listingAddress is required and must be ${MAX_ID_LENGTH} characters or less` },
      { status: 400 }
    );
  }

  if (!sellerAddress) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "sellerAddress is required" }, { status: 400 });
  }
  const sellerAddressError = validateSolanaAddress(sellerAddress);
  if (sellerAddressError) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: `sellerAddress: ${sellerAddressError}` }, { status: 400 });
  }

  if (!priceLamports || !Number.isInteger(priceLamports) || priceLamports <= 0) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "priceLamports must be a positive integer" }, { status: 400 });
  }

  const royaltyError = validateRoyalty(royaltyBps ?? 0);
  if (royaltyError) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: royaltyError }, { status: 400 });
  }

  if (!txSignature || txSignature.length > MAX_ID_LENGTH) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: `txSignature is required and must be ${MAX_ID_LENGTH} characters or less` },
      { status: 400 }
    );
  }

  if (nftName) {
    const nameError = validateName(nftName);
    if (nameError) {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: nameError }, { status: 400 });
    }
  }

  if (expiresAt !== undefined && (!Number.isFinite(expiresAt) || expiresAt <= 0)) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "expiresAt must be a valid timestamp" }, { status: 400 });
  }

  if (!address || !signature || typeof timestamp !== "number") {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "address, signature, and timestamp are required" },
      { status: 400 }
    );
  }

  const authError = verifyWalletAuth({ action: AUTH_ACTION, address, signature, timestamp });
  if (authError) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: authError }, { status: 401 });
  }

  if (address !== sellerAddress) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "address must match sellerAddress" },
      { status: 403 }
    );
  }

  const supabase = getSupabaseAdmin();

  const { data: existing, error: existingError } = await supabase
    .from("solana_listings")
    .select("id")
    .eq("mint_address", mintAddress)
    .eq("status", "active")
    .maybeSingle();

  if (existingError) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: existingError.message }, { status: 500 });
  }
  if (existing) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "This NFT already has an active listing" }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("solana_listings")
    .insert({
      mint_address: mintAddress,
      listing_address: listingAddress,
      seller_address: sellerAddress,
      price_lamports: priceLamports,
      royalty_bps: royaltyBps ?? 0,
      tx_signature: txSignature,
      nft_name: nftName?.trim() || null,
      nft_image: nftImage || null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: "This NFT already has an active listing" }, { status: 409 });
    }
    return NextResponse.json<ApiResponse<never>>({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json<ApiResponse<{ id: string }>>({ success: true, data: { id: (data as { id: string }).id } }, { status: 201 });
}

async function handleBitcoinPost(body: {
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
}) {
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
