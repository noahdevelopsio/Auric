import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { validateSolanaAddress, validateBtcAddress, validateName } from "@/lib/utils/validation";
import { verifyWalletAuth } from "@/lib/auth/walletAuth";
import { verifyBitcoinWalletAuth } from "@/lib/auth/bitcoinAuth";
import { rateLimit } from "@/lib/utils/rateLimit";
import { ACTIVITY_PAGE_SIZE } from "@/lib/utils/constants";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { Activity, ChainType } from "@/types/nft";

const ACTIVITY_TYPES: Activity["type"][] = ["mint", "list", "delist", "sale", "transfer", "inscribe"];
const MAX_ID_LENGTH = 200;
const MAX_SIGNATURE_LENGTH = 200;
const AUTH_ACTION = "record activity";

interface ActivityRow {
  id: string;
  type: Activity["type"];
  chain: ChainType;
  nft_id: string;
  nft_name: string | null;
  nft_image: string | null;
  from_wallet: string | null;
  to_wallet: string | null;
  price_lamports: number | null;
  tx_signature: string | null;
  created_at: string;
}

function toActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    type: row.type,
    chain: row.chain,
    nft_id: row.nft_id,
    nft_name: row.nft_name ?? undefined,
    nft_image: row.nft_image ?? undefined,
    from_wallet: row.from_wallet ?? undefined,
    to_wallet: row.to_wallet ?? undefined,
    price_lamports: row.price_lamports ?? undefined,
    tx_signature: row.tx_signature ?? undefined,
    created_at: row.created_at,
  };
}

function validateWallet(address: string, chain: ChainType): string | null {
  return chain === "solana" ? validateSolanaAddress(address) : validateBtcAddress(address);
}

export async function GET(request: NextRequest) {
  const limited = await rateLimit(request, "activity");
  if (limited) return limited;

  const { searchParams } = request.nextUrl;
  const chain = searchParams.get("chain");
  const nftId = searchParams.get("nft_id");

  if (chain && chain !== "solana" && chain !== "bitcoin") {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "chain must be 'solana' or 'bitcoin'" },
      { status: 400 }
    );
  }

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? String(ACTIVITY_PAGE_SIZE), 10) || ACTIVITY_PAGE_SIZE));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("activity")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (chain) query = query.eq("chain", chain);
  if (nftId) query = query.eq("nft_id", nftId);

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: error.message }, { status: 500 });
  }

  const activity = ((data ?? []) as ActivityRow[]).map(toActivity);
  const total = count ?? activity.length;

  return NextResponse.json<PaginatedResponse<Activity>>({
    success: true,
    data: activity,
    pagination: { page, limit, total, has_more: from + activity.length < total },
  });
}

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, "activity");
  if (limited) return limited;

  let body: {
    type?: Activity["type"];
    chain?: ChainType;
    nftId?: string;
    nftName?: string;
    nftImage?: string;
    fromWallet?: string;
    toWallet?: string;
    priceLamports?: number;
    txSignature?: string;
    address?: string;
    signature?: string;
    timestamp?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { type, chain, nftId, nftName, nftImage, fromWallet, toWallet, priceLamports, txSignature, address, signature, timestamp } = body;

  if (!type || !ACTIVITY_TYPES.includes(type)) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: `type must be one of: ${ACTIVITY_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  if (chain !== "solana" && chain !== "bitcoin") {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "chain must be 'solana' or 'bitcoin'" },
      { status: 400 }
    );
  }

  if (!nftId || nftId.length > MAX_ID_LENGTH) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: `nftId is required and must be ${MAX_ID_LENGTH} characters or less` },
      { status: 400 }
    );
  }

  if (nftName) {
    const nameError = validateName(nftName);
    if (nameError) {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: nameError }, { status: 400 });
    }
  }

  if (fromWallet) {
    const walletError = validateWallet(fromWallet, chain);
    if (walletError) {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: `fromWallet: ${walletError}` }, { status: 400 });
    }
  }

  if (toWallet) {
    const walletError = validateWallet(toWallet, chain);
    if (walletError) {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: `toWallet: ${walletError}` }, { status: 400 });
    }
  }

  if (priceLamports !== undefined && (!Number.isFinite(priceLamports) || priceLamports < 0)) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "priceLamports must be a non-negative number" }, { status: 400 });
  }

  if (txSignature && txSignature.length > MAX_SIGNATURE_LENGTH) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: `txSignature must be ${MAX_SIGNATURE_LENGTH} characters or less` },
      { status: 400 }
    );
  }

  // Solana activity must be signed by the wallet it's recorded against, so the
  // public activity feed and platform stats can't be spoofed anonymously.
  if (chain === "solana") {
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

    if (address !== fromWallet && address !== toWallet) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "address must match fromWallet or toWallet" },
        { status: 403 }
      );
    }
  }

  // Bitcoin activity must be signed by the wallet it's recorded against (BIP-322),
  // closing the same spoofing gap as the Solana branch above.
  if (chain === "bitcoin") {
    if (!address || !signature || typeof timestamp !== "number") {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "address, signature, and timestamp are required" },
        { status: 400 }
      );
    }

    const addressError = validateBtcAddress(address);
    if (addressError) {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: addressError }, { status: 400 });
    }

    const authError = verifyBitcoinWalletAuth({ action: AUTH_ACTION, address, signature, timestamp });
    if (authError) {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: authError }, { status: 401 });
    }

    if (address !== fromWallet && address !== toWallet) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "address must match fromWallet or toWallet" },
        { status: 403 }
      );
    }
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("activity")
    .insert({
      type,
      chain,
      nft_id: nftId,
      nft_name: nftName?.trim() || null,
      nft_image: nftImage || null,
      from_wallet: fromWallet || null,
      to_wallet: toWallet || null,
      price_lamports: priceLamports ?? null,
      tx_signature: txSignature || null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json<ApiResponse<Activity>>(
    { success: true, data: toActivity(data as ActivityRow) },
    { status: 201 }
  );
}
