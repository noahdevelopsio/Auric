"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Search, Filter } from "lucide-react";

import { NFTCard } from "@/components/nft/NFTCard";

type ChainType = "all" | "solana" | "bitcoin";
type StatusFilter = "buy_now" | "live_auction";

export default function ExplorePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ChainType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState<StatusFilter[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const mockNFTs = [
    { id: 1, name: "Neon Cyberskulls", chain: "solana", image: "", price: "55 SOL", status: "live_auction" as StatusFilter },
    { id: 2, name: "Digital Artifact #251", chain: "bitcoin", image: "", price: "0.2 BTC", status: "buy_now" as StatusFilter },
    { id: 3, name: "Solana Superfriends", chain: "solana", image: "", price: "40 SOL", status: "buy_now" as StatusFilter },
    { id: 4, name: "Inscribed Pepes", chain: "bitcoin", image: "", price: "0.1 BTC", status: "live_auction" as StatusFilter },
  ];

  const toggleStatusFilter = (status: StatusFilter) => {
    setStatusFilters((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const filteredNFTs = mockNFTs
    .filter((nft) => activeTab === "all" || nft.chain === activeTab)
    .filter((nft) => nft.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((nft) => statusFilters.length === 0 || statusFilters.includes(nft.status))
    .filter((nft) => {
      const amount = Number(nft.price.split(" ")[0]);
      if (minPrice && amount < Number(minPrice)) return false;
      if (maxPrice && amount > Number(maxPrice)) return false;
      return true;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-headings font-bold mb-2">Explore Collections</h1>
          <p className="text-text-secondary">Discover the best NFTs across Bitcoin and Solana.</p>
        </div>
        
        <div className="flex bg-bg-elevated/50 p-1 rounded-md">
          <Button 
            variant={activeTab === "all" ? "primary" : "ghost"} 
            size="sm"
            onClick={() => setActiveTab("all")}
          >
            All Chains
          </Button>
          <Button 
            variant={activeTab === "solana" ? "sol" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("solana")}
          >
            Solana
          </Button>
          <Button 
            variant={activeTab === "bitcoin" ? "btc" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("bitcoin")}
          >
            Bitcoin (Ordinals)
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="w-full md:w-64 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <Input
              className="pl-9"
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filters
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-text-secondary mb-2 block">Status</label>
                <div className="flex gap-2">
                  <Badge
                    variant={statusFilters.includes("buy_now") ? "sol" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleStatusFilter("buy_now")}
                  >
                    Buy Now
                  </Badge>
                  <Badge
                    variant={statusFilters.includes("live_auction") ? "sol" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleStatusFilter("live_auction")}
                  >
                    Live Auction
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm text-text-secondary mb-2 block">Price Range</label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    placeholder="Min"
                    className="w-full"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <span className="text-text-secondary">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    className="w-full"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Grid */}
        <div className="flex-1">
          {filteredNFTs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredNFTs.map(nft => (
                <NFTCard
                  key={nft.id}
                  name={nft.name}
                  chain={nft.chain as "solana" | "bitcoin"}
                  price={nft.price}
                  image={nft.image}
                  onClick={() => router.push(`/nft/${nft.chain}/${String(nft.id).padStart(3, "0")}`)}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-text-secondary">No NFTs match your filters.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilters([]);
                  setMinPrice("");
                  setMaxPrice("");
                }}
                className="mt-3 text-sm text-text-tertiary hover:text-text-primary transition-colors underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
