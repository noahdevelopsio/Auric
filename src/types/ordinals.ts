export interface OrdinalsInscription {
  id: string;
  number: number;
  address: string;
  content_type: string;
  content_length: number;
  content?: string;
  sat: number;
  satpoint: string;
  timestamp: number;
  genesis_tx_id: string;
  current_tx_id: string;
  owner: string;
  fee: number;
  parent?: string;
  children?: string[];
}

export interface OrdinalsAddressInfo {
  address: string;
  inscriptions: OrdinalsInscription[];
  total_inscriptions: number;
  total_size: number;
}

export interface FeeRateEstimate {
  economy: number;
  standard: number;
  priority: number;
}

export interface InscriptionRequest {
  file: File;
  feeRate: number;
  recipient: string;
  contentType: string;
}

export interface PsbtData {
  psbt: string;
  inscriptionId?: string;
  fees: number;
  size: number;
}