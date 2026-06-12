import type { Metadata } from "next";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "API — Auric",
  description: "Reference for Auric's platform API endpoints and their current status.",
};

const endpoints = [
  {
    method: "GET",
    path: "/api/collections",
    summary: "List collections, with pagination and chain filtering.",
  },
  {
    method: "POST",
    path: "/api/collections",
    summary: "Create a new collection grouping for your minted NFTs.",
  },
  {
    method: "GET",
    path: "/api/profile",
    summary: "Fetch a profile (display name, bio, avatar/banner) by wallet address.",
  },
  {
    method: "PATCH",
    path: "/api/profile",
    summary: "Update the authenticated wallet's profile.",
  },
  {
    method: "POST",
    path: "/api/metadata",
    summary: "Generate and pin NFT metadata JSON ahead of a mint transaction.",
  },
  {
    method: "POST",
    path: "/api/upload",
    summary: "Upload media (image/video) for use in NFT metadata.",
  },
  {
    method: "GET",
    path: "/api/ordinals",
    summary: "Look up inscription data for a Bitcoin Ordinals NFT.",
  },
  {
    method: "POST",
    path: "/api/ordinals",
    summary: "Prepare an inscription payload for a Bitcoin mint.",
  },
];

const methodColors: Record<string, string> = {
  GET: "text-semantic-info",
  POST: "text-sol-teal",
  PATCH: "text-btc-500",
};

export default function ApiDocsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <h1 className="text-3xl font-headings font-bold text-text-primary">API Reference</h1>
      <p className="mt-2 text-text-secondary">
        A look at Auric&apos;s platform API surface and where it currently stands.
      </p>

      <div className="doc-content mt-8">
        <h2>Status</h2>
        <p>
          The endpoints below make up Auric&apos;s public API. Most of the marketplace already
          works end-to-end through direct, client-signed on-chain transactions — these HTTP
          endpoints exist to support things on-chain calls can&apos;t do alone (profile storage,
          metadata hosting, media uploads, and inscription lookups).
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {endpoints.map((e) => (
          <Card key={`${e.method}-${e.path}`} padding="sm" className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className={`font-mono text-xs font-semibold w-14 shrink-0 ${methodColors[e.method] ?? "text-text-secondary"}`}>
                {e.method}
              </span>
              <code className="font-mono text-sm text-text-primary truncate">{e.path}</code>
            </div>
            <span className="hidden sm:block text-sm text-text-secondary truncate">{e.summary}</span>
            <Badge variant="success" className="shrink-0">Live</Badge>
          </Card>
        ))}
      </div>

      <div className="doc-content mt-8">
        <h2>Authentication</h2>
        <p>
          Authenticated endpoints (such as <code>PATCH /api/profile</code>) will be scoped to a
          wallet address and require a signed message proving ownership of that address —
          standard practice for wallet-based apps, since there are no passwords or API keys tied
          to a wallet.
        </p>

        <h2>Need something sooner?</h2>
        <p>
          If you&apos;re integrating with Auric and need a specific endpoint prioritized, let us
          know via the <a href="/contact">contact page</a>.
        </p>
      </div>
    </div>
  );
}
