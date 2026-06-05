"use client";

import React from "react";

interface ChainIconProps {
  chain: "solana" | "bitcoin";
  size?: number;
  className?: string;
}

export function SolanaIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.75)}
      viewBox="0 0 16 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ci-sol-g" x1="0" y1="6" x2="16" y2="6" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9945FF" />
          <stop offset="1" stopColor="#14F195" />
        </linearGradient>
      </defs>
      {/* Three Solana-style parallelogram bars */}
      <path d="M3.5 0.5 L14 0.5 L12.5 2.5 L2 2.5 Z"  fill="url(#ci-sol-g)" />
      <path d="M2 5 L12.5 5 L14 7 L3.5 7 Z"           fill="url(#ci-sol-g)" />
      <path d="M3.5 9.5 L14 9.5 L12.5 11.5 L2 11.5 Z" fill="url(#ci-sol-g)" />
    </svg>
  );
}

export function BitcoinIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="8" fill="#FF9800" />
      {/* Simplified Bitcoin B */}
      <path d="M5.5 4H5V12H5.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path
        d="M5.5 4H9C10.1 4 11 4.9 11 6C11 7.1 10.1 8 9 8H5.5"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M5.5 8H9.5C10.88 8 12 9.12 12 10.5C12 11.88 10.88 13 9.5 13H5.5"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Tick marks */}
      <line x1="7" y1="3" x2="7" y2="4.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="9" y1="3" x2="9" y2="4.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="7" y1="11.5" x2="7" y2="13" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="9" y1="11.5" x2="9" y2="13" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function ChainIcon({ chain, size = 16, className }: ChainIconProps) {
  if (chain === "solana") return <SolanaIcon size={size} className={className} />;
  return <BitcoinIcon size={size} className={className} />;
}

export default ChainIcon;
