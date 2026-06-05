"use client";

import { useState } from "react";
import { use } from "react";
import { NFTCard } from "@/components/nft/NFTCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ChainIcon } from "@/components/ui/ChainIcon";
import { BadgeCheck, ExternalLink, Search, SlidersHorizontal } from "lucide-react";

const ITEMS = [
  { id: 1, name: "Blue Robot #001", chain: "solana" as const, price: "0.5 SOL" },
  { id: 2, name: "Blue Robot #002", chain: "solana" as const, price: "0.6 SOL" },
  { id: 3, name: "Blue Robot #003", chain: "solana" as const, price: "0.7 SOL" },
  { id: 4, name: "Blue Robot #004", chain: "solana" as const, price: "0.9 SOL" },
  { id: 5, name: "Blue Robot #005", chain: "solana" as const, price: "1.1 SOL" },
  { id: 6, name: "Blue Robot #006", chain: "solana" as const, price: "1.4 SOL" },
  { id: 7, name: "Blue Robot #007", chain: "solana" as const, price: "0.55 SOL" },
  { id: 8, name: "Blue Robot #008", chain: "solana" as const, price: "2.0 SOL" },
];

const ACTIVITY = [
  { id: 1, type: "Sale", item: "Blue Robot #001", price: "0.5 SOL", from: "7xKp...3mZq", to: "4nFz...8PbT", time: "2 hrs ago" },
  { id: 2, type: "Listed", item: "Blue Robot #003", price: "0.7 SOL", from: "4nFz...8PbT", to: "—", time: "5 hrs ago" },
  { id: 3, type: "Minted", item: "Blue Robot #008", price: "—", from: "creator", to: "7xKp...3mZq", time: "1 day ago" },
  { id: 4, type: "Sale", item: "Blue Robot #002", price: "0.58 SOL", from: "9pQr...1mNx", to: "4nFz...8PbT", time: "2 days ago" },
];

const STATS = [
  { label: "Floor Price", value: "0.5 SOL" },
  { label: "Best Offer", value: "0.45 SOL" },
  { label: "24h Volume", value: "12 SOL" },
  { label: "Total Volume", value: "890 SOL" },
  { label: "Items", value: "1,000" },
  { label: "Owners", value: "482" },
];

const SORT_OPTIONS = ["Price: Low to High", "Price: High to Low", "Recently Listed", "Token ID"];

export default function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [activeTab, setActiveTab] = useState<"Items" | "Activity">("Items");
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0]);
  const [searchQuery, setSearchQuery] = useState("");

  const collectionName = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const filteredItems = ITEMS.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Hero */}
      <section className="rounded-3xl overflow-hidden border border-border-default bg-bg-surface mb-8">
        <div className="h-44 md:h-64 bg-gradient-to-r from-btc-500/15 via-bg-elevated to-sol-purple/15" />
        <div className="px-6 pb-6 -mt-10">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-bg-base bg-gradient-to-br from-btc-500 to-sol-purple flex items-center justify-center font-headings font-bold text-2xl text-bg-base shadow-lg">
            C
          </div>
          <div className="mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-text-tertiary">Collection</p>
              <div className="flex items-center gap-2 mt-1">
                <h1 className="text-3xl md:text-4xl font-headings font-bold">{collectionName}</h1>
                <BadgeCheck className="w-5 h-5 text-sol-teal flex-shrink-0" aria-label="Verified collection" />
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-sm text-text-secondary">by</span>
                <button className="font-mono text-sm text-text-secondary hover:text-text-primary transition-colors">
                  7xKp...3mZq
                </button>
                <Badge variant="sol"><span className="flex items-center gap-1"><ChainIcon chain="solana" size={11} /> Solana</span></Badge>
              </div>
              <p className="mt-3 text-text-secondary max-w-xl text-sm leading-relaxed">
                A collection of 1,000 unique robot characters living on Solana. Each robot is generated from 150+ hand-crafted traits.
              </p>
              <div className="flex items-center gap-3 mt-3">
                <a href="#" className="text-text-tertiary hover:text-text-primary transition-colors" aria-label="Website">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <div className="grid grid-cols-3 md:grid-cols-6 divide-x divide-border-subtle border border-border-subtle rounded-xl bg-bg-surface mb-8 overflow-hidden">
        {STATS.map((stat, i) => (
          <div key={stat.label} className="px-4 py-4 text-center">
            <div className="font-display font-bold text-lg text-text-primary">{stat.value}</div>
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
              {tab === "Items" && (
                <span className="ml-1.5 text-xs text-text-tertiary">(1,000)</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "Items" && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filter Sidebar */}
          <aside className="hidden lg:block w-56 flex-shrink-0 space-y-6">
            <div>
              <h3 className="text-xs uppercase tracking-wider text-text-secondary mb-3 font-medium">Status</h3>
              <div className="space-y-2">
                {["Buy Now", "Has Offers", "Recently Listed"].map((s) => (
                  <label key={s} className="flex items-center gap-2.5 cursor-pointer group">
                    <span className="w-4 h-4 rounded border border-border-default bg-bg-overlay group-hover:border-border-strong transition-colors flex-shrink-0" />
                    <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">{s}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs uppercase tracking-wider text-text-secondary mb-3 font-medium">Price Range</h3>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  className="w-full h-9 rounded-md border border-border-default bg-bg-overlay px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-border-strong"
                />
                <span className="text-text-tertiary text-sm">–</span>
                <input
                  type="number"
                  placeholder="Max"
                  className="w-full h-9 rounded-md border border-border-default bg-bg-overlay px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-border-strong"
                />
              </div>
            </div>

            <div>
              <h3 className="text-xs uppercase tracking-wider text-text-secondary mb-3 font-medium">Traits</h3>
              {["Background", "Eyes", "Body", "Accessory"].map((trait) => (
                <button
                  key={trait}
                  className="w-full text-left flex items-center justify-between py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  <span>{trait}</span>
                  <span className="text-text-tertiary">›</span>
                </button>
              ))}
            </div>
          </aside>

          {/* Grid */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search items..."
                    className="w-full h-9 rounded-md border border-border-default bg-bg-overlay pl-9 pr-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-border-strong"
                  />
                </div>
                <button className="lg:hidden flex items-center gap-1.5 h-9 px-3 rounded-md border border-border-default bg-bg-overlay text-sm text-text-secondary hover:text-text-primary transition-colors">
                  <SlidersHorizontal className="w-4 h-4" /> Filters
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-text-tertiary hidden sm:block">{filteredItems.length} items</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-9 rounded-md border border-border-default bg-bg-overlay px-3 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-border-strong"
                >
                  {SORT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredItems.map((item) => (
                  <NFTCard key={item.id} name={item.name} chain={item.chain} price={item.price} />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <p className="text-text-secondary">No items match your search.</p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-3 text-sm text-text-tertiary hover:text-text-primary transition-colors underline"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "Activity" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-tertiary text-xs uppercase tracking-wider border-b border-border-subtle">
                <th className="pb-3 font-medium">Event</th>
                <th className="pb-3 font-medium">Item</th>
                <th className="pb-3 font-medium">Price</th>
                <th className="pb-3 font-medium">From</th>
                <th className="pb-3 font-medium">To</th>
                <th className="pb-3 font-medium text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {ACTIVITY.map((a) => (
                <tr key={a.id} className="hover:bg-bg-elevated/40 transition-colors">
                  <td className="py-3">
                    <span
                      className={`text-xs font-medium ${
                        a.type === "Sale" ? "text-semantic-success" : "text-semantic-info"
                      }`}
                    >
                      {a.type}
                    </span>
                  </td>
                  <td className="py-3 text-text-primary">{a.item}</td>
                  <td className="py-3 font-mono text-text-secondary">{a.price}</td>
                  <td className="py-3 font-mono text-text-tertiary text-xs">{a.from}</td>
                  <td className="py-3 font-mono text-text-tertiary text-xs">{a.to}</td>
                  <td className="py-3 text-text-tertiary text-right">{a.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
