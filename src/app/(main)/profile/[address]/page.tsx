"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NFTCard } from "@/components/nft/NFTCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ChainIcon } from "@/components/ui/ChainIcon";
import { Copy, Check, Loader2 } from "lucide-react";
import { useWalletStore } from "@/store/walletStore";
import { useMarketplaceStore } from "@/store/marketplaceStore";
import { useToastStore } from "@/store/toastStore";
import { useProfileStore, DEFAULT_PROFILE, type Profile } from "@/store/profileStore";
import { useHasMounted } from "@/hooks/useHasMounted";
import { cancelListing } from "@/lib/marketplace/solana";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { fetchSolanaOwnedAssets, fetchSolanaCreatedAssets } from "@/lib/nft/solanaAssets";
import type { ApiResponse } from "@/types/api";
import type { OrdinalsAddressInfo } from "@/types/ordinals";

interface OwnedItem {
  id: string;
  name: string;
  chain: "solana" | "bitcoin";
  image?: string;
  collection?: string;
}

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
  const { solanaAddress, btcAddress } = useWalletStore();
  const { listings: storeListings, removeListing, getListing } = useMarketplaceStore();
  const { addToast } = useToastStore();
  const { connection } = useConnection();
  const wallet = useWallet();
  const { getProfile, setProfile } = useProfileStore();
  const hasMounted = useHasMounted();
  const isOwnProfile = hasMounted && ((!!solanaAddress && solanaAddress === address) || (!!btcAddress && btcAddress === address));
  const profile = hasMounted ? getProfile(address) : DEFAULT_PROFILE;

  const [collected, setCollected] = useState<OwnedItem[]>([]);
  const [created, setCreated] = useState<OwnedItem[]>([]);
  const [loadingCollected, setLoadingCollected] = useState(true);
  const [loadingCreated, setLoadingCreated] = useState(true);

  // First-time wallet connections land here with ?setup=1 so they can fill in their profile.
  useEffect(() => {
    if (searchParams.get("setup") === "1" && isOwnProfile) {
      setEditProfileOpen(true);
      router.replace(`/profile/${address}`, { scroll: false });
    }
  }, [searchParams, isOwnProfile, address, router]);

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

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;

    async function load() {
      setLoadingCollected(true);
      setLoadingCreated(true);

      const [solCollected, solCreated] = await Promise.all([
        rpcUrl ? fetchSolanaOwnedAssets(rpcUrl, address).catch(() => []) : Promise.resolve([]),
        rpcUrl ? fetchSolanaCreatedAssets(rpcUrl, address).catch(() => []) : Promise.resolve([]),
      ]);

      const collectedItems: OwnedItem[] = solCollected.map((a) => ({
        id: a.mintAddress,
        name: a.name,
        chain: "solana",
        image: a.image,
        collection: a.collection,
      }));
      const createdItems: OwnedItem[] = solCreated.map((a) => ({
        id: a.mintAddress,
        name: a.name,
        chain: "solana",
        image: a.image,
        collection: a.collection,
      }));

      if (isOwnProfile && btcAddress) {
        try {
          const res = await fetch(`/api/ordinals?address=${encodeURIComponent(btcAddress)}`);
          const json: ApiResponse<OrdinalsAddressInfo> = await res.json();
          if (json.success && json.data) {
            collectedItems.push(
              ...json.data.inscriptions.map((i) => ({
                id: i.id,
                name: `Inscription #${i.number}`,
                chain: "bitcoin" as const,
                image: `https://ordinals.com/content/${i.id}`,
              }))
            );
          }
        } catch {}

        try {
          const res = await fetch(`/api/ordinals?genesis_address=${encodeURIComponent(btcAddress)}`);
          const json: ApiResponse<OrdinalsAddressInfo> = await res.json();
          if (json.success && json.data) {
            createdItems.push(
              ...json.data.inscriptions.map((i) => ({
                id: i.id,
                name: `Inscription #${i.number}`,
                chain: "bitcoin" as const,
                image: `https://ordinals.com/content/${i.id}`,
              }))
            );
          }
        } catch {}
      }

      if (!cancelled) {
        setCollected(collectedItems);
        setCreated(createdItems);
        setLoadingCollected(false);
        setLoadingCreated(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [address, isOwnProfile, btcAddress]);

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

  const listedItems = Object.values(storeListings).filter((l) => l.sellerAddress === address);

  const tabCounts: Record<Tab, number> = {
    Collected: collected.length,
    Created: created.length,
    Listed: listedItems.length,
    Activity: 0,
  };

  const collectionCount = new Set(collected.map((i) => i.collection).filter(Boolean)).size;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Profile Header */}
      {!hasMounted ? (
        <ProfileHeaderSkeleton />
      ) : (
      <section className="rounded-3xl overflow-hidden border border-border-default bg-bg-surface mb-8">
        {/* Banner */}
        <div className={`h-44 md:h-56 bg-bg-elevated ${profile.bannerGradient} relative`}>
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
                { label: "Collected", value: loadingCollected ? "—" : String(collected.length) },
                { label: "Created", value: loadingCreated ? "—" : String(created.length) },
                { label: "Collections", value: loadingCollected ? "—" : String(collectionCount) },
                { label: "Listed", value: String(listedItems.length) },
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
      )}

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
          {loadingCollected ? (
            <GridSkeleton />
          ) : collected.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {collected.map((item) => (
                <NFTCard
                  key={`${item.chain}-${item.id}`}
                  name={item.name}
                  chain={item.chain}
                  image={item.image}
                  price="—"
                  onClick={() => router.push(`/nft/${item.chain}/${item.id}`)}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No NFTs collected yet" cta="Explore Collections" ctaHref="/explore" />
          )}
        </div>
      )}

      {activeTab === "Created" && (
        <div>
          {loadingCreated ? (
            <GridSkeleton />
          ) : created.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {created.map((item) => (
                <NFTCard
                  key={`${item.chain}-${item.id}`}
                  name={item.name}
                  chain={item.chain}
                  image={item.image}
                  price="—"
                  onClick={() => router.push(`/nft/${item.chain}/${item.id}`)}
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
          {listedItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {listedItems.map((item) => (
                <div key={item.mintAddress} className="relative">
                  <NFTCard
                    name={item.nftName}
                    chain={item.chain}
                    image={item.nftImage}
                    price={`${item.priceSOL} ${item.chain === "bitcoin" ? "BTC" : "SOL"}`}
                    onClick={() => router.push(`/nft/${item.chain}/${item.mintAddress}`)}
                  />
                  {isOwnProfile && (
                    <div className="mt-2">
                      <Button
                        variant="danger"
                        size="sm"
                        className="w-full flex items-center justify-center gap-1.5"
                        disabled={delistingMint === item.mintAddress}
                        onClick={() => handleDelist({ name: item.nftName, mintAddress: item.mintAddress })}
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
        <EmptyState message="No activity recorded yet" cta="Explore Collections" ctaHref="/explore" />
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

function ProfileHeaderSkeleton() {
  return (
    <section className="rounded-3xl overflow-hidden border border-border-default bg-bg-surface mb-8 animate-pulse">
      <div className="h-44 md:h-56 bg-bg-elevated" />
      <div className="px-6 pb-6 -mt-10">
        <div className="w-20 h-20 rounded-full border-4 border-bg-base bg-bg-highlight" />
        <div className="mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-40 bg-bg-highlight rounded" />
            <div className="h-4 w-28 bg-bg-highlight rounded" />
            <div className="flex items-center gap-2 mt-2">
              <div className="h-5 w-20 bg-bg-highlight rounded-full" />
              <div className="h-5 w-20 bg-bg-highlight rounded-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[60px] w-20 rounded-xl bg-bg-elevated" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border-default bg-bg-surface overflow-hidden animate-pulse">
          <div className="aspect-square bg-bg-elevated" />
          <div className="p-4 space-y-2">
            <div className="h-4 w-2/3 bg-bg-highlight rounded" />
            <div className="h-3 w-1/3 bg-bg-highlight rounded" />
          </div>
        </div>
      ))}
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
