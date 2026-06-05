/**
 * Format a wallet address for display (e.g., "7xKp...3mZq")
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Format lamports to SOL with appropriate precision
 */
export function formatLamportsToSol(lamports: number | bigint): string {
  const num = typeof lamports === 'bigint' ? Number(lamports) : lamports;
  const sol = num / 1_000_000_000;
  if (sol >= 1) return `${sol.toFixed(2)} SOL`;
  if (sol >= 0.001) return `${sol.toFixed(4)} SOL`;
  return `${sol.toFixed(6)} SOL`;
}

/**
 * Format satoshis to BTC
 */
export function formatSatoshisToBtc(satoshis: number): string {
  const btc = satoshis / 100_000_000;
  if (btc >= 1) return `${btc.toFixed(4)} BTC`;
  if (btc >= 0.0001) return `${btc.toFixed(6)} BTC`;
  return `${btc.toFixed(8)} BTC`;
}

/**
 * Format USD value
 */
export function formatUsd(value: number): string {
  if (value >= 1) return `≈ $${value.toFixed(2)}`;
  return `≈ $${value.toFixed(4)}`;
}

/**
 * Format a large number with commas (e.g., 1,234,567)
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Format a relative timestamp (e.g., "2 mins ago", "3 hours ago")
 */
export function formatRelativeTime(timestamp: string | Date): string {
  const now = Date.now();
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const diffMs = now - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  
  if (diffSecs < 60) return `${diffSecs}s ago`;
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format bytes to human readable size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a gradient background from a wallet address for avatars
 */
export function addressToGradient(address: string): string {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash % 360);
  const h2 = (h1 + 60) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 60%, 40%), hsl(${h2}, 50%, 30%))`;
}