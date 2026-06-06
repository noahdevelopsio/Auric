"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useWalletStore } from "@/store/walletStore";
import { useMarketplaceStore } from "@/store/marketplaceStore";
import { ListingModal } from "@/components/marketplace/ListingModal";
import { BuyModal } from "@/components/marketplace/BuyModal";
import { Copy, ExternalLink, Tag } from "lucide-react";

const TABS = ["Details", "Activity", "Collection"] as const;
type Tab = typeof TABS[number];

const MOCK_MINT = "7xKpBnZq3mRm7fYd3mZqABCDEF123456789abcdef12";
const MOCK_OWNER = "7xKpBnZq3mRm7fYd3mZq";
const ROYALTY_BPS = 500;

export default function NFTDetailPage({ params }: { params: Promise<{ chain: string; id: string }> }) {
  const [activeTab, setActiveTab] = useState<Tab>("Details");
  const [copied, setCopied] = useState(false);
  const [listingOpen, setListingOpen] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  const [chain] = useState("solana");
  const [id] = useState("001");

  if (typeof params === "object" && "then" in params) {
    // params resolved on first render via Next.js — values set via useState defaults above
  }

  const { solanaAddress, openModal } = useWalletStore();
  const { getListing } = useMarketplaceStore();

  const listing = getListing(MOCK_MINT);
  const isOwner = !!solanaAddress;
  const isListed = !!listing;
  const price = listing?.priceSOL ?? 0.5;
  const chainLabel = chain === "bitcoin" ? "Bitcoin Ordinal" : "Solana NFT";
  const contractAddress = "7xKpBnZq3mRm7fYd3mZq";

  const handleCopy = () => {
    navigator.clipboard.writeText(contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-[45%_55%] gap-12 items-start">

        {/* Left Column — Image + Tabs */}
        <div className="space-y-4">
          <div className="rounded-[20px] overflow-hidden border border-border-default bg-bg-surface shadow-xl aspect-square flex items-center justify-center bg-gradient-to-br from-btc-500/15 via-bg-elevated to-sol-purple/15">
            <div className="text-center">
              <div className="text-5xl font-headings font-bold">#{id}</div>
              <div className="text-sm text-text-secondary mt-2">{chainLabel}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm">Share</Button>
            <Button variant="ghost" size="sm">Report</Button>
          </div>

          <div className="border-b border-border-subtle">
            <div className="flex gap-6">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
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

          <div className="mt-2">
            {activeTab === "Details" && (
              <div className="space-y-0 divide-y divide-border-subtle">
                {[
                  { label: "Contract", value: `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`, mono: true, action: handleCopy, actionIcon: copied ? "Copied!" : <Copy className="w-3.5 h-3.5" /> },
                  { label: "Token Standard", value: chain === "bitcoin" ? "Ordinals Protocol" : "Metaplex NFT" },
                  { label: "Chain", value: chainLabel },
                  { label: "Royalties", value: `${ROYALTY_BPS / 100}%` },
                  { label: "Metadata", value: "View on Arweave", link: true },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-3">
                    <span className="text-sm text-text-tertiary">{row.label}</span>
                    <span className={`text-sm text-text-primary flex items-center gap-1.5 ${row.mono ? "font-mono" : ""}`}>
                      {row.value}
                      {row.action && (
                        <button onClick={() => row.action!()} className="text-text-tertiary hover:text-text-primary transition-colors">
                          {row.actionIcon}
                        </button>
                      )}
                      {row.link && <ExternalLink className="w-3 h-3 text-text-tertiary" />}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "Activity" && (
              <div className="divide-y divide-border-subtle">
                {[
                  { event: "Listed", price: `${price} SOL`, from: MOCK_OWNER, date: "Just now" },
                  { event: "Minted", price: "—", from: MOCK_OWNER, date: "2 days ago" },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between py-3 text-sm">
                    <span className={`font-medium ${row.event === "Listed" ? "text-sol-purple" : "text-text-secondary"}`}>{row.event}</span>
                    <span className="font-mono text-text-tertiary">{row.from.slice(0, 4)}…{row.from.slice(-4)}</span>
                    <span className="text-text-primary">{row.price}</span>
                    <span className="text-text-tertiary">{row.date}</span>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "Collection" && (
              <div className="rounded-lg border border-border-default bg-bg-surface p-4 mt-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-btc-500/30 to-sol-purple/30 flex items-center justify-center font-bold font-headings">B</div>
                  <div>
                    <div className="font-medium text-text-primary">Blue Robots</div>
                    <div className="text-xs text-text-tertiary">1,000 items · Solana</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column — Info + Actions */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-text-tertiary">
            <span>Home</span><span>/</span><span>Collection</span><span>/</span>
            <span className="text-text-primary">Blue Robot #{id}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={chain === "bitcoin" ? "btc" : "sol"}>{chainLabel}</Badge>
            <Badge variant="success">Verified</Badge>
            {isListed && <Badge variant="outline">Listed</Badge>}
          </div>

          <div>
            <h1 className="text-3xl md:text-4xl font-headings font-bold">Blue Robot #{id}</h1>
            <div className="mt-2 text-text-secondary text-sm">
              Owned by <span className="font-mono text-text-primary">{MOCK_OWNER}</span>
            </div>
          </div>

          {/* Price / Action Box */}
          <div className="rounded-2xl border border-border-default bg-bg-surface p-5 space-y-4">
            {isListed || !isOwner ? (
              <>
                <div>
                  <div className="text-sm text-text-tertiary mb-1">{isListed ? "Listed price" : "Last sale"}</div>
                  <div className="text-3xl font-headings font-bold">{price} SOL</div>
                  <div className="text-sm text-text-secondary mt-0.5">≈ ${(price * 155).toFixed(2)}</div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {solanaAddress ? (
                    <>
                      <Button
                        variant="sol"
                        size="lg"
                        className="flex-1"
                        onClick={() => setBuyOpen(true)}
                        disabled={isOwner && !isListed}
                      >
                        {isOwner ? "Buy your own?" : "Buy Now"}
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="flex-1"
                        disabled
                      >
                        Make Offer
                      </Button>
                    </>
                  ) : (
                    <Button variant="sol" size="lg" className="w-full" onClick={() => openModal("solana")}>
                      Connect Wallet to Buy
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="text-sm text-text-tertiary mb-1">Status</div>
                  <div className="text-xl font-semibold text-text-secondary">Not listed</div>
                  <div className="text-sm text-text-tertiary mt-0.5">This NFT is not currently for sale.</div>
                </div>
                <Button
                  variant="sol"
                  size="lg"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => setListingOpen(true)}
                >
                  <Tag className="w-4 h-4" /> List for Sale
                </Button>
              </>
            )}

            {isOwner && isListed && (
              <div className="pt-1 border-t border-border-subtle flex items-center justify-between">
                <span className="text-sm text-text-tertiary">Your listing is active</span>
                <button
                  className="text-xs text-semantic-error hover:text-semantic-error/80 transition-colors"
                  onClick={() => {/* TODO: cancel listing */}}
                >
                  Cancel listing
                </button>
              </div>
            )}

            {!isOwner && (
              <div className="text-sm text-text-tertiary pt-1 border-t border-border-subtle">
                Seller: <span className="font-mono text-text-secondary">{MOCK_OWNER}</span>
              </div>
            )}
          </div>

          {/* Attributes */}
          <div>
            <div className="text-xs font-medium text-text-secondary mb-3 uppercase tracking-wide">Attributes</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { trait: "Background", value: "Blue", rarity: "12%" },
                { trait: "Eyes", value: "Laser", rarity: "3%" },
                { trait: "Mouth", value: "Smirk", rarity: "8%" },
                { trait: "Body", value: "Titanium", rarity: "5%" },
                { trait: "Accessory", value: "None", rarity: "40%" },
                { trait: "Rarity", value: "Rare", rarity: "1%" },
              ].map((attr) => (
                <div
                  key={attr.trait}
                  className="rounded-xl border border-border-default bg-bg-overlay p-3 text-center hover:border-border-strong transition-colors"
                >
                  <div className="text-[11px] uppercase tracking-wider text-text-tertiary mb-1">{attr.trait}</div>
                  <div className="text-sm font-medium text-text-primary">{attr.value}</div>
                  <div className="text-xs text-sol-teal mt-0.5">{attr.rarity} have this</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ListingModal
        isOpen={listingOpen}
        onClose={() => setListingOpen(false)}
        mintAddress={MOCK_MINT}
        nftName={`Blue Robot #${id}`}
        royaltyBps={ROYALTY_BPS}
      />
      <BuyModal
        isOpen={buyOpen}
        onClose={() => setBuyOpen(false)}
        mintAddress={MOCK_MINT}
        nftName={`Blue Robot #${id}`}
        priceSOL={price}
        sellerAddress={MOCK_OWNER}
        royaltyBps={ROYALTY_BPS}
        chain="solana"
      />
    </div>
  );
}
