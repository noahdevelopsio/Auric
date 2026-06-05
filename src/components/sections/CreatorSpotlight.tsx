"use client";

import { SolanaIcon, BitcoinIcon } from "@/components/ui/ChainIcon";

const creators = [
  { id: 1, name: "PixelForge", collections: "42 NFTs", volume: "12 SOL" },
  { id: 2, name: "Ordinal Oak", collections: "28 NFTs", volume: "6 BTC" },
  { id: 3, name: "Nebula Labs", collections: "17 NFTs", volume: "4 SOL" },
  { id: 4, name: "ChainBloom", collections: "33 NFTs", volume: "9 SOL" },
  { id: 5, name: "MetaMint", collections: "19 NFTs", volume: "2 BTC" },
  { id: 6, name: "HashHouse", collections: "11 NFTs", volume: "3 SOL" },
];

export function CreatorSpotlight() {
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
            <article key={creator.id} className="snap-start rounded-xl border border-border-subtle bg-surface p-5 text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-btc-500/30 to-sol-purple/30 mx-auto mb-3 flex items-center justify-center font-headings font-bold">
                {creator.name.slice(0, 1)}
              </div>
              <h3 className="font-medium text-sm">{creator.name}</h3>
              <div className="mt-2 flex justify-center gap-1 text-[11px]">
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-bg-elevated border border-border-subtle">
                  <SolanaIcon size={12} /> SOL
                </span>
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-bg-elevated border border-border-subtle">
                  <BitcoinIcon size={12} /> BTC
                </span>
              </div>
              <p className="mt-2 text-xs text-text-tertiary">{creator.collections} · {creator.volume}</p>
            </article>
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
