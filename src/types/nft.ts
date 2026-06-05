export type ChainType = 'solana' | 'bitcoin';

export interface NFTAttribute {
  trait_type: string;
  value: string;
  frequency?: number;
  rarity_percentage?: number;
}

export interface NFTMetadata {
  name: string;
  description?: string;
  image: string;
  external_url?: string;
  attributes?: NFTAttribute[];
  properties?: {
    files: { uri: string; type: string }[];
    category: string;
  };
}

export interface NFT {
  id: string;
  chain: ChainType;
  mint_address?: string;
  inscription_id?: string;
  collection_id?: string;
  name: string;
  description?: string;
  image_url: string;
  metadata_url?: string;
  owner_wallet: string;
  creator_wallet: string;
  attributes?: NFTAttribute[];
  rarity_rank?: number;
  last_sale_price?: number;
  is_listed: boolean;
  listed_price?: number;
  created_at: string;
  updated_at: string;
}

export interface NFTCardData {
  id: string;
  name: string;
  chain: ChainType;
  image: string;
  price?: string;
  price_lamports?: number;
  collection_name?: string;
  collection_slug?: string;
  is_verified?: boolean;
  token_id?: string;
  like_count?: number;
}

export interface Collection {
  id: string;
  slug: string;
  name: string;
  description?: string;
  chain: ChainType;
  creator_wallet: string;
  logo_url?: string;
  banner_url?: string;
  symbol?: string;
  royalty_bps: number;
  is_verified: boolean;
  external_url?: string;
  floor_price_lamports?: number;
  total_volume_lamports: number;
  item_count: number;
  owner_count: number;
  created_at: string;
}

export interface CollectionStats {
  floor_price?: number;
  best_offer?: number;
  volume_24h: number;
  total_volume: number;
  items: number;
  owners: number;
}

export interface Listing {
  id: string;
  nft_id: string;
  seller_wallet: string;
  price_lamports: number;
  chain: ChainType;
  listing_tx?: string;
  status: 'active' | 'sold' | 'cancelled';
  buyer_wallet?: string;
  sold_at?: string;
  created_at: string;
}

export interface Activity {
  id: string;
  type: 'mint' | 'list' | 'delist' | 'sale' | 'transfer' | 'inscribe';
  nft_id?: string;
  collection_id?: string;
  from_wallet?: string;
  to_wallet?: string;
  price_lamports?: number;
  tx_signature?: string;
  chain: ChainType;
  created_at: string;
}