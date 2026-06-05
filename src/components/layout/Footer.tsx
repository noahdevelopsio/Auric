"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-bg-base/95">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="mb-4 inline-flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-sol shadow-sol">
                <span className="h-3.5 w-3.5 rounded-full border border-bg-base/60 bg-bg-base/15" />
              </span>
              <span className="font-headings text-xl font-bold tracking-[-0.02em] text-text-primary">Auric</span>
            </Link>
            <p className="max-w-xs text-sm leading-6 text-text-secondary">
              The dual-chain NFT platform. Mint on Solana, inscribe on Bitcoin, manage both in one place.
            </p>
            <div className="mt-5 flex items-center gap-4">
              <a aria-label="Twitter / X" href="#" className="inline-flex h-10 w-10 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-bg-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong">
                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817-5.964 6.817H1.684l7.73-8.835L1.258 2.25h7.05l4.713 6.231 5.223-6.231Zm-1.161 18.25h1.833L7.31 4.126H5.345l11.738 16.374Z" />
                </svg>
              </a>
              <a aria-label="Discord" href="#" className="inline-flex h-10 w-10 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-bg-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong">
                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.54 5.34a17.33 17.33 0 0 0-4.27-1.32.05.05 0 0 0-.05.02c-.18.32-.39.73-.53 1.06a16.09 16.09 0 0 0-4.67 0c-.14-.33-.36-.74-.54-1.06a.05.05 0 0 0-.05-.02A17.25 17.25 0 0 0 5.16 5.34a.04.04 0 0 0-.02.02C2.64 9.09 1.95 12.72 2.3 16.3a.05.05 0 0 0 .02.03c1.54 1.14 3.04 1.83 4.52 2.29a.05.05 0 0 0 .05-.02c.35-.48.66-.99.93-1.52a.05.05 0 0 0-.03-.07c-.5-.19-.98-.42-1.44-.69a.05.05 0 0 1-.01-.08c.1-.08.2-.16.3-.25a.05.05 0 0 1 .05-.01c3.04 1.39 6.34 1.39 9.34 0a.05.05 0 0 1 .05.01c.1.08.2.17.3.25a.05.05 0 0 1-.01.08c-.46.27-.94.5-1.44.69a.05.05 0 0 0-.03.07c.27.53.58 1.04.93 1.52a.05.05 0 0 0 .05.02c1.49-.46 2.98-1.15 4.53-2.29a.05.05 0 0 0 .02-.03c.42-4.35-.69-7.95-2.94-10.94a.04.04 0 0 0-.02-.02ZM9.03 13.8c-.89 0-1.62-.82-1.62-1.82s.71-1.82 1.62-1.82c.92 0 1.64.83 1.62 1.82 0 1-.71 1.82-1.62 1.82Zm5.99 0c-.89 0-1.62-.82-1.62-1.82s.71-1.82 1.62-1.82c.92 0 1.64.83 1.62 1.82 0 1-.71 1.82-1.62 1.82Z" />
                </svg>
              </a>
              <a aria-label="GitHub" href="#" className="inline-flex h-10 w-10 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-bg-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong">
                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.72.5.1.68-.22.68-.49v-1.72c-2.78.62-3.37-1.35-3.37-1.35-.45-1.18-1.1-1.5-1.1-1.5-.9-.63.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.33 1.11 2.9.85.09-.66.35-1.11.64-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.38-2.03 1-2.74-.1-.25-.43-1.28.1-2.68 0 0 .83-.27 2.72 1.05a9.2 9.2 0 0 1 4.95 0c1.89-1.32 2.72-1.05 2.72-1.05.53 1.4.2 2.43.1 2.68.63.71 1 1.62 1 2.74 0 3.94-2.34 4.8-4.57 5.05.36.32.69.95.69 1.92v2.84c0 .28.18.6.69.49A10.01 10.01 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-medium uppercase tracking-[0.08em] text-text-secondary">Platform</h4>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li><Link href="/explore" className="transition-colors hover:text-text-primary">Explore</Link></li>
              <li><Link href="/mint" className="transition-colors hover:text-text-primary">Create</Link></li>
              <li><Link href="/explore?view=collections" className="transition-colors hover:text-text-primary">Collections</Link></li>
              <li><Link href="/profile/7xKp...3mZq" className="transition-colors hover:text-text-primary">Activity</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-medium uppercase tracking-[0.08em] text-text-secondary">Resources</h4>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li><Link href="#" className="transition-colors hover:text-text-primary">Documentation</Link></li>
              <li><Link href="#" className="transition-colors hover:text-text-primary">FAQ</Link></li>
              <li><Link href="#" className="transition-colors hover:text-text-primary">Bitcoin Ordinals Guide</Link></li>
              <li><Link href="#" className="transition-colors hover:text-text-primary">Solana NFT Guide</Link></li>
              <li><Link href="#" className="transition-colors hover:text-text-primary">API</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-medium uppercase tracking-[0.08em] text-text-secondary">Company</h4>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li><Link href="#" className="transition-colors hover:text-text-primary">About</Link></li>
              <li><Link href="#" className="transition-colors hover:text-text-primary">Blog</Link></li>
              <li><Link href="#" className="transition-colors hover:text-text-primary">Contact</Link></li>
              <li><Link href="#" className="transition-colors hover:text-text-primary">Security</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border-subtle pt-6 text-sm text-text-tertiary md:flex-row">
          <p>© 2026 Auric. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="#" className="transition-colors hover:text-text-secondary">Privacy Policy</Link>
            <Link href="#" className="transition-colors hover:text-text-secondary">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}