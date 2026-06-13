"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useMarketplaceStore, Listing } from "@/store/marketplaceStore";
import { useWalletStore } from "@/store/walletStore";
import { BuyModal } from "@/components/marketplace/BuyModal";
import { SolanaIcon, BitcoinIcon } from "@/components/ui/ChainIcon";
import { Search, SlidersHorizontal, Tag } from "lucide-react";

type ChainFilter = "all" | "solana" | "bitcoin";
type SortOrder = "recent" | "price_asc" | "price_desc";

function timeLeft(expiresAt: number): string {
  const ms = expiresAt - Date.now();
  if (ms <= 0) return "Expired";
  const h = Math.floor(ms / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d left`;
  return `${h}h left`;
}

function ListingCard({ listing, onBuy }: { listing: Listing; onBuy: (l: Listing) => void }) {
  const currency = listing.chain === "bitcoin" ? "BTC" : "SOL";

  return (
    <div className="group rounded-2xl border border-border-default bg-bg-surface hover:border-border-strong transition-all duration-200 overflow-hidden flex flex-col">
      {/* Image area */}
      <div className={`aspect-square flex items-center justify-center text-3xl font-headings font-bold text-text-tertiary border-b border-border-subtle ${listing.chain === "solana" ? "bg-gradient-to-br from-sol-purple/10 via-bg-elevated to-sol-teal/10" : "bg-gradient-to-br from-btc-500/10 via-bg-elevated to-btc-500/5"}`}>
        {listing.nftName.split(" ").pop()}
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link href={`/nft/${listing.chain}/${listing.mintAddress}`} className="font-semibold text-text-primary hover:text-sol-purple transition-colors text-sm leading-snug">
              {listing.nftName}
            </Link>
            <div className="text-xs text-text-tertiary mt-0.5 font-mono">
              {listing.sellerAddress.slice(0, 6)}…{listing.sellerAddress.slice(-4)}
            </div>
          </div>
          {listing.chain === "solana"
            ? <SolanaIcon size={20} />
            : <BitcoinIcon size={20} />
          }
        </div>

        <div className="flex items-end justify-between mt-auto">
          <div>
            <div className="text-xs text-text-tertiary mb-0.5">Price</div>
            <div className="text-lg font-headings font-bold text-text-primary">{listing.priceSOL} {currency}</div>
            <div className="text-xs text-text-tertiary">{timeLeft(listing.expiresAt)}</div>
          </div>
          <Button
            variant={listing.chain === "solana" ? "sol" : "btc"}
            size="sm"
            onClick={() => onBuy(listing)}
          >
            Buy
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const { listings: storeListing } = useMarketplaceStore();
  const { solanaAddress, openModal } = useWalletStore();

  const [chainFilter, setChainFilter] = useState<ChainFilter>("all");
  const [sort, setSort] = useState<SortOrder>("recent");
  const [search, setSearch] = useState("");
  const [activeBuy, setActiveBuy] = useState<Listing | null>(null);

  const allListings = Object.values(storeListing);

  const filtered = allListings
    .filter((l) => chainFilter === "all" || l.chain === chainFilter)
    .filter((l) => !search || l.nftName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "price_asc") return a.priceSOL - b.priceSOL;
      if (sort === "price_desc") return b.priceSOL - a.priceSOL;
      return b.listedAt - a.listedAt;
    });

  const handleBuy = (listing: Listing) => {
    if (!solanaAddress) { openModal("solana"); return; }
    setActiveBuy(listing);
  };

  const solFloor = allListings.filter((l) => l.chain === "solana").reduce((min, l) => Math.min(min, l.priceSOL), Infinity);
  const btcFloor = allListings.filter((l) => l.chain === "bitcoin").reduce((min, l) => Math.min(min, l.priceSOL), Infinity);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-headings font-bold mb-2">Marketplace</h1>
        <p className="text-text-secondary">Buy and sell NFTs across Bitcoin Ordinals and Solana.</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Listed", value: allListings.length.toString() },
          { label: "SOL Floor", value: isFinite(solFloor) ? `${solFloor} SOL` : "—" },
          { label: "BTC Floor", value: isFinite(btcFloor) ? `${btcFloor} BTC` : "—" },
          { label: "Chains", value: "2" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-3">
            <div className="text-xl font-headings font-bold text-text-primary">{s.value}</div>
            <div className="text-xs text-text-tertiary mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Chain tabs */}
        <div className="flex bg-bg-elevated/50 p-1 rounded-lg gap-1">
          {(["all", "solana", "bitcoin"] as ChainFilter[]).map((c) => (
            <button
              key={c}
              onClick={() => setChainFilter(c)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                chainFilter === c
                  ? c === "solana" ? "bg-sol-glow text-sol-purple" : c === "bitcoin" ? "bg-btc-glow text-btc-500" : "bg-bg-surface text-text-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {c === "all" ? "All" : c === "solana" ? "Solana" : "Bitcoin"}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search listings…"
            className="w-full rounded-lg border border-border-default bg-bg-overlay py-2 pl-9 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-strong focus:outline-none"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-text-tertiary flex-shrink-0" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOrder)}
            className="rounded-lg border border-border-default bg-bg-overlay py-2 px-3 text-sm text-text-primary focus:border-border-strong focus:outline-none"
          >
            <option value="recent">Recently Listed</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bg-elevated">
            <Tag className="h-7 w-7 text-text-tertiary" />
          </div>
          <div>
            <p className="font-semibold text-text-primary">No listings found</p>
            <p className="text-sm text-text-tertiary mt-1">Try adjusting your filters or be the first to list an NFT.</p>
          </div>
          <Link href="/mint">
            <Button variant="sol" size="sm">Mint an NFT</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((l) => (
            <ListingCard key={l.mintAddress} listing={l} onBuy={handleBuy} />
          ))}
        </div>
      )}

      {activeBuy && (
        <BuyModal
          isOpen={!!activeBuy}
          onClose={() => setActiveBuy(null)}
          mintAddress={activeBuy.mintAddress}
          listingAddress={activeBuy.listingAddress}
          nftName={activeBuy.nftName}
          nftImage={activeBuy.nftImage}
          priceSOL={activeBuy.priceSOL}
          sellerAddress={activeBuy.sellerAddress}
          royaltyBps={activeBuy.royaltyBps}
          chain={activeBuy.chain}
        />
      )}
    </div>
  );
}
