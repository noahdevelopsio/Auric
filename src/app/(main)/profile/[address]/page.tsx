"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NFTCard } from "@/components/nft/NFTCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ChainIcon } from "@/components/ui/ChainIcon";
import { Copy, Check, ExternalLink, Loader2 } from "lucide-react";
import { useWalletStore } from "@/store/walletStore";
import { useMarketplaceStore } from "@/store/marketplaceStore";
import { useToastStore } from "@/store/toastStore";
import { useProfileStore, type Profile } from "@/store/profileStore";
import { cancelListing } from "@/lib/marketplace/solana";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import type { ApiResponse } from "@/types/api";

const COLLECTED = [
  { id: 1, name: "Blue Robot #001", chain: "solana" as const, price: "0.5 SOL" },
  { id: 2, name: "Ordinal Ape #18", chain: "bitcoin" as const, price: "0.07 BTC" },
  { id: 3, name: "Photon Bloom", chain: "solana" as const, price: "1.2 SOL" },
  { id: 4, name: "Hash Relic", chain: "bitcoin" as const, price: "0.03 BTC" },
];

const CREATED = [
  { id: 5, name: "Nebula #01", chain: "solana" as const, price: "2.0 SOL" },
  { id: 6, name: "Void Script", chain: "bitcoin" as const, price: "0.01 BTC" },
];

const LISTED = [
  { id: 1, name: "Blue Robot #001", chain: "solana" as const, price: "0.5 SOL", mintAddress: "7xKpBnZq3mRm7fYd3mZqABCDEF123456789abcdef12" },
];

const ACTIVITY: { id: number; type: string; nft: string; chain: "solana" | "bitcoin"; price: string | null; time: string }[] = [
  { id: 1, type: "Minted", nft: "Blue Robot #001", chain: "solana", price: null, time: "2 hrs ago" },
  { id: 2, type: "Sold", nft: "Photon Bloom", chain: "solana", price: "1.2 SOL", time: "1 day ago" },
  { id: 3, type: "Inscribed", nft: "Hash Relic", chain: "bitcoin", price: null, time: "3 days ago" },
  { id: 4, type: "Listed", nft: "Blue Robot #001", chain: "solana", price: "0.5 SOL", time: "4 hrs ago" },
];

const TABS = ["Collected", "Created", "Listed", "Activity"] as const;
type Tab = typeof TABS[number];

export default function ProfilePage({ params }: { params: { address: string } }) {
  const { address } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab: Tab = (TABS as readonly string[]).includes(tabParam ?? "") ? (tabParam as Tab) : "Collected";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [copied, setCopied] = useState(false);
  const [delistingMint, setDelistingMint] = useState<string | null>(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const { solanaAddress } = useWalletStore();
  const { removeListing, getListing } = useMarketplaceStore();
  const { addToast } = useToastStore();
  const { connection } = useConnection();
  const wallet = useWallet();
  const { getProfile, setProfile } = useProfileStore();
  const isOwnProfile = solanaAddress === address;
  const profile = getProfile(address);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    fetch(`/api/profile?address=${address}`)
      .then((res) => res.json())
      .then((json: ApiResponse<Profile>) => {
        if (cancelled || !json.success || !json.data) return;
        const { displayName, bio, avatarGradient, bannerGradient } = json.data;
        setProfile(address, { displayName, bio, avatarGradient, bannerGradient });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [address, setProfile]);

  const handleDelist = async (item: { name: string; mintAddress: string }) => {
    if (!solanaAddress || delistingMint) return;
    const listing = getListing(item.mintAddress);
    if (!listing) return;
    setDelistingMint(item.mintAddress);
    try {
      await cancelListing({
        connection,
        wallet,
        sellerPublicKey: new PublicKey(solanaAddress),
        mintAddress: item.mintAddress,
        listingAddress: listing.listingAddress,
      });
      removeListing(item.mintAddress);
      addToast({ type: "success", message: `Listing for ${item.name} cancelled` });
    } catch (err: unknown) {
      addToast({ type: "error", message: err instanceof Error ? err.message : "Failed to delist. Please try again." });
    } finally {
      setDelistingMint(null);
    }
  };

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Unknown";

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabCounts: Record<Tab, number> = {
    Collected: COLLECTED.length,
    Created: CREATED.length,
    Listed: LISTED.length,
    Activity: ACTIVITY.length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Profile Header */}
      <section className="rounded-3xl overflow-hidden border border-border-default bg-bg-surface mb-8">
        {/* Banner */}
        <div className={`h-44 md:h-56 bg-gradient-to-r ${profile.bannerGradient} relative`}>
          {isOwnProfile && (
            <button
              onClick={() => setEditProfileOpen(true)}
              className="absolute top-3 right-3 rounded-lg border border-border-default bg-bg-base/70 backdrop-blur-sm px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              Edit Banner
            </button>
          )}
        </div>

        {/* Avatar + Info */}
        <div className="px-6 pb-6 -mt-10">
          <div className={`relative w-20 h-20 rounded-full border-4 border-bg-base bg-gradient-to-br ${profile.avatarGradient} flex items-center justify-center font-headings font-bold text-2xl text-bg-base shadow-lg`}>
            {address ? address.slice(0, 1).toUpperCase() : "U"}
            {isOwnProfile && (
              <button
                onClick={() => setEditProfileOpen(true)}
                aria-label="Edit avatar"
                className="absolute -bottom-1 -right-1 rounded-full bg-bg-elevated border border-border-default w-6 h-6 flex items-center justify-center text-xs text-text-secondary hover:text-text-primary transition-colors"
              >
                ✎
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-headings font-bold text-text-primary">
                {profile.displayName || (isOwnProfile ? "Your Profile" : "Creator Profile")}
              </h1>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 font-mono text-sm text-text-tertiary hover:text-text-secondary transition-colors mt-1 group"
                aria-label="Copy address"
              >
                <span>{shortAddress}</span>
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-semantic-success" />
                ) : (
                  <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
              {profile.bio && (
                <p className="text-sm text-text-secondary mt-2 max-w-md">{profile.bio}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="sol"><span className="flex items-center gap-1"><ChainIcon chain="solana" size={11} /> Solana</span></Badge>
                <Badge variant="btc"><span className="flex items-center gap-1"><ChainIcon chain="bitcoin" size={11} /> Bitcoin</span></Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {[
                { label: "Collected", value: "482" },
                { label: "Created", value: "34" },
                { label: "Collections", value: "3" },
                { label: "Volume", value: "12 SOL" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-border-subtle bg-bg-elevated px-4 py-3 text-center"
                >
                  <div className="font-display font-semibold text-text-primary">{stat.value}</div>
                  <div className="text-text-tertiary text-xs mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {isOwnProfile && (
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={() => setEditProfileOpen(true)}>
                Edit Profile
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Tabs */}
      <div className="border-b border-border-subtle mb-6">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? "border-text-primary text-text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab}
              <span className="ml-1.5 text-xs text-text-tertiary">({tabCounts[tab]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "Collected" && (
        <div>
          {COLLECTED.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {COLLECTED.map((item) => (
                <NFTCard
                  key={item.id}
                  name={item.name}
                  chain={item.chain}
                  price={item.price}
                  onClick={() => router.push(`/nft/${item.chain}/${String(item.id).padStart(3, "0")}`)}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No NFTs collected yet" cta="Explore NFTs" ctaHref="/explore" />
          )}
        </div>
      )}

      {activeTab === "Created" && (
        <div>
          {CREATED.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {CREATED.map((item) => (
                <NFTCard
                  key={item.id}
                  name={item.name}
                  chain={item.chain}
                  price={item.price}
                  onClick={() => router.push(`/nft/${item.chain}/${String(item.id).padStart(3, "0")}`)}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No NFTs created yet" cta="Start Creating" ctaHref="/mint" />
          )}
        </div>
      )}

      {activeTab === "Listed" && (
        <div>
          {LISTED.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {LISTED.map((item) => (
                <div key={item.id} className="relative">
                  <NFTCard
                    name={item.name}
                    chain={item.chain}
                    price={item.price}
                    onClick={() => router.push(`/nft/${item.chain}/${String(item.id).padStart(3, "0")}`)}
                  />
                  {isOwnProfile && (
                    <div className="mt-2">
                      <Button
                        variant="danger"
                        size="sm"
                        className="w-full flex items-center justify-center gap-1.5"
                        disabled={delistingMint === item.mintAddress}
                        onClick={() => handleDelist(item)}
                      >
                        {delistingMint === item.mintAddress && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {delistingMint === item.mintAddress ? "Delisting…" : "Delist"}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No active listings" cta="List an NFT" ctaHref="/mint" />
          )}
        </div>
      )}

      {activeTab === "Activity" && (
        <div className="space-y-1">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-tertiary text-xs uppercase tracking-wider border-b border-border-subtle">
                  <th className="pb-3 font-medium">Event</th>
                  <th className="pb-3 font-medium">Item</th>
                  <th className="pb-3 font-medium">Price</th>
                  <th className="pb-3 font-medium text-right">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {ACTIVITY.map((a) => (
                  <tr key={a.id} className="group hover:bg-bg-elevated/50 transition-colors">
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                          a.type === "Sold"
                            ? "text-semantic-success"
                            : a.type === "Minted"
                            ? "text-sol-teal"
                            : a.type === "Inscribed"
                            ? "text-btc-500"
                            : "text-semantic-info"
                        }`}
                      >
                        {a.type}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="flex items-center gap-2">
                        <span className="text-text-primary">{a.nft}</span>
                        <ExternalLink className="w-3 h-3 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    </td>
                    <td className="py-3 font-mono text-text-secondary">
                      {a.price ?? "—"}
                    </td>
                    <td className="py-3 text-text-tertiary text-right">{a.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card rows */}
          <div className="md:hidden space-y-2">
            {ACTIVITY.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-border-subtle bg-bg-surface p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-bg-elevated flex-shrink-0 flex items-center justify-center text-sm">
                  <ChainIcon chain={a.chain} size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium ${
                        a.type === "Sold" ? "text-semantic-success" : "text-text-secondary"
                      }`}
                    >
                      {a.type}
                    </span>
                    <span className="text-sm text-text-primary truncate">{a.nft}</span>
                  </div>
                  <div className="text-xs text-text-tertiary mt-0.5">
                    {a.price ? `${a.price} · ` : ""}{a.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isOwnProfile && (
        <EditProfileModal
          isOpen={editProfileOpen}
          onClose={() => setEditProfileOpen(false)}
          address={address}
        />
      )}
    </div>
  );
}

function EmptyState({
  message,
  cta,
  ctaHref,
}: {
  message: string;
  cta: string;
  ctaHref: string;
}) {
  return (
    <div className="py-20 text-center">
      <div className="text-4xl mb-4">🖼️</div>
      <p className="text-text-secondary font-medium">{message}</p>
      <div className="mt-4">
        <a
          href={ctaHref}
          className="inline-flex items-center justify-center h-10 px-4 rounded-md border border-border-default text-sm text-text-primary hover:bg-bg-elevated transition-colors"
        >
          {cta}
        </a>
      </div>
    </div>
  );
}
