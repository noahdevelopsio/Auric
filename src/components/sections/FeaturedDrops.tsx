"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NFTCard } from "@/components/nft/NFTCard";
import type { Activity, ChainType } from "@/types/nft";
import type { PaginatedResponse } from "@/types/api";

interface Drop {
  id: string;
  chain: ChainType;
  name: string;
  image?: string;
  price: string;
}

export function FeaturedDrops() {
  const router = useRouter();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/activity?limit=50")
      .then((res) => res.json())
      .then((json: PaginatedResponse<Activity>) => {
        if (cancelled || !json.success || !json.data) return;

        const seen = new Set<string>();
        const items: Drop[] = [];
        for (const a of json.data) {
          if (a.type !== "list" || !a.nft_id || seen.has(a.nft_id)) continue;
          seen.add(a.nft_id);

          const priceNum = a.chain === "bitcoin"
            ? (a.price_lamports ?? 0) / 100_000_000
            : (a.price_lamports ?? 0) / 1_000_000_000;

          items.push({
            id: a.nft_id,
            chain: a.chain,
            name: a.nft_name || "Untitled",
            image: a.nft_image,
            price: `${priceNum} ${a.chain === "bitcoin" ? "BTC" : "SOL"}`,
          });
          if (items.length >= 8) break;
        }
        setDrops(items);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || drops.length === 0) return null;

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-tertiary mb-2">Trending now</p>
            <h2 className="text-2xl md:text-3xl font-headings font-bold">Featured Drops</h2>
            <p className="text-sm text-text-secondary mt-2 max-w-2xl">Recently listed pieces from across Bitcoin and Solana</p>
          </div>
          <a href="/marketplace" className="text-sm text-text-secondary hover:text-text-primary">View All →</a>
        </div>

        <div className="featured-drops-scroll grid grid-flow-col auto-cols-[280px] gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
          {drops.map((drop) => (
            <div key={`${drop.chain}-${drop.id}`} className="snap-start">
              <NFTCard
                name={drop.name}
                chain={drop.chain}
                image={drop.image}
                price={drop.price}
                onClick={() => router.push(`/nft/${drop.chain}/${drop.id}`)}
              />
            </div>
          ))}
        </div>
        <style jsx>{`
          .featured-drops-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(255,255,255,0.22) transparent;
          }
          .featured-drops-scroll::-webkit-scrollbar {
            height: 8px;
          }
          .featured-drops-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .featured-drops-scroll::-webkit-scrollbar-thumb {
            background: linear-gradient(90deg, rgba(255,152,0,0.35), rgba(153,69,255,0.35));
            border-radius: 9999px;
          }
          .featured-drops-scroll::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(90deg, rgba(255,152,0,0.55), rgba(153,69,255,0.55));
          }
        `}</style>
      </div>
    </section>
  );
}

export default FeaturedDrops;
