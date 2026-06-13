"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useWalletStore } from "@/store/walletStore";
import { useMarketplaceStore } from "@/store/marketplaceStore";
import { useToastStore } from "@/store/toastStore";
import { ListingModal } from "@/components/marketplace/ListingModal";
import { BuyModal } from "@/components/marketplace/BuyModal";
import { cancelListing, DEFAULT_ROYALTY_BPS } from "@/lib/marketplace/solana";
import { recordActivity } from "@/lib/utils/activity";
import { fetchSolanaAsset, type SolanaAssetAttribute } from "@/lib/nft/solanaAssets";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Copy, ExternalLink, FileQuestion, Loader2, Tag } from "lucide-react";
import { shortenAddress, formatRelativeTime } from "@/lib/utils/format";
import type { OrdinalsInscription } from "@/types/ordinals";
import type { ApiResponse } from "@/types/api";

const TABS = ["Details", "Activity", "Collection"] as const;
type Tab = typeof TABS[number];

const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";
const HIRO_API_URL = "https://api.hiro.so";

interface AssetDetail {
  name: string;
  image?: string;
  contentType?: string;
  description?: string;
  owner?: string;
  attributes: SolanaAssetAttribute[];
  collectionName?: string;
  collectionImage?: string;
  collectionAddress?: string;
  royaltyBps?: number;
  metadataUrl?: string;
  mintedAt?: number;
  tokenStandard: string;
}

interface ActivityRow {
  event: string;
  price: string;
  from: string;
  date: string;
}

export default function NFTDetailPage({ params }: { params: { chain: string; id: string } }) {
  const { chain, id } = params;
  const [activeTab, setActiveTab] = useState<Tab>("Details");
  const [copied, setCopied] = useState(false);
  const [listingOpen, setListingOpen] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const { solanaAddress, btcAddress, openModal } = useWalletStore();
  const { getListing, removeListing } = useMarketplaceStore();
  const { addToast } = useToastStore();
  const { connection } = useConnection();
  const wallet = useWallet();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    const load = async () => {
      try {
        if (chain === "bitcoin") {
          const res = await fetch(`/api/ordinals?id=${encodeURIComponent(id)}`);
          const json: ApiResponse<OrdinalsInscription> = await res.json();
          if (cancelled) return;
          if (!json.success || !json.data) {
            setNotFound(true);
            return;
          }
          const insc = json.data;
          setAsset({
            name: `Inscription #${insc.number}`,
            image: insc.content_type.startsWith("image/") ? `${HIRO_API_URL}/ordinals/v1/inscriptions/${insc.id}/content` : undefined,
            contentType: insc.content_type,
            owner: insc.owner,
            attributes: [],
            collectionName: insc.parent ? "Parent inscription" : undefined,
            collectionAddress: insc.parent,
            metadataUrl: `https://ordinals.com/inscription/${insc.id}`,
            mintedAt: insc.timestamp,
            tokenStandard: "Ordinals Protocol",
          });
        } else {
          const result = await fetchSolanaAsset(SOLANA_RPC_URL, id);
          if (cancelled) return;
          if (!result) {
            setNotFound(true);
            return;
          }
          let collectionName: string | undefined;
          let collectionImage: string | undefined;
          if (result.collectionAddress) {
            const col = await fetchSolanaAsset(SOLANA_RPC_URL, result.collectionAddress).catch(() => null);
            collectionName = col?.name;
            collectionImage = col?.image;
          }
          if (cancelled) return;
          setAsset({
            name: result.name,
            image: result.image,
            description: result.description,
            owner: result.owner,
            attributes: result.attributes,
            collectionName,
            collectionImage,
            collectionAddress: result.collectionAddress,
            royaltyBps: result.royaltyBps,
            metadataUrl: result.jsonUri,
            tokenStandard: "Metaplex NFT",
          });
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [chain, id]);

  const listing = getListing(id);
  const isListed = !!listing;
  const isOwner =
    chain === "bitcoin"
      ? !!btcAddress && !!asset?.owner && btcAddress === asset.owner
      : !!solanaAddress && !!asset?.owner && solanaAddress === asset.owner;
  const chainLabel = chain === "bitcoin" ? "Bitcoin Ordinal" : "Solana NFT";
  const royaltyBps = asset?.royaltyBps ?? DEFAULT_ROYALTY_BPS;

  const handleCopy = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancelListing = async () => {
    if (!solanaAddress || cancelling || !listing) return;
    setCancelling(true);
    try {
      const result = await cancelListing({
        connection,
        wallet,
        sellerPublicKey: new PublicKey(solanaAddress),
        mintAddress: id,
        listingAddress: listing.listingAddress,
      });
      removeListing(id);
      addToast({ type: "success", message: `Listing for ${asset?.name ?? "this NFT"} cancelled` });
      recordActivity({
        type: "delist",
        chain: "solana",
        nftId: id,
        nftName: asset?.name ?? "Untitled",
        nftImage: asset?.image,
        fromWallet: solanaAddress,
        txSignature: result.txSignature,
      });
    } catch (err: unknown) {
      addToast({ type: "error", message: err instanceof Error ? err.message : "Failed to cancel listing. Please try again." });
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[45%_55%] gap-12 items-start">
          <div className="rounded-[20px] border border-border-default bg-bg-surface animate-pulse aspect-square" />
          <div className="space-y-4">
            <div className="h-6 w-1/3 rounded bg-bg-surface animate-pulse" />
            <div className="h-10 w-2/3 rounded bg-bg-surface animate-pulse" />
            <div className="h-32 rounded-2xl bg-bg-surface animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !asset) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bg-elevated mx-auto mb-4">
          <FileQuestion className="h-7 w-7 text-text-tertiary" />
        </div>
        <p className="font-semibold text-text-primary">NFT not found</p>
        <p className="text-sm text-text-tertiary mt-1">This item doesn&apos;t exist or hasn&apos;t been indexed yet.</p>
      </div>
    );
  }

  const activity: ActivityRow[] = [];
  if (listing) {
    activity.push({
      event: "Listed",
      price: `${listing.priceSOL} SOL`,
      from: listing.sellerAddress,
      date: formatRelativeTime(new Date(listing.listedAt)),
    });
  }
  if (chain === "bitcoin" && asset.mintedAt && asset.owner) {
    activity.push({
      event: "Inscribed",
      price: "—",
      from: asset.owner,
      date: formatRelativeTime(new Date(asset.mintedAt)),
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-[45%_55%] gap-12 items-start">

        {/* Left Column — Image + Tabs */}
        <div className="space-y-4">
          <div className="relative rounded-[20px] overflow-hidden border border-border-default bg-bg-surface shadow-xl aspect-square flex items-center justify-center bg-gradient-to-br from-btc-500/15 via-bg-elevated to-sol-purple/15">
            {asset.image ? (
              <Image src={asset.image} alt={asset.name} fill className="object-cover" />
            ) : (
              <div className="text-center">
                <div className="text-sm text-text-tertiary font-mono">{asset.contentType ?? "NO_IMAGE_DATA"}</div>
                <div className="text-sm text-text-secondary mt-2">{chainLabel}</div>
              </div>
            )}
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
                  { label: "Contract", value: shortenAddress(id, 6), mono: true, action: handleCopy, actionIcon: copied ? "Copied!" : <Copy className="w-3.5 h-3.5" /> },
                  { label: "Token Standard", value: asset.tokenStandard },
                  { label: "Chain", value: chainLabel },
                  { label: "Royalties", value: asset.royaltyBps !== undefined ? `${(asset.royaltyBps / 100).toFixed(1)}%` : "—" },
                  ...(asset.metadataUrl ? [{ label: "Metadata", value: "View metadata", link: true, href: asset.metadataUrl }] : []),
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-3">
                    <span className="text-sm text-text-tertiary">{row.label}</span>
                    {"href" in row && row.href ? (
                      <a href={row.href} target="_blank" rel="noopener noreferrer" className="text-sm text-sol-purple flex items-center gap-1.5 hover:text-sol-purple/80 transition-colors">
                        {row.value}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className={`text-sm text-text-primary flex items-center gap-1.5 ${"mono" in row && row.mono ? "font-mono" : ""}`}>
                        {row.value}
                        {"action" in row && row.action && (
                          <button onClick={() => row.action!()} className="text-text-tertiary hover:text-text-primary transition-colors">
                            {row.actionIcon}
                          </button>
                        )}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {activeTab === "Activity" && (
              <div className="divide-y divide-border-subtle">
                {activity.length > 0 ? (
                  activity.map((row, i) => (
                    <div key={i} className="flex items-center justify-between py-3 text-sm">
                      <span className={`font-medium ${row.event === "Listed" ? "text-sol-purple" : "text-text-secondary"}`}>{row.event}</span>
                      <span className="font-mono text-text-tertiary">{shortenAddress(row.from)}</span>
                      <span className="text-text-primary">{row.price}</span>
                      <span className="text-text-tertiary">{row.date}</span>
                    </div>
                  ))
                ) : (
                  <p className="py-6 text-sm text-text-tertiary text-center">No activity yet.</p>
                )}
              </div>
            )}
            {activeTab === "Collection" && (
              <div className="rounded-lg border border-border-default bg-bg-surface p-4 mt-2">
                {asset.collectionName ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-btc-500/30 to-sol-purple/30 flex-shrink-0 overflow-hidden flex items-center justify-center font-bold font-headings">
                      {asset.collectionImage ? (
                        <Image src={asset.collectionImage} alt={asset.collectionName} width={40} height={40} className="h-full w-full object-cover" />
                      ) : (
                        asset.collectionName.charAt(0)
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-text-primary">{asset.collectionName}</div>
                      {asset.collectionAddress && (
                        <div className="text-xs text-text-tertiary font-mono">{shortenAddress(asset.collectionAddress)}</div>
                      )}
                    </div>
                    {chain === "solana" && asset.collectionAddress && (
                      <a
                        href={`https://solscan.io/token/${asset.collectionAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-tertiary hover:text-text-primary transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-text-tertiary text-center py-2">This item is not part of a collection.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column — Info + Actions */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-text-tertiary">
            <span>Home</span><span>/</span>
            <span className="text-text-primary truncate">{asset.name}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={chain === "bitcoin" ? "btc" : "sol"}>{chainLabel}</Badge>
            {isListed && <Badge variant="outline">Listed</Badge>}
          </div>

          <div>
            <h1 className="text-3xl md:text-4xl font-headings font-bold">{asset.name}</h1>
            {asset.description && (
              <p className="mt-2 text-sm text-text-secondary">{asset.description}</p>
            )}
            {asset.owner && (
              <div className="mt-2 text-text-secondary text-sm">
                Owned by <span className="font-mono text-text-primary">{shortenAddress(asset.owner)}</span>
              </div>
            )}
          </div>

          {/* Price / Action Box */}
          {chain === "solana" ? (
            <div className="rounded-2xl border border-border-default bg-bg-surface p-5 space-y-4">
              {isListed ? (
                <>
                  <div>
                    <div className="text-sm text-text-tertiary mb-1">Listed price</div>
                    <div className="text-3xl font-headings font-bold">{listing!.priceSOL} SOL</div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {solanaAddress ? (
                      isOwner ? (
                        <Button variant="outline" size="lg" className="flex-1" disabled>
                          You own this listing
                        </Button>
                      ) : (
                        <>
                          <Button variant="sol" size="lg" className="flex-1" onClick={() => setBuyOpen(true)}>
                            Buy Now
                          </Button>
                          <Button variant="outline" size="lg" className="flex-1" disabled>
                            Make Offer
                          </Button>
                        </>
                      )
                    ) : (
                      <Button variant="sol" size="lg" className="w-full" onClick={() => openModal("solana")}>
                        Connect Wallet to Buy
                      </Button>
                    )}
                  </div>
                </>
              ) : isOwner ? (
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
              ) : (
                <div>
                  <div className="text-sm text-text-tertiary mb-1">Status</div>
                  <div className="text-xl font-semibold text-text-secondary">Not listed</div>
                  <div className="text-sm text-text-tertiary mt-0.5">This NFT is not currently for sale.</div>
                </div>
              )}

              {isOwner && isListed && (
                <div className="pt-1 border-t border-border-subtle flex items-center justify-between">
                  <span className="text-sm text-text-tertiary">Your listing is active</span>
                  <button
                    className="text-xs text-semantic-error hover:text-semantic-error/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    disabled={cancelling}
                    onClick={handleCancelListing}
                  >
                    {cancelling && <Loader2 className="w-3 h-3 animate-spin" />}
                    {cancelling ? "Cancelling…" : "Cancel listing"}
                  </button>
                </div>
              )}

              {!isOwner && isListed && (
                <div className="text-sm text-text-tertiary pt-1 border-t border-border-subtle">
                  Seller: <span className="font-mono text-text-secondary">{shortenAddress(listing!.sellerAddress)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-border-default bg-bg-surface p-5">
              <div className="text-sm text-text-tertiary mb-1">Status</div>
              <div className="text-xl font-semibold text-text-secondary">Not listed</div>
              <div className="text-sm text-text-tertiary mt-0.5">Marketplace trading for Bitcoin Ordinals is coming soon.</div>
            </div>
          )}

          {/* Attributes */}
          {asset.attributes.length > 0 && (
            <div>
              <div className="text-xs font-medium text-text-secondary mb-3 uppercase tracking-wide">Attributes</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {asset.attributes.map((attr) => (
                  <div
                    key={attr.trait_type}
                    className="rounded-xl border border-border-default bg-bg-overlay p-3 text-center hover:border-border-strong transition-colors"
                  >
                    <div className="text-[11px] uppercase tracking-wider text-text-tertiary mb-1">{attr.trait_type}</div>
                    <div className="text-sm font-medium text-text-primary">{attr.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {chain === "solana" && (
        <>
          <ListingModal
            isOpen={listingOpen}
            onClose={() => setListingOpen(false)}
            mintAddress={id}
            nftName={asset.name}
            nftImage={asset.image}
            royaltyBps={royaltyBps}
          />
          <BuyModal
            isOpen={buyOpen}
            onClose={() => setBuyOpen(false)}
            mintAddress={id}
            listingAddress={listing?.listingAddress ?? ""}
            nftName={asset.name}
            nftImage={asset.image}
            priceSOL={listing?.priceSOL ?? 0}
            sellerAddress={listing?.sellerAddress ?? asset.owner ?? ""}
            royaltyBps={listing?.royaltyBps ?? royaltyBps}
            chain="solana"
          />
        </>
      )}
    </div>
  );
}
