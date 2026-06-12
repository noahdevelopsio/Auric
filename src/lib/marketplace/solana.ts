import { Connection, PublicKey } from "@solana/web3.js";
import type { Metaplex, WalletAdapter } from "@metaplex-foundation/js";

// @metaplex-foundation/js is large (~400kB); load it on demand so it doesn't
// inflate the initial bundle of every page that can render a listing/buy modal.
const loadMetaplexSdk = () => import("@metaplex-foundation/js");

export const PLATFORM_FEE_BPS = 250;   // 2.5%
export const DEFAULT_ROYALTY_BPS = 500; // 5%

const AUCTION_HOUSE_ADDRESS = process.env.NEXT_PUBLIC_AUCTION_HOUSE_ADDRESS;

export interface ListingParams {
  connection: Connection;
  wallet: WalletAdapter;
  sellerPublicKey: PublicKey;
  mintAddress: string;
  priceSOL: number;
  durationDays: number;
  royaltyBps?: number;
}

export interface BuyParams {
  connection: Connection;
  wallet: WalletAdapter;
  buyerPublicKey: PublicKey;
  mintAddress: string;
  listingAddress: string;
  priceSOL: number;
  sellerAddress: string;
  royaltyBps: number;
}

export interface CancelListingParams {
  connection: Connection;
  wallet: WalletAdapter;
  sellerPublicKey: PublicKey;
  mintAddress: string;
  listingAddress: string;
}

export interface ListingResult {
  txSignature: string;
  listingAddress: string;
}

export interface BuyResult {
  txSignature: string;
}

export interface CancelListingResult {
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

// Loads the configured Auction House. Legacy Auction House listings don't carry an
// on-chain expiry, so `durationDays` is tracked client-side only for display purposes.
async function loadAuctionHouse(metaplex: Metaplex) {
  if (!AUCTION_HOUSE_ADDRESS) {
    throw new Error(
      "Auction House is not configured. Set NEXT_PUBLIC_AUCTION_HOUSE_ADDRESS."
    );
  }
  return metaplex.auctionHouse().findByAddress({ address: new PublicKey(AUCTION_HOUSE_ADDRESS) });
}

export async function createListing(params: ListingParams): Promise<ListingResult> {
  const { connection, wallet, mintAddress, priceSOL } = params;
  const { Metaplex, walletAdapterIdentity, sol } = await loadMetaplexSdk();
  const metaplex = Metaplex.make(connection).use(walletAdapterIdentity(wallet));
  const auctionHouse = await loadAuctionHouse(metaplex);

  const { listing, response } = await metaplex.auctionHouse().list({
    auctionHouse,
    mintAccount: new PublicKey(mintAddress),
    price: sol(priceSOL),
  });

  return {
    txSignature: response.signature,
    listingAddress: listing.tradeStateAddress.toString(),
  };
}

export async function cancelListing(params: CancelListingParams): Promise<CancelListingResult> {
  const { connection, wallet, listingAddress } = params;
  const { Metaplex, walletAdapterIdentity } = await loadMetaplexSdk();
  const metaplex = Metaplex.make(connection).use(walletAdapterIdentity(wallet));
  const auctionHouse = await loadAuctionHouse(metaplex);

  const listing = await metaplex.auctionHouse().findListingByTradeState({
    tradeStateAddress: new PublicKey(listingAddress),
    auctionHouse,
  });

  const { response } = await metaplex.auctionHouse().cancelListing({ auctionHouse, listing });

  return { txSignature: response.signature };
}

export async function executeBuy(params: BuyParams): Promise<BuyResult> {
  const { connection, wallet, listingAddress } = params;
  const { Metaplex, walletAdapterIdentity } = await loadMetaplexSdk();
  const metaplex = Metaplex.make(connection).use(walletAdapterIdentity(wallet));
  const auctionHouse = await loadAuctionHouse(metaplex);

  const listing = await metaplex.auctionHouse().findListingByTradeState({
    tradeStateAddress: new PublicKey(listingAddress),
    auctionHouse,
  });

  const { response } = await metaplex.auctionHouse().buy({ auctionHouse, listing });

  return { txSignature: response.signature };
}
