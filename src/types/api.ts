export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}

export interface UploadResponse {
  url: string;
  arweave_id?: string;
}

export interface MetadataResponse {
  metadata_url: string;
  arweave_id?: string;
}

export interface FeeEstimateResponse {
  network_fee: number;
  platform_fee: number;
  storage_fee?: number;
  total: number;
  currency: string;
  usd_estimate: number;
}

export interface PlatformStats {
  collections: number;
  nftsMinted: number;
  creators: number;
  totalVolumeSol: number;
}

export interface OrdinalsInscriptionResponse {
  inscription_id: string;
  status: 'pending' | 'confirmed' | 'failed';
  fee: number;
  address: string;
}