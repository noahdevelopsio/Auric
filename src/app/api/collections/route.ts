import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { validateSolanaAddress, validateName, validateDescription, validateRoyalty } from "@/lib/utils/validation";
import { verifyWalletAuth } from "@/lib/auth/walletAuth";
import { slugify } from "@/lib/utils/slug";
import { PAGE_SIZE } from "@/lib/utils/constants";
import { rateLimit } from "@/lib/utils/rateLimit";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { Collection, ChainType } from "@/types/nft";

const AUTH_ACTION = "create collection";

interface CollectionRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  chain: ChainType;
  creator_wallet: string;
  logo_url: string | null;
  banner_url: string | null;
  symbol: string | null;
  royalty_bps: number;
  is_verified: boolean;
  external_url: string | null;
  floor_price_lamports: number | null;
  total_volume_lamports: number;
  item_count: number;
  owner_count: number;
  created_at: string;
}

function toCollection(row: CollectionRow): Collection {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? undefined,
    chain: row.chain,
    creator_wallet: row.creator_wallet,
    logo_url: row.logo_url ?? undefined,
    banner_url: row.banner_url ?? undefined,
    symbol: row.symbol ?? undefined,
    royalty_bps: row.royalty_bps,
    is_verified: row.is_verified,
    external_url: row.external_url ?? undefined,
    floor_price_lamports: row.floor_price_lamports ?? undefined,
    total_volume_lamports: row.total_volume_lamports,
    item_count: row.item_count,
    owner_count: row.owner_count,
    created_at: row.created_at,
  };
}

export async function GET(request: NextRequest) {
  const limited = await rateLimit(request, "collections");
  if (limited) return limited;

  const { searchParams } = request.nextUrl;
  const chain = searchParams.get("chain");
  const slug = searchParams.get("slug");
  const search = searchParams.get("search");

  if (chain && chain !== "solana" && chain !== "bitcoin") {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "chain must be 'solana' or 'bitcoin'" },
      { status: 400 }
    );
  }

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? String(PAGE_SIZE), 10) || PAGE_SIZE));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("collections")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (chain) query = query.eq("chain", chain);
  if (slug) query = query.eq("slug", slug);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: error.message }, { status: 500 });
  }

  const collections = ((data ?? []) as CollectionRow[]).map(toCollection);
  const total = count ?? collections.length;

  return NextResponse.json<PaginatedResponse<Collection>>({
    success: true,
    data: collections,
    pagination: { page, limit, total, has_more: from + collections.length < total },
  });
}

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, "collections");
  if (limited) return limited;

  let body: {
    address?: string;
    signature?: string;
    timestamp?: number;
    name?: string;
    description?: string;
    chain?: ChainType;
    symbol?: string;
    royaltyBps?: number;
    logoUrl?: string;
    bannerUrl?: string;
    externalUrl?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { address, signature, timestamp, name, description, chain, symbol, royaltyBps, logoUrl, bannerUrl, externalUrl } = body;

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

  if (!name) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "name is required" }, { status: 400 });
  }
  const nameError = validateName(name);
  if (nameError) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: nameError }, { status: 400 });
  }

  if (description) {
    const descError = validateDescription(description);
    if (descError) {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: descError }, { status: 400 });
    }
  }

  if (chain !== "solana" && chain !== "bitcoin") {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "chain must be 'solana' or 'bitcoin'" },
      { status: 400 }
    );
  }

  const royalty = royaltyBps ?? 0;
  const royaltyError = validateRoyalty(royalty);
  if (royaltyError) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: royaltyError }, { status: 400 });
  }

  const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 8)}`;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("collections")
    .insert({
      slug,
      name: name.trim(),
      description: description?.trim() || null,
      chain,
      creator_wallet: address,
      logo_url: logoUrl || null,
      banner_url: bannerUrl || null,
      symbol: symbol || null,
      royalty_bps: royalty,
      external_url: externalUrl || null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json<ApiResponse<Collection>>(
    { success: true, data: toCollection(data as CollectionRow) },
    { status: 201 }
  );
}
