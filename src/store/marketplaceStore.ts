import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Listing {
  mintAddress: string;
  nftName: string;
  nftImage?: string;
  chain: "solana" | "bitcoin";
  sellerAddress: string;
  priceSOL: number;
  royaltyBps: number;
  expiresAt: number;
  txSignature: string;
  listingAddress: string;
  listedAt: number;
}

interface MarketplaceState {
  listings: Record<string, Listing>;
  addListing: (listing: Listing) => void;
  removeListing: (mintAddress: string) => void;
  getListing: (mintAddress: string) => Listing | undefined;
}

export const useMarketplaceStore = create<MarketplaceState>()(
  persist(
    (set, get) => ({
      listings: {},
      addListing: (listing) =>
        set((s) => ({ listings: { ...s.listings, [listing.mintAddress]: listing } })),
      removeListing: (mintAddress) =>
        set((s) => {
          const next = { ...s.listings };
          delete next[mintAddress];
          return { listings: next };
        }),
      getListing: (mintAddress) => get().listings[mintAddress],
    }),
    { name: "auric-marketplace" }
  )
);
