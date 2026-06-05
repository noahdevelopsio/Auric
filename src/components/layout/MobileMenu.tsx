"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X, MessageCircleMore } from "lucide-react";
import { AuricGemLogo } from "@/components/ui/AuricLogo";

export function MobileMenu({ open, onClose, onOpenWallet }: { open: boolean; onClose: () => void; onOpenWallet: () => void }) {
  const [visible, setVisible] = useState(open);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) setVisible(true);
    else {
      // wait for animation before unmount
      const t = setTimeout(() => setVisible(false), 220);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!visible) return null;

  return (
    <div className={`fixed inset-0 z-50 bg-bg-base transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} aria-hidden={!open} onClick={onClose}>
      <div
        className={`ml-auto flex h-full w-full max-w-md translate-x-0 transform flex-col border-l border-border-subtle bg-bg-base px-5 py-5 transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        id="mobile-menu"
        aria-label="Mobile menu"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-8 flex items-center justify-between">
          <AuricGemLogo size={26} textSize="text-lg" />
          <button onClick={onClose} aria-label="Close menu" className="inline-flex h-11 w-11 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong">
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col">
          <Link href="/explore" onClick={onClose} className="flex min-h-14 items-center justify-between border-b border-border-subtle text-[20px] font-semibold tracking-[-0.02em] text-text-primary transition-colors hover:text-text-secondary">
            <span>Explore</span>
            <span className="text-text-tertiary">→</span>
          </Link>
          <Link href="/mint" onClick={onClose} className="flex min-h-14 items-center justify-between border-b border-border-subtle text-[20px] font-semibold tracking-[-0.02em] text-text-primary transition-colors hover:text-text-secondary">
            <span>Create</span>
            <span className="text-text-tertiary">→</span>
          </Link>
          <Link href="/explore?view=collections" onClick={onClose} className="flex min-h-14 items-center justify-between border-b border-border-subtle text-[20px] font-semibold tracking-[-0.02em] text-text-primary transition-colors hover:text-text-secondary">
            <span>Collections</span>
            <span className="text-text-tertiary">→</span>
          </Link>
        </nav>

        <div className="mt-auto pt-6">
          <button onClick={() => { onOpenWallet(); onClose(); }} className="flex h-12 w-full items-center justify-center rounded-md bg-text-primary px-4 font-medium text-bg-base transition-colors hover:bg-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong">
            Connect Wallet
          </button>

          <div className="mt-6 flex items-center justify-center gap-4 border-t border-border-subtle pt-6">
            <a href="#" aria-label="Twitter / X" className="inline-flex h-11 w-11 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-bg-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817-5.964 6.817H1.684l7.73-8.835L1.258 2.25h7.05l4.713 6.231 5.223-6.231Zm-1.161 18.25h1.833L7.31 4.126H5.345l11.738 16.374Z" /></svg>
            </a>
            <a href="#" aria-label="Discord" className="inline-flex h-11 w-11 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-bg-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong">
              <MessageCircleMore className="h-5 w-5" />
            </a>
            <a href="#" aria-label="GitHub" className="inline-flex h-11 w-11 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-bg-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.72.5.1.68-.22.68-.49v-1.72c-2.78.62-3.37-1.35-3.37-1.35-.45-1.18-1.1-1.5-1.1-1.5-.9-.63.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.33 1.11 2.9.85.09-.66.35-1.11.64-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.38-2.03 1-2.74-.1-.25-.43-1.28.1-2.68 0 0 .83-.27 2.72 1.05a9.2 9.2 0 0 1 4.95 0c1.89-1.32 2.72-1.05 2.72-1.05.53 1.4.2 2.43.1 2.68.63.71 1 1.62 1 2.74 0 3.94-2.34 4.8-4.57 5.05.36.32.69.95.69 1.92v2.84c0 .28.18.6.69.49A10.01 10.01 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" /></svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MobileMenu;
