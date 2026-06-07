"use client";

import React, { useEffect, useRef, useState } from "react";

interface Props {
  children: React.ReactNode;
}

export default function PullToRefresh({ children }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const startY = useRef<number | null>(null);
  const distanceRef = useRef(0);
  const pullingRef = useRef(false);
  const [distance, setDistance] = useState(0);
  const [pulling, setPulling] = useState(false);
  const threshold = 70;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || el.scrollTop || 0;
      if (scrollTop > 0) return;
      startY.current = e.touches[0].clientY;
      setDistance(0);
      setPulling(false);
      distanceRef.current = 0;
      pullingRef.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startY.current == null) return;
      const y = e.touches[0].clientY;
      const dy = y - startY.current;
      if (dy > 0) {
        e.preventDefault();
        const nextDistance = Math.min(dy, 150);
        distanceRef.current = nextDistance;
        pullingRef.current = true;
        setDistance(nextDistance);
        setPulling(true);
      }
    };

    const onTouchEnd = async () => {
      if (!pullingRef.current) {
        startY.current = null;
        setDistance(0);
        return;
      }

      if (distanceRef.current > threshold && typeof window !== "undefined") {
        window.location.reload();
      }

      // reset
      startY.current = null;
      distanceRef.current = 0;
      pullingRef.current = false;
      setPulling(false);
      setDistance(0);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart as EventListener);
      el.removeEventListener("touchmove", onTouchMove as EventListener);
      el.removeEventListener("touchend", onTouchEnd as EventListener);
    };
  }, []);

  return (
    <div ref={ref} className="min-h-screen overflow-auto" style={{ WebkitOverflowScrolling: "touch" }}>
      <div
        className="transform-gpu"
        style={{ transform: `translateY(${distance}px)`, transition: pulling ? "none" : "transform 220ms ease" }}
      >
        <div className="flex items-center justify-center h-12 -mt-3">
          <div className="text-xs text-muted-foreground">
            {distance > threshold ? "Release to refresh" : distance > 0 ? "Pull to refresh" : ""}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
