export interface OrdinalListing {
  id: string;
  inscriptionId: string;
  sellerAddress: string;
  sellerPaymentAddress: string;
  priceSats: number;
  utxoTxid: string;
  utxoVout: number;
  utxoValueSats: number;
  status: "active" | "sold" | "cancelled";
  nftName?: string;
  nftImage?: string;
  buyerAddress?: string;
  saleTxId?: string;
  soldAt?: string;
  createdAt: string;
}

export interface SolanaListing {
  id: string;
  mintAddress: string;
  listingAddress: string;
  sellerAddress: string;
  priceLamports: number;
  royaltyBps: number;
  txSignature: string;
  status: "active" | "sold" | "cancelled";
  nftName?: string;
  nftImage?: string;
  buyerAddress?: string;
  saleTxSignature?: string;
  soldAt?: string;
  expiresAt?: string;
  createdAt: string;
}

// Chain-agnostic display shape used throughout the frontend (marketplace grid,
// NFT detail "Buy Now" box, profile "Listed" tab) and returned by
// /api/marketplace/listings.
export interface Listing {
  id?: string;
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
  priceSats?: number; // exact sats for bitcoin listings; priceSOL holds priceSats/1e8 for display
}

export interface PreparedListingPsbt {
  psbt: string; // base64, unsigned
  signInputs: Record<string, number[]>; // { [ordinalsAddress]: [0] }
}

export interface PreparedBuyPsbt {
  psbt: string; // base64, combined PSBT (seller input/output + buyer inputs/outputs)
  signInputs: Record<string, number[]>; // { [buyerPaymentAddress]: [...] }
  totalSats: number; // price + network fee buyer pays
  networkFeeSats: number;
  platformFeeSats: number; // included within price, not added to totalSats
}
