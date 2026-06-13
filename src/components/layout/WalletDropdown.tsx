"use client";

import React, { useEffect, useRef } from "react";
import { Copy, LogOut } from "lucide-react";
import { useWalletStore } from "@/store/walletStore";
import { usePathname, useRouter } from "next/navigation";

export function WalletDropdown({ onClose }: { onClose: () => void }) {
  const { solanaAddress, btcAddress, disconnectAll } = useWalletStore();
  const address = solanaAddress || btcAddress || "";
  const ref = useRef<HTMLDivElement | null>(null);
  const [activeIdx, setActiveIdx] = React.useState<number>(-1);
  const itemRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { id: 'profile', label: 'View Profile', href: `/profile/${address}` },
    { id: 'my-nfts', label: 'My NFTs', href: `/profile/${address}` },
    { id: 'my-listings', label: 'My Listings', href: `/profile/${address}?tab=Listed` },
  ];

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onClose();
  }, [pathname, onClose]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') return onClose();
      if (e.key === 'ArrowDown') {
        setActiveIdx(i => {
          const next = Math.min(i + 1, menuItems.length - 1);
          requestAnimationFrame(() => itemRefs.current[next]?.focus());
          return next;
        });
        e.preventDefault();
      }
      if (e.key === 'ArrowUp') {
        setActiveIdx(i => {
          const next = Math.max(i - 1, 0);
          requestAnimationFrame(() => itemRefs.current[next]?.focus());
          return next;
        });
        e.preventDefault();
      }
      if (e.key === 'Enter' && activeIdx >= 0) {
        // trigger click on focused item
        itemRefs.current[activeIdx]?.click();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [activeIdx, onClose]);

  return (
    <div ref={ref} className="absolute right-0 mt-2 w-60 bg-bg-elevated border border-border-default rounded-lg shadow-lg z-50" role="menu" aria-orientation="vertical">
      <div className="p-3 border-b border-border-subtle">
        <div className="font-mono text-sm truncate text-text-primary">{address}</div>
        <div className="flex items-center gap-2 mt-2">
          {solanaAddress && <span className="w-2 h-2 rounded-full bg-sol-500" aria-label="Solana connected" />}
          {btcAddress && <span className="w-2 h-2 rounded-full bg-btc-500" aria-label="Bitcoin connected" />}
        </div>
      </div>
      <div className="p-2">
        {menuItems.map((it, idx) => (
          <button
            key={it.id}
            ref={(el) => {
              itemRefs.current[idx] = el;
            }}
            role="menuitem"
            tabIndex={idx === 0 ? 0 : -1}
            className={`w-full text-left px-3 py-2 hover:bg-bg-highlight rounded-md flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong text-text-primary ${activeIdx === idx ? 'bg-bg-highlight' : ''}`}
            onClick={() => { router.push(it.href); onClose(); }}
          >
            <span className="text-sm">{it.label}</span>
          </button>
        ))}

        <div className="border-t border-border-subtle my-2" />

        <button onClick={() => { navigator.clipboard.writeText(address); onClose(); }} className="w-full text-left px-3 py-2 hover:bg-bg-highlight rounded-md flex items-center gap-2 text-text-primary text-sm">
          <Copy className="w-4 h-4" /> Copy address
        </button>
        <button onClick={() => { disconnectAll(); onClose(); }} className="w-full text-left px-3 py-2 hover:bg-bg-highlight rounded-md flex items-center gap-2 text-semantic-error text-sm">
          <LogOut className="w-4 h-4" /> Disconnect
        </button>
      </div>
    </div>
  );
}

export default WalletDropdown;
