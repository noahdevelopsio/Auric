"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Particles from "./Particles";
import { SolanaIcon, BitcoinIcon } from "@/components/ui/ChainIcon";

export function Hero() {
  const [particleCount, setParticleCount] = useState(36);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w >= 1280) setParticleCount(40);
      else if (w < 768) setParticleCount(15);
      else setParticleCount(28);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const indicator = indicatorRef.current;
    const section = sectionRef.current;

    if (motionQuery.matches) {
      if (indicator) indicator.style.display = "none";
      return;
    }

    if (!section || !indicator) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (indicator) {
            indicator.style.display = entry.isIntersecting ? "" : "none";
          }
        });
      },
      { threshold: 0 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[70vh] lg:min-h-screen flex items-center justify-center text-center overflow-hidden py-20 lg:py-24"
    >
      <Particles count={particleCount} />

      <div className="relative z-10 max-w-4xl px-4 flex flex-col items-center">
        <p className="mb-5 text-xs md:text-sm uppercase tracking-[0.28em] text-text-secondary">
          Bitcoin &amp; Solana NFTs — One Platform
        </p>
        <h1 className="font-headings font-bold text-text-primary mb-5 leading-tight tracking-[-0.02em] text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
          <span className="block">Create Forever.</span>
          <span className="block">On Both Chains.</span>
        </h1>
        <p className="text-text-secondary text-base md:text-lg max-w-[600px] mx-auto mb-8">
          Mint NFTs on Solana for speed and scale. Inscribe on Bitcoin for permanence and prestige. Your art deserves both.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/mint"
            className="inline-flex items-center justify-center h-12 px-6 text-lg rounded-md bg-sol-500 text-bg-base hover:opacity-90 font-display font-medium transition-all focus:outline-none focus:ring-2 focus:ring-border-strong"
          >
            Start Creating
          </Link>
          <Link
            href="/explore"
            className="inline-flex items-center justify-center h-12 px-6 text-lg rounded-md border border-border-default text-text-primary hover:bg-bg-elevated font-display font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-border-strong"
          >
            Explore NFTs
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-text-secondary">
          <div className="flex items-center gap-2 rounded-full border border-border-default bg-bg-surface px-4 py-2">
            <BitcoinIcon size={22} className="inline-block align-middle" />
            <span>Bitcoin Ordinals</span>
          </div>
          <div className="h-5 w-px bg-border-default hidden sm:block" />
          <div className="flex items-center gap-2 rounded-full border border-border-default bg-bg-surface px-4 py-2">
            <SolanaIcon size={22} className="inline-block align-middle" />
            <span>Solana NFTs</span>
          </div>
        </div>
      </div>

      <div
        ref={indicatorRef}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-60 animate-bounce"
        aria-hidden="true"
      >
        <svg
          className="w-6 h-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            d="M6 9l6 6 6-6"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </section>
  );
}

export default Hero;
