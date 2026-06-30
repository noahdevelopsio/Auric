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

export function WalletConnectIcon({ size = 28, className }: IconProps) {
  return (
    <span
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: size * 0.24,
        background: "#3B99FC",
        flexShrink: 0,
      }}
    >
      <svg width={Math.round(size * 0.65)} height={Math.round(size * 0.4)} viewBox="0 0 40 25" fill="none">
        <path
          d="M8.19 6.3C14.7.3 25.3.3 31.81 6.3l.7.65a.7.7 0 010 1.02l-2.4 2.26a.37.37 0 01-.51 0l-.97-.9c-4.53-4.22-11.88-4.22-16.41 0l-1.04.97a.37.37 0 01-.51 0L8.28 8.04a.7.7 0 010-1.02l-.09-.72zm10.34 9.1l1.47 1.37 1.47-1.37a.37.37 0 01.51 0l4.75 4.44a.7.7 0 010 1.02l-6.22 5.82a.37.37 0 01-.51 0l-6.22-5.82a.7.7 0 010-1.02l4.75-4.44a.37.37 0 01.51 0zm-8.05-3.54l2.4 2.26a.37.37 0 010 .51l-1.79 1.67a.7.7 0 010 1.02l-4.82 4.5a.37.37 0 01-.51 0L.34 16.35a.7.7 0 010-1.02l5.63-5.27a.7.7 0 011 0l3.51 3.28z"
          fill="white"
        />
      </svg>
    </span>
  );
}

const WALLET_ICON_MAP: Record<string, React.ComponentType<IconProps>> = {
  phantom: PhantomIcon,
  backpack: BackpackIcon,
  solflare: SolflareIcon,
  xverse: XverseIcon,
  leather: LeatherIcon,
  walletconnect: WalletConnectIcon,
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
