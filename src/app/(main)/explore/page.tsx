"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Search, Filter } from "lucide-react";

import { NFTCard } from "@/components/nft/NFTCard";

type ChainType = "all" | "solana" | "bitcoin";

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<ChainType>("all");

  const mockNFTs = [
    { id: 1, name: "Neon Cyberskulls", chain: "solana", image: "", price: "55 SOL" },
    { id: 2, name: "Digital Artifact #251", chain: "bitcoin", image: "", price: "0.2 BTC" },
    { id: 3, name: "Solana Superfriends", chain: "solana", image: "", price: "40 SOL" },
    { id: 4, name: "Inscribed Pepes", chain: "bitcoin", image: "", price: "0.1 BTC" },
  ];

  const filteredNFTs = activeTab === "all" ? mockNFTs : mockNFTs.filter(nft => nft.chain === activeTab);

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
            <Input className="pl-9" placeholder="Search collections..." />
          </div>
          
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filters
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-text-secondary mb-2 block">Status</label>
                <div className="flex gap-2">
                  <Badge variant="outline" className="cursor-pointer">Buy Now</Badge>
                  <Badge variant="outline" className="cursor-pointer">Live Auction</Badge>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-text-secondary mb-2 block">Price Range</label>
                <div className="flex gap-2 items-center">
                  <Input placeholder="Min" className="w-full" />
                  <span className="text-text-secondary">-</span>
                  <Input placeholder="Max" className="w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredNFTs.map(nft => (
              <NFTCard
                key={nft.id}
                name={nft.name}
                chain={nft.chain as "solana" | "bitcoin"}
                price={nft.price}
                image={nft.image}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
