import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/utils/rateLimit";
import type { ApiResponse, PlatformStats } from "@/types/api";

export async function GET(request: NextRequest) {
  const limited = await rateLimit(request, "stats");
  if (limited) return limited;

  const supabase = getSupabaseAdmin();

  const [collectionsRes, mintRes, saleRes, creatorRes] = await Promise.all([
    supabase.from("collections").select("*", { count: "exact", head: true }),
    supabase.from("activity").select("to_wallet").in("type", ["mint", "inscribe"]),
    supabase.from("activity").select("price_lamports").eq("type", "sale").eq("chain", "solana"),
    supabase.from("collections").select("creator_wallet"),
  ]);

  const error = collectionsRes.error ?? mintRes.error ?? saleRes.error ?? creatorRes.error;
  if (error) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: error.message }, { status: 500 });
  }

  const mintWallets = (mintRes.data ?? []).map((r: { to_wallet: string | null }) => r.to_wallet).filter((w): w is string => !!w);
  const creatorWallets = (creatorRes.data ?? []).map((r: { creator_wallet: string }) => r.creator_wallet).filter((w): w is string => !!w);
  const creators = new Set([...mintWallets, ...creatorWallets]).size;

  const totalVolumeLamports = (saleRes.data ?? []).reduce(
    (sum: number, row: { price_lamports: number | null }) => sum + (row.price_lamports ?? 0),
    0
  );

  const stats: PlatformStats = {
    collections: collectionsRes.count ?? 0,
    nftsMinted: mintRes.data?.length ?? 0,
    creators,
    totalVolumeSol: totalVolumeLamports / 1_000_000_000,
  };

  return NextResponse.json<ApiResponse<PlatformStats>>({ success: true, data: stats });
}
