"use client";

import { useEffect, useState } from "react";
import { SolanaIcon, BitcoinIcon } from "@/components/ui/ChainIcon";
import { shortenAddress, addressToGradient, formatNumber } from "@/lib/utils/format";
import type { Collection, ChainType } from "@/types/nft";
import type { PaginatedResponse } from "@/types/api";

interface CreatorSummary {
  wallet: string;
  itemCount: number;
  collectionCount: number;
  chains: Set<ChainType>;
}

export function CreatorSpotlight() {
  const [creators, setCreators] = useState<CreatorSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/collections?limit=100")
      .then((res) => res.json())
      .then((json: PaginatedResponse<Collection>) => {
        if (cancelled || !json.success || !json.data) return;

        const byWallet = new Map<string, CreatorSummary>();
        for (const c of json.data) {
          const existing = byWallet.get(c.creator_wallet);
          if (existing) {
            existing.itemCount += c.item_count;
            existing.collectionCount += 1;
            existing.chains.add(c.chain);
          } else {
            byWallet.set(c.creator_wallet, {
              wallet: c.creator_wallet,
              itemCount: c.item_count,
              collectionCount: 1,
              chains: new Set([c.chain]),
            });
          }
        }

        const top = Array.from(byWallet.values())
          .sort((a, b) => b.itemCount - a.itemCount)
          .slice(0, 6);
        setCreators(top);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || creators.length === 0) return null;

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-tertiary mb-2">Top Creators</p>
            <h2 className="text-2xl md:text-3xl font-headings font-bold">The Artists Behind the Art</h2>
            <p className="text-sm text-text-secondary mt-2 max-w-2xl">Discover creators building on both chains</p>
          </div>
          <a href="/explore" className="text-sm text-text-secondary hover:text-text-primary">Browse creators →</a>
        </div>

        <div className="creator-spotlight-scroll grid grid-flow-col auto-cols-[180px] gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
          {creators.map((creator) => (
            <a
              key={creator.wallet}
              href={`/profile/${creator.wallet}`}
              className="snap-start rounded-xl border border-border-subtle bg-surface p-5 text-center hover:shadow-md transition-shadow"
            >
              <div
                className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center font-headings font-bold text-white"
                style={{ background: addressToGradient(creator.wallet) }}
              >
                {creator.wallet.slice(0, 1).toUpperCase()}
              </div>
              <h3 className="font-medium text-sm font-mono">{shortenAddress(creator.wallet)}</h3>
              <div className="mt-2 flex justify-center gap-1 text-[11px]">
                {creator.chains.has("solana") && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-bg-elevated border border-border-subtle">
                    <SolanaIcon size={12} /> SOL
                  </span>
                )}
                {creator.chains.has("bitcoin") && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-bg-elevated border border-border-subtle">
                    <BitcoinIcon size={12} /> BTC
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-text-tertiary">
                {formatNumber(creator.itemCount)} items · {creator.collectionCount} {creator.collectionCount === 1 ? "collection" : "collections"}
              </p>
            </a>
          ))}
        </div>
        <style jsx>{`
          .creator-spotlight-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(255,255,255,0.22) transparent;
          }
          .creator-spotlight-scroll::-webkit-scrollbar {
            height: 8px;
          }
          .creator-spotlight-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .creator-spotlight-scroll::-webkit-scrollbar-thumb {
            background: linear-gradient(90deg, rgba(255,152,0,0.35), rgba(153,69,255,0.35));
            border-radius: 9999px;
          }
          .creator-spotlight-scroll::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(90deg, rgba(255,152,0,0.55), rgba(153,69,255,0.55));
          }
        `}</style>
      </div>
    </section>
  );
}

export default CreatorSpotlight;
