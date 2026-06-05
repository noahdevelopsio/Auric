"use client";

import { FeaturedDrops } from "@/components/sections/FeaturedDrops";
import { CreatorSpotlight } from "@/components/sections/CreatorSpotlight";

export default function CollectionsPage() {
  return (
    <div className="min-h-screen">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
        <p className="text-xs uppercase tracking-[0.2em] text-text-tertiary mb-2">Collections</p>
        <h1 className="text-3xl md:text-4xl font-headings font-bold">Browse collections</h1>
        <p className="mt-3 text-text-secondary max-w-2xl">
          Discover verified Bitcoin Ordinals and Solana NFT collections, grouped by chain and creator.
        </p>
      </section>
      <FeaturedDrops />
      <CreatorSpotlight />
    </div>
  );
}
