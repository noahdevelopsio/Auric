import { describe, it, expect, beforeEach } from "vitest";
import { useMarketplaceStore } from "@/store/marketplaceStore";
import type { Listing } from "@/store/marketplaceStore";

const MOCK_LISTING: Listing = {
  mintAddress: "mint_abc123",
  nftName: "Test NFT #1",
  chain: "solana",
  sellerAddress: "7xKpBnZq3mRm7fYd3mZq",
  priceSOL: 5.0,
  royaltyBps: 500,
  expiresAt: Date.now() + 86400000,
  txSignature: "txSig123",
  listingAddress: "listingAddr123",
  listedAt: Date.now(),
};

describe("marketplaceStore", () => {
  beforeEach(() => {
    useMarketplaceStore.setState({ listings: {} });
  });

  it("starts with an empty listings map", () => {
    const { listings } = useMarketplaceStore.getState();
    expect(Object.keys(listings)).toHaveLength(0);
  });

  it("addListing stores a listing by mintAddress", () => {
    useMarketplaceStore.getState().addListing(MOCK_LISTING);
    const { listings } = useMarketplaceStore.getState();
    expect(listings["mint_abc123"]).toEqual(MOCK_LISTING);
  });

  it("getListing returns the correct listing", () => {
    useMarketplaceStore.getState().addListing(MOCK_LISTING);
    const found = useMarketplaceStore.getState().getListing("mint_abc123");
    expect(found).toEqual(MOCK_LISTING);
  });

  it("getListing returns undefined for unknown mintAddress", () => {
    const found = useMarketplaceStore.getState().getListing("nonexistent");
    expect(found).toBeUndefined();
  });

  it("removeListing removes the correct listing", () => {
    useMarketplaceStore.getState().addListing(MOCK_LISTING);
    useMarketplaceStore.getState().removeListing("mint_abc123");
    const { listings } = useMarketplaceStore.getState();
    expect(listings["mint_abc123"]).toBeUndefined();
  });

  it("addListing overwrites existing listing for same mintAddress", () => {
    useMarketplaceStore.getState().addListing(MOCK_LISTING);
    const updated = { ...MOCK_LISTING, priceSOL: 9.9 };
    useMarketplaceStore.getState().addListing(updated);
    const found = useMarketplaceStore.getState().getListing("mint_abc123");
    expect(found?.priceSOL).toBe(9.9);
  });

  it("can store multiple listings independently", () => {
    const second: Listing = { ...MOCK_LISTING, mintAddress: "mint_xyz999", nftName: "NFT #2" };
    useMarketplaceStore.getState().addListing(MOCK_LISTING);
    useMarketplaceStore.getState().addListing(second);
    const { listings } = useMarketplaceStore.getState();
    expect(Object.keys(listings)).toHaveLength(2);
  });

  it("removeListing leaves other listings intact", () => {
    const second: Listing = { ...MOCK_LISTING, mintAddress: "mint_xyz999" };
    useMarketplaceStore.getState().addListing(MOCK_LISTING);
    useMarketplaceStore.getState().addListing(second);
    useMarketplaceStore.getState().removeListing("mint_abc123");
    const { listings } = useMarketplaceStore.getState();
    expect(listings["mint_xyz999"]).toBeDefined();
    expect(listings["mint_abc123"]).toBeUndefined();
  });
});
