"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ChainIcon } from "@/components/ui/ChainIcon";
import { BadgeCheck, ExternalLink, Layers } from "lucide-react";
import { formatLamportsToSol, formatSatoshisToBtc, formatNumber, shortenAddress, addressToGradient } from "@/lib/utils/format";
import type { Collection } from "@/types/nft";
import type { PaginatedResponse } from "@/types/api";

export default function CollectionPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [activeTab, setActiveTab] = useState<"Items" | "Activity">("Items");
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/collections?slug=${encodeURIComponent(slug)}`)
      .then((res) => res.json())
      .then((json: PaginatedResponse<Collection>) => {
        if (cancelled) return;
        if (json.success && json.data && json.data.length > 0) setCollection(json.data[0]);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-3xl border border-border-default bg-bg-surface animate-pulse h-44 md:h-64" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bg-elevated mx-auto mb-4">
          <Layers className="h-7 w-7 text-text-tertiary" />
        </div>
        <p className="font-semibold text-text-primary">Collection not found</p>
        <p className="text-sm text-text-tertiary mt-1">This collection doesn&apos;t exist or hasn&apos;t been created yet.</p>
        <div className="mt-4">
          <Link href="/explore">
            <Button variant="sol" size="sm">Explore Collections</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isBitcoin = collection.chain === "bitcoin";
  const floor = collection.floor_price_lamports
    ? isBitcoin ? formatSatoshisToBtc(collection.floor_price_lamports) : formatLamportsToSol(collection.floor_price_lamports)
    : "—";
  const volume = isBitcoin ? formatSatoshisToBtc(collection.total_volume_lamports) : formatLamportsToSol(collection.total_volume_lamports);

  const stats = [
    { label: "Floor Price", value: floor },
    { label: "Total Volume", value: volume },
    { label: "Items", value: formatNumber(collection.item_count) },
    { label: "Owners", value: formatNumber(collection.owner_count) },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Hero */}
      <section className="rounded-3xl overflow-hidden border border-border-default bg-bg-surface mb-8">
        <div
          className="h-44 md:h-64"
          style={collection.banner_url ? { backgroundImage: `url(${collection.banner_url})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: addressToGradient(collection.creator_wallet) }}
        />
        <div className="px-6 pb-6 -mt-10">
          <div
            className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-bg-base bg-bg-elevated flex items-center justify-center font-headings font-bold text-2xl text-bg-base shadow-lg overflow-hidden"
            style={collection.logo_url ? { backgroundImage: `url(${collection.logo_url})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: addressToGradient(collection.slug) }}
          >
            {!collection.logo_url && <Layers className="w-8 h-8 text-text-tertiary" />}
          </div>
          <div className="mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-text-tertiary">Collection</p>
              <div className="flex items-center gap-2 mt-1">
                <h1 className="text-3xl md:text-4xl font-headings font-bold">{collection.name}</h1>
                {collection.is_verified && (
                  <BadgeCheck className="w-5 h-5 text-sol-teal flex-shrink-0" aria-label="Verified collection" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-sm text-text-secondary">by</span>
                <Link href={`/profile/${collection.creator_wallet}`} className="font-mono text-sm text-text-secondary hover:text-text-primary transition-colors">
                  {shortenAddress(collection.creator_wallet)}
                </Link>
                <Badge variant={isBitcoin ? "btc" : "sol"}>
                  <span className="flex items-center gap-1">
                    <ChainIcon chain={collection.chain} size={11} /> {isBitcoin ? "Bitcoin" : "Solana"}
                  </span>
                </Badge>
              </div>
              {collection.description && (
                <p className="mt-3 text-text-secondary max-w-xl text-sm leading-relaxed">{collection.description}</p>
              )}
              {collection.external_url && (
                <div className="flex items-center gap-3 mt-3">
                  <a href={collection.external_url} target="_blank" rel="noopener noreferrer" className="text-text-tertiary hover:text-text-primary transition-colors" aria-label="Website">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border-subtle border border-border-subtle rounded-xl bg-bg-surface mb-8 overflow-hidden">
        {stats.map((stat) => (
          <div key={stat.label} className="px-4 py-4 text-center">
            <div className="font-display font-bold text-lg text-text-primary truncate">{stat.value}</div>
            <div className="text-xs text-text-tertiary mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Items / Activity Tab Toggle */}
      <div className="flex items-center justify-between border-b border-border-subtle mb-6">
        <div className="flex">
          {(["Items", "Activity"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab
                  ? "border-text-primary text-text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "Items" && (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bg-elevated">
            <Layers className="h-7 w-7 text-text-tertiary" />
          </div>
          <div>
            <p className="font-semibold text-text-primary">No items indexed yet</p>
            <p className="text-sm text-text-tertiary mt-1">Items minted into this collection will appear here.</p>
          </div>
        </div>
      )}

      {activeTab === "Activity" && (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bg-elevated">
            <Layers className="h-7 w-7 text-text-tertiary" />
          </div>
          <div>
            <p className="font-semibold text-text-primary">No activity recorded yet</p>
            <p className="text-sm text-text-tertiary mt-1">Sales, listings, and transfers will appear here.</p>
          </div>
        </div>
      )}
    </div>
  );
}
