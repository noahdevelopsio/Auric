import { FILE_SIZE_LIMITS, MAX_NAME_LENGTH, MAX_DESCRIPTION_LENGTH, MAX_ATTRIBUTES, MAX_ROYALTY_BPS, MAX_BIO_LENGTH } from './constants';
import type { ChainType } from '@/types/nft';
import { PublicKey } from '@solana/web3.js';
import * as bitcoin from 'bitcoinjs-lib';

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate NFT name
 */
export function validateName(name: string): string | null {
  if (!name || !name.trim()) return 'Name is required';
  if (name.trim().length > MAX_NAME_LENGTH) return `Name must be ${MAX_NAME_LENGTH} characters or less`;
  if (name.trim().length < 1) return 'Name must be at least 1 character';
  return null;
}

/**
 * Validate NFT description
 */
export function validateDescription(description: string): string | null {
  if (!description) return null; // Optional
  if (description.length > MAX_DESCRIPTION_LENGTH) return `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`;
  return null;
}

/**
 * Validate royalty percentage
 */
export function validateRoyalty(bps: number): string | null {
  if (isNaN(bps)) return 'Royalty must be a number';
  if (bps < 0) return 'Royalty cannot be negative';
  if (bps > MAX_ROYALTY_BPS) return `Royalty cannot exceed ${MAX_ROYALTY_BPS / 100}%`;
  return null;
}

/**
 * Validate attributes array
 */
export function validateAttributes(attributes: { trait_type: string; value: string }[]): string | null {
  if (attributes.length > MAX_ATTRIBUTES) return `Maximum ${MAX_ATTRIBUTES} attributes allowed`;
  for (const attr of attributes) {
    if (!attr.trait_type?.trim()) return 'Each attribute must have a trait type';
    if (!attr.value?.trim()) return 'Each attribute must have a value';
    if (attr.trait_type.length > 50) return 'Trait type must be 50 characters or less';
    if (attr.value.length > 100) return 'Trait value must be 100 characters or less';
  }
  return null;
}

/**
 * Validate file type for a given chain
 */
export function validateFileType(file: File, chain: ChainType): string | null {
  const allowedTypes = chain === 'solana'
    ? ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4']
    : ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'text/html', 'text/plain'];

  if (!allowedTypes.includes(file.type)) {
    const formats = allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ');
    return `Invalid file type for ${chain}. Allowed: ${formats}`;
  }
  return null;
}

/**
 * Validate file size for a given chain
 */
export function validateFileSize(file: File, chain: ChainType): string | null {
  const maxSize = FILE_SIZE_LIMITS[chain];
  if (file.size > maxSize) {
    const maxMB = chain === 'solana' ? '50MB' : '4MB';
    return `File too large. Maximum ${maxMB} for ${chain === 'solana' ? 'Solana' : 'Bitcoin'} NFTs.`;
  }
  return null;
}

/**
 * Validate Solana wallet address — must be a valid base58 public key that lies on the ed25519 curve
 */
export function validateSolanaAddress(address: string): string | null {
  if (!address) return 'Wallet address is required';
  let pubkey: PublicKey;
  try {
    pubkey = new PublicKey(address);
  } catch {
    return 'Invalid Solana wallet address';
  }
  if (!PublicKey.isOnCurve(pubkey.toBytes())) return 'Invalid Solana wallet address';
  return null;
}

/**
 * Validate BTC address — decodes the address against mainnet and testnet to confirm it's well-formed
 */
export function validateBtcAddress(address: string): string | null {
  if (!address) return 'BTC address is required';
  const networks = [bitcoin.networks.bitcoin, bitcoin.networks.testnet];
  const isValid = networks.some((network) => {
    try {
      bitcoin.address.toOutputScript(address, network);
      return true;
    } catch {
      return false;
    }
  });
  if (!isValid) return 'Invalid Bitcoin address';
  return null;
}

/**
 * Validate mint form completely
 */
export function validateMintForm(data: {
  name: string;
  description?: string;
  file: File | null;
  chain: ChainType;
  royaltyBps?: number;
  attributes?: { trait_type: string; value: string }[];
}): ValidationError[] {
  const errors: ValidationError[] = [];

  const nameError = validateName(data.name);
  if (nameError) errors.push({ field: 'name', message: nameError });

  if (data.description) {
    const descError = validateDescription(data.description);
    if (descError) errors.push({ field: 'description', message: descError });
  }

  if (!data.file) {
    errors.push({ field: 'file', message: 'Please upload a file' });
  } else {
    const fileTypeError = validateFileType(data.file, data.chain);
    if (fileTypeError) errors.push({ field: 'file', message: fileTypeError });

    const fileSizeError = validateFileSize(data.file, data.chain);
    if (fileSizeError) errors.push({ field: 'file', message: fileSizeError });
  }

  if (data.royaltyBps !== undefined) {
    const royaltyError = validateRoyalty(data.royaltyBps);
    if (royaltyError) errors.push({ field: 'royalty', message: royaltyError });
  }

  if (data.attributes && data.attributes.length > 0) {
    const attrError = validateAttributes(data.attributes);
    if (attrError) errors.push({ field: 'attributes', message: attrError });
  }

  return errors;
}

/**
 * Validate profile form
 */
export function validateProfile(data: { displayName?: string; bio?: string }): ValidationError[] {
  const errors: ValidationError[] = [];

  if (data.displayName && data.displayName.length > 50) {
    errors.push({ field: 'displayName', message: 'Display name must be 50 characters or less' });
  }

  if (data.bio && data.bio.length > MAX_BIO_LENGTH) {
    errors.push({ field: 'bio', message: `Bio must be ${MAX_BIO_LENGTH} characters or less` });
  }

  return errors;
}

/**
 * Sanitize SVG/HTML content using DOMPurify (for Bitcoin Ordinals rendering)
 */
export function sanitizeContent(content: string): string {
  // Client-side DOMPurify will be imported dynamically
  // This is a placeholder — actual sanitization uses isomorphic-dompurify
  if (typeof window === 'undefined') return content;
  
  // Dynamic import to avoid SSR issues
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const DOMPurify = require('isomorphic-dompurify');
  return DOMPurify.sanitize(content, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['script', 'use'],
    FORBID_ATTR: ['onload', 'onerror', 'onclick', 'xlink:href'],
  });
}