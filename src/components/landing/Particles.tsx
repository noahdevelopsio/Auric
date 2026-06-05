"use client";

import React, { useEffect, useMemo, useState } from "react";

export function Particles({ count = 30 }: { count?: number }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const particles = useMemo(() => {
    return Array.from({ length: count }).map(() => {
      const size = Math.floor(Math.random() * 4) + 2; // 2-6px
      const left = Math.random() * 100;
      const delay = Math.random() * -40;
      const duration = 20 + Math.random() * 30; // 20-50s
      const color = Math.random() > 0.5 ? "rgba(255,152,0,0.22)" : "rgba(153,69,255,0.22)";
      const top = 80 + Math.random() * 40; // start near bottom
      return { size, left, delay, duration, color, top };
    });
  }, [count]);

  if (!mounted) return <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden" />;

  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: p.color,
            transform: "translateY(0)",
            animation: `dc-particle ${p.duration}s linear ${p.delay}s infinite`
          }}
          className="opacity-90"
        />
      ))}

      <style jsx>{`
        @keyframes dc-particle {
          0% { transform: translateY(0) scale(1); opacity: 1 }
          100% { transform: translateY(-120vh) scale(1.1); opacity: 0 }
        }
        @media (prefers-reduced-motion: reduce) {
          span { animation: none !important }
        }
      `}</style>
    </div>
  );
}

export default Particles;
