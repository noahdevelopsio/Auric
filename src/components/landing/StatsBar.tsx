"use client";

import React, { useEffect, useRef, useState } from "react";
import type { ApiResponse, PlatformStats } from "@/types/api";

export function StatsBar() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [values, setValues] = useState({ nfts: 0, volume: 0, creators: 0, collections: 0 });
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats")
      .then((res) => res.json())
      .then((json: ApiResponse<PlatformStats>) => {
        if (!cancelled && json.success && json.data) setStats(json.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!stats || animated) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [stats, animated]);

  useEffect(() => {
    if (!animated || !stats) return;
    let raf: number;
    const start = Date.now();
    const duration = 900;
    const targets = {
      nfts: stats.nftsMinted,
      volume: stats.totalVolumeSol,
      creators: stats.creators,
      collections: stats.collections,
    };
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      setValues({
        nfts: Math.floor(targets.nfts * t),
        volume: Math.floor(targets.volume * t),
        creators: Math.floor(targets.creators * t),
        collections: Math.floor(targets.collections * t),
      });
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animated, stats]);

  if (!stats) return null;

  const isEmpty = stats.nftsMinted === 0 && stats.totalVolumeSol === 0 && stats.creators === 0 && stats.collections === 0;
  if (isEmpty) return null;

  return (
    <div ref={ref} className="w-full bg-bg-surface border-y border-border-subtle py-4">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-2xl font-headings font-bold">{values.nfts.toLocaleString()}</div>
          <div className="text-sm text-text-secondary">NFTs Minted</div>
        </div>
        <div>
          <div className="text-2xl font-headings font-bold">{values.volume.toLocaleString()} SOL</div>
          <div className="text-sm text-text-secondary">Total Volume</div>
        </div>
        <div>
          <div className="text-2xl font-headings font-bold">{values.creators.toLocaleString()}</div>
          <div className="text-sm text-text-secondary">Creators</div>
        </div>
        <div>
          <div className="text-2xl font-headings font-bold">{values.collections.toLocaleString()}</div>
          <div className="text-sm text-text-secondary">Collections</div>
        </div>
      </div>
    </div>
  );
}

export default StatsBar;
