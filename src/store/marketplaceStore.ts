import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Listing } from "@/types/marketplace";

export type { Listing };

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
