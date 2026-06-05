import React from "react";

interface IconProps {
  size?: number;
  className?: string;
}

// Phantom — official SVG from @solana/wallet-adapter-phantom
export function PhantomIcon({ size = 28, className }: IconProps) {
  return (
    <img
      src="/wallets/phantom.svg"
      alt="Phantom"
      width={size}
      height={size}
      className={className}
      style={{ borderRadius: size * 0.24, display: "block" }}
    />
  );
}

// Solflare — official SVG from @solana/wallet-adapter-solflare
export function SolflareIcon({ size = 28, className }: IconProps) {
  return (
    <img
      src="/wallets/solflare.svg"
      alt="Solflare"
      width={size}
      height={size}
      className={className}
      style={{ borderRadius: size * 0.24, display: "block" }}
    />
  );
}

// Backpack — hand-crafted brand-accurate icon
export function BackpackIcon({ size = 28, className }: IconProps) {
  return (
    <img
      src="/wallets/backpack.svg"
      alt="Backpack"
      width={size}
      height={size}
      className={className}
      style={{ borderRadius: "50%", display: "block" }}
    />
  );
}

// Xverse — hand-crafted icon
export function XverseIcon({ size = 28, className }: IconProps) {
  return (
    <img
      src="/wallets/xverse.svg"
      alt="Xverse"
      width={size}
      height={size}
      className={className}
      style={{ borderRadius: "50%", display: "block" }}
    />
  );
}

// Leather — hand-crafted icon
export function LeatherIcon({ size = 28, className }: IconProps) {
  return (
    <img
      src="/wallets/leather.svg"
      alt="Leather"
      width={size}
      height={size}
      className={className}
      style={{ borderRadius: "50%", display: "block" }}
    />
  );
}

// Solana chain icon — official Solana Foundation brand paths (3 gradient bars)
export function SolanaChainIcon({ size = 40, className }: IconProps) {
  return (
    <span
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: size * 0.25,
        background: "#12003A",
        flexShrink: 0,
      }}
    >
      <img
        src="/chains/solana.svg"
        alt="Solana"
        width={Math.round(size * 0.72)}
        height={Math.round(size * 0.56)}
        style={{ display: "block" }}
      />
    </span>
  );
}

// Bitcoin chain icon — official Bitcoin "B" mark on orange disc
export function BitcoinChainIcon({ size = 40, className }: IconProps) {
  return (
    <span
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: size * 0.25,
        background: "#1A0900",
        flexShrink: 0,
      }}
    >
      <img
        src="/chains/bitcoin.svg"
        alt="Bitcoin"
        width={Math.round(size * 0.72)}
        height={Math.round(size * 0.72)}
        style={{ display: "block", borderRadius: "50%" }}
      />
    </span>
  );
}

const WALLET_ICON_MAP: Record<string, React.ComponentType<IconProps>> = {
  phantom: PhantomIcon,
  backpack: BackpackIcon,
  solflare: SolflareIcon,
  xverse: XverseIcon,
  leather: LeatherIcon,
};

export function WalletIcon({ id, size = 28, className }: { id: string } & IconProps) {
  const Icon = WALLET_ICON_MAP[id];
  if (!Icon) {
    return (
      <span
        className={`flex items-center justify-center rounded-lg bg-bg-overlay text-text-tertiary text-xs font-bold ${className ?? ""}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        W
      </span>
    );
  }
  return <Icon size={size} className={className} />;
}
