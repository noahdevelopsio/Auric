import { Connection, PublicKey } from "@solana/web3.js";

export const PLATFORM_FEE_BPS = 250;   // 2.5%
export const DEFAULT_ROYALTY_BPS = 500; // 5%

export interface ListingParams {
  connection: Connection;
  sellerPublicKey: PublicKey;
  mintAddress: string;
  priceSOL: number;
  durationDays: number;
  royaltyBps?: number;
}

export interface BuyParams {
  connection: Connection;
  buyerPublicKey: PublicKey;
  mintAddress: string;
  priceSOL: number;
  sellerAddress: string;
  royaltyBps: number;
}

export interface ListingResult {
  txSignature: string;
  listingAddress: string;
}

export interface BuyResult {
  txSignature: string;
}

export function calcPlatformFee(priceSOL: number): number {
  return (priceSOL * PLATFORM_FEE_BPS) / 10_000;
}

export function calcRoyaltyFee(priceSOL: number, royaltyBps: number): number {
  return (priceSOL * royaltyBps) / 10_000;
}

export function calcSellerProceeds(priceSOL: number, royaltyBps: number): number {
  return priceSOL - calcPlatformFee(priceSOL) - calcRoyaltyFee(priceSOL, royaltyBps);
}

export async function createListing(params: ListingParams): Promise<ListingResult> {
  // TODO: Replace stub with Metaplex Auction House listing:
  // const metaplex = Metaplex.make(params.connection).use(walletAdapterIdentity(wallet));
  // const ah = await metaplex.auctionHouse().findByAddress({ address: AUCTION_HOUSE_ADDRESS });
  // const { listing } = await metaplex.auctionHouse().list({
  //   auctionHouse: ah,
  //   mintAccount: new PublicKey(params.mintAddress),
  //   price: sol(params.priceSOL),
  // });
  // return { txSignature: listing.receipt.toString(), listingAddress: listing.tradeStateAddress.toString() };
  await new Promise((r) => setTimeout(r, 1600));
  return {
    txSignature: Array.from({ length: 88 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789"[Math.floor(Math.random() * 58)]).join(""),
    listingAddress: Array.from({ length: 44 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789"[Math.floor(Math.random() * 58)]).join(""),
  };
}

export async function executeBuy(params: BuyParams): Promise<BuyResult> {
  // TODO: Replace stub with Metaplex Auction House buy + executeSale:
  // const metaplex = Metaplex.make(params.connection).use(walletAdapterIdentity(wallet));
  // const ah = await metaplex.auctionHouse().findByAddress({ address: AUCTION_HOUSE_ADDRESS });
  // const listing = await metaplex.auctionHouse().findListingByAddress({ address: listingTradeState });
  // const { purchase } = await metaplex.auctionHouse().buy({ auctionHouse: ah, listing });
  // return { txSignature: purchase.response.signature };
  await new Promise((r) => setTimeout(r, 1600));
  return {
    txSignature: Array.from({ length: 88 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789"[Math.floor(Math.random() * 58)]).join(""),
  };
}
