// Platform fee configuration — hardcoded per SECURITY.md
export const PLATFORM_FEE_BPS = 200; // 2% — never from API
export const SOLANA_PLATFORM_FEE = 0.01; // 0.01 SOL flat minting fee
export const BTC_PLATFORM_FEE = 0.0005; // 0.0005 BTC flat inscription fee
export const METAPLEX_FEE = 0.01; // Metaplex program fee in SOL
export const ARWEAVE_STORAGE_COST_PER_MB = 0.002; // ~0.002 SOL per MB

// Hardcoded platform fee wallets (replace with actual addresses before mainnet)
export const PLATFORM_FEE_WALLET_SOLANA = null;
export const PLATFORM_FEE_ADDRESS_BTC = 'YOUR_HARDCODED_BTC_ADDRESS_HERE';

// Chain IDs and networks
export const SOLANA_NETWORK = 'mainnet-beta';
export const SOLANA_DEVNET = 'devnet';
export const BITCOIN_NETWORK = 'mainnet';
export const BITCOIN_TESTNET = 'testnet';

// File upload limits
export const FILE_SIZE_LIMITS = {
  solana: 50 * 1024 * 1024, // 50MB
  bitcoin: 4 * 1024 * 1024, // 4MB
} as const;

export const ALLOWED_MIME_TYPES_SOLANA = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
] as const;

export const ALLOWED_MIME_TYPES_BITCOIN = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'text/html',
  'text/plain',
] as const;

// NFT grid layout
export const NFT_GRID_COLUMNS = {
  default: 1,
  sm: 2,
  md: 2,
  lg: 3,
  xl: 4,
  '2xl': 5,
} as const;

// Pagination
export const PAGE_SIZE = 20;
export const ACTIVITY_PAGE_SIZE = 25;

// Max limits
export const MAX_NAME_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 2000;
export const MAX_ATTRIBUTES = 20;
export const MAX_ROYALTY_BPS = 5000; // 50%
export const MAX_BIO_LENGTH = 160;

// Bitcoin fee rate presets (sat/vB)
export const BTC_FEE_RATES = {
  economy: 10,
  standard: 25,
  priority: 50,
} as const;

// Timeouts
export const TOAST_DURATION = 5000;
export const SEARCH_DEBOUNCE_MS = 300;
export const USD_PRICE_REFRESH_MS = 30000;
export const ACTIVITY_REALTIME_MS = 10000;

// Storage keys
export const STORAGE_KEYS = {
  WALLET_STATE: 'auric-wallet-storage',
  THEME: 'auric-theme',
} as const;

// Supabase Storage buckets
export const SUPABASE_BUCKETS = {
  MEDIA: 'media',
  METADATA: 'metadata',
} as const;