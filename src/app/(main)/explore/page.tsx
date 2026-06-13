"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ChainIcon } from "@/components/ui/ChainIcon";
import { formatLamportsToSol, formatSatoshisToBtc, formatNumber, addressToGradient } from "@/lib/utils/format";
import { PAGE_SIZE } from "@/lib/utils/constants";
import { BadgeCheck, Layers, Search } from "lucide-react";
import type { Collection } from "@/types/nft";
import type { PaginatedResponse } from "@/types/api";

type ChainFilter = "all" | "solana" | "bitcoin";

function CollectionCard({ collection }: { collection: Collection }) {
  const isBitcoin = collection.chain === "bitcoin";
  const floor = collection.floor_price_lamports
    ? isBitcoin ? formatSatoshisToBtc(collection.floor_price_lamports) : formatLamportsToSol(collection.floor_price_lamports)
    : "—";
  const volume = isBitcoin ? formatSatoshisToBtc(collection.total_volume_lamports) : formatLamportsToSol(collection.total_volume_lamports);

  return (
    <Link
      href={`/collection/${collection.slug}`}
      className="group rounded-2xl border border-border-default bg-bg-surface hover:border-border-strong transition-all duration-200 overflow-hidden flex flex-col"
    >
      <div
        className="h-24 w-full bg-bg-elevated"
        style={collection.banner_url ? { backgroundImage: `url(${collection.banner_url})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: addressToGradient(collection.creator_wallet) }}
      />
      <div className="px-4 pb-4 flex flex-col gap-3 flex-1">
        <div
          className="h-12 w-12 -mt-6 rounded-xl border-2 border-bg-surface bg-bg-elevated flex items-center justify-center overflow-hidden flex-shrink-0"
          style={collection.logo_url ? { backgroundImage: `url(${collection.logo_url})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: addressToGradient(collection.slug) }}
        >
          {!collection.logo_url && <Layers className="w-5 h-5 text-text-tertiary" />}
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="font-semibold text-text-primary text-sm truncate group-hover:text-sol-purple transition-colors">{collection.name}</span>
            {collection.is_verified && <BadgeCheck className="w-4 h-4 text-sol-purple flex-shrink-0" />}
            <Badge variant={collection.chain === "bitcoin" ? "btc" : "sol"} className="ml-auto flex-shrink-0">
              <span className="flex items-center gap-1">
                <ChainIcon chain={collection.chain} size={11} />
                {collection.chain === "solana" ? "SOL" : "BTC"}
              </span>
            </Badge>
          </div>
          {collection.description && (
            <p className="text-xs text-text-tertiary line-clamp-2">{collection.description}</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 mt-auto pt-2 border-t border-border-subtle text-center">
          <div>
            <div className="text-xs font-semibold text-text-primary truncate">{floor}</div>
            <div className="text-[10px] text-text-tertiary mt-0.5">Floor</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-text-primary truncate">{volume}</div>
            <div className="text-[10px] text-text-tertiary mt-0.5">Volume</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-text-primary truncate">{formatNumber(collection.item_count)}</div>
            <div className="text-[10px] text-text-tertiary mt-0.5">Items</div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CollectionCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border-default bg-bg-surface overflow-hidden animate-pulse">
      <div className="h-24 w-full bg-bg-elevated" />
      <div className="px-4 pb-4">
        <div className="h-12 w-12 -mt-6 rounded-xl border-2 border-bg-surface bg-bg-highlight" />
        <div className="h-4 w-2/3 bg-bg-highlight rounded mt-3" />
        <div className="h-3 w-full bg-bg-highlight rounded mt-2" />
        <div className="h-10 w-full bg-bg-highlight rounded mt-4" />
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const [chainFilter, setChainFilter] = useState<ChainFilter>("all");
  const [search, setSearch] = useState("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCollections = useCallback(async (pageNum: number, chain: ChainFilter) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: String(PAGE_SIZE) });
      if (chain !== "all") params.set("chain", chain);

      const res = await fetch(`/api/collections?${params.toString()}`);
      const json: PaginatedResponse<Collection> = await res.json();
      if (!json.success || !json.data) throw new Error(json.error ?? "Failed to load collections");

      setCollections((prev) => (pageNum === 1 ? json.data! : [...prev, ...json.data!]));
      setHasMore(json.pagination.has_more);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load collections");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    loadCollections(1, chainFilter);
  }, [chainFilter, loadCollections]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadCollections(nextPage, chainFilter);
  };

  const filtered = collections.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-tertiary mb-2">Explore</p>
          <h1 className="text-3xl md:text-4xl font-headings font-bold mb-2">Explore Collections</h1>
          <p className="text-text-secondary">Discover verified Bitcoin Ordinals and Solana NFT collections.</p>
        </div>

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
              {c === "all" ? "All Chains" : c === "solana" ? "Solana" : "Bitcoin (Ordinals)"}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <Input
          className="pl-9"
          placeholder="Search collections..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && collections.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <CollectionCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="py-20 text-center">
          <p className="text-semantic-error">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bg-elevated">
            <Layers className="h-7 w-7 text-text-tertiary" />
          </div>
          <div>
            <p className="font-semibold text-text-primary">No collections yet</p>
            <p className="text-sm text-text-tertiary mt-1">Be the first to mint and create a collection on Auric.</p>
          </div>
          <Link href="/mint">
            <Button variant="sol" size="sm">Mint an NFT</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((c) => <CollectionCard key={c.id} collection={c} />)}
          </div>
          {hasMore && !search && (
            <div className="flex justify-center mt-8">
              <Button variant="outline" onClick={handleLoadMore} isLoading={loading}>
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
