"use client";

import { NFTCard } from "@/components/nft/NFTCard";

const items = [
  { id: 1, name: "Neon Cyberskulls", chain: "solana" as const, price: "55 SOL", priceChange: 3.2, verified: true },
  { id: 2, name: "Digital Artifact #251", chain: "bitcoin" as const, price: "0.2 BTC", priceChange: -1.1, verified: true },
  { id: 3, name: "Solana Superfriends", chain: "solana" as const, price: "40 SOL", priceChange: 0.8, verified: false },
  { id: 4, name: "Inscribed Pepes", chain: "bitcoin" as const, price: "0.1 BTC", priceChange: 5.6, verified: true },
];

export function FeaturedDrops() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-tertiary mb-2">Trending now</p>
            <h2 className="text-2xl md:text-3xl font-headings font-bold">Featured Drops</h2>
            <p className="text-sm text-text-secondary mt-2 max-w-2xl">Hand-picked collections and single pieces from top creators</p>
          </div>
          <a href="/explore" className="text-sm text-text-secondary hover:text-text-primary">
            View All →
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 lg:overflow-visible overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none]">
          {items.map((item) => (
            <div key={item.id} className="min-w-[260px] sm:min-w-0 snap-start">
              <NFTCard name={item.name} chain={item.chain} price={item.price} verified={item.verified} priceChange={item.priceChange} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturedDrops;
