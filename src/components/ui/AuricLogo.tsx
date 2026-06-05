import React from "react";

interface MarkProps {
  size?: number;
}

// ── Alternative mark: Split Gem ──────────────────────────────────────────────
// A diamond faceted into BTC-orange (left) and SOL-purple (right) halves,
// divided by a teal ridge. Represents Auric's "precious dual-chain" identity.
export function AuricGemMark({ size = 32 }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="gem-btc" x1="20" y1="4" x2="4" y2="37" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFB84D" />
          <stop offset="1" stopColor="#E07000" />
        </linearGradient>
        <linearGradient id="gem-sol" x1="20" y1="4" x2="36" y2="37" gradientUnits="userSpaceOnUse">
          <stop stopColor="#B370FF" />
          <stop offset="1" stopColor="#6A10D4" />
        </linearGradient>
      </defs>
      {/* Left diamond facet — BTC orange */}
      <path d="M20 4 L4 22 L20 37 Z" fill="url(#gem-btc)" />
      {/* Right diamond facet — SOL purple */}
      <path d="M20 4 L36 22 L20 37 Z" fill="url(#gem-sol)" />
      {/* Upper-left bevel highlight */}
      <path d="M20 4 L4 22 L20 19 Z" fill="white" fillOpacity="0.13" />
      {/* Upper-right bevel highlight */}
      <path d="M20 4 L36 22 L20 19 Z" fill="white" fillOpacity="0.07" />
      {/* Teal centre ridge */}
      <line x1="20" y1="4" x2="20" y2="37" stroke="#14F195" strokeWidth="1.5" strokeOpacity="0.9" />
      {/* Apex teal dot */}
      <circle cx="20" cy="4" r="2" fill="#14F195" />
    </svg>
  );
}

export function AuricGemLogo({ size = 28, textSize = "text-[18px]", className = "" }: { size?: number; textSize?: string; className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <AuricGemMark size={size} />
      <span className={`font-headings ${textSize} font-bold tracking-[-0.02em]`}>
        <span className="bg-gradient-to-r from-btc-500 via-[#14F195] to-sol-purple bg-clip-text text-transparent">
          Auric
        </span>
      </span>
    </span>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export function AuricMark({ size = 32 }: MarkProps) {
  const s = size;
  // Viewbox is 40×40; scale proportionally
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="am-btc" x1="20" y1="36" x2="4" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF9800" />
          <stop offset="1" stopColor="#FFB84D" />
        </linearGradient>
        <linearGradient id="am-sol" x1="20" y1="36" x2="36" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9945FF" />
          <stop offset="1" stopColor="#B370FF" />
        </linearGradient>
        <linearGradient id="am-cross" x1="11" y1="23" x2="29" y2="23" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF9800" />
          <stop offset="0.45" stopColor="#14F195" />
          <stop offset="1" stopColor="#9945FF" />
        </linearGradient>
      </defs>
      {/* Left leg — BTC orange */}
      <line x1="20" y1="4" x2="4" y2="36" stroke="url(#am-btc)" strokeWidth="7" strokeLinecap="round" />
      {/* Right leg — SOL purple */}
      <line x1="20" y1="4" x2="36" y2="36" stroke="url(#am-sol)" strokeWidth="7" strokeLinecap="round" />
      {/* Crossbar — teal bridge */}
      <line x1="11" y1="23" x2="29" y2="23" stroke="url(#am-cross)" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

interface AuricLogoProps {
  size?: number;
  textSize?: string;
  className?: string;
}

export function AuricLogo({ size = 28, textSize = "text-[18px]", className = "" }: AuricLogoProps) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <AuricMark size={size} />
      <span className={`font-headings ${textSize} font-bold tracking-[-0.02em]`}>
        <span className="text-text-primary">Aur</span>
        <span className="bg-gradient-sol bg-clip-text text-transparent">ic</span>
      </span>
    </span>
  );
}

export default AuricLogo;
