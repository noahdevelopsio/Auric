import type { MetadataRoute } from "next";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://dualchain.xyz";

const STATIC_ROUTES = [
  "",
  "/explore",
  "/marketplace",
  "/mint",
  "/collections",
  "/activity",
  "/about",
  "/blog",
  "/docs",
  "/faq",
  "/contact",
  "/api-docs",
  "/security",
  "/privacy",
  "/terms",
  "/guides/bitcoin-ordinals",
  "/guides/solana-nfts",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${APP_URL}${path}`,
    lastModified: new Date(),
  }));

  let collectionEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from("collections").select("slug, created_at");
    collectionEntries = (data ?? []).map((row: { slug: string; created_at: string }) => ({
      url: `${APP_URL}/collection/${row.slug}`,
      lastModified: new Date(row.created_at),
    }));
  } catch {
    // Supabase not configured at build time — fall back to static routes only.
  }

  return [...staticEntries, ...collectionEntries];
}
