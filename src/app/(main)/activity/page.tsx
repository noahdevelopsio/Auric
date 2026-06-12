"use client";

import { useRouter } from "next/navigation";
import { ChainIcon } from "@/components/ui/ChainIcon";

const activity = [
  { id: 1, action: "Minted", name: "Blue Robot #001", time: "2m ago", chain: "solana" as const, tokenId: "001" },
  { id: 2, action: "Sold", name: "Ordinal Ape #18", time: "11m ago", chain: "bitcoin" as const, tokenId: "018" },
  { id: 3, action: "Listed", name: "Photon Bloom", time: "28m ago", chain: "solana" as const, tokenId: "003" },
  { id: 4, action: "Inscribed", name: "Hash Relic", time: "1h ago", chain: "bitcoin" as const, tokenId: "004" },
];

export default function ActivityPage() {
  const router = useRouter();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-headings font-bold">Recent Activity</h1>
      <p className="mt-2 text-text-secondary">Live activity across the network.</p>

      <div className="mt-8 rounded-2xl border border-border-default bg-bg-surface divide-y divide-border-subtle overflow-hidden">
        {activity.map((item) => (
          <button
            key={item.id}
            onClick={() => router.push(`/nft/${item.chain}/${item.tokenId}`)}
            className="w-full px-4 py-4 flex items-center justify-between gap-3 text-left hover:bg-bg-elevated transition-colors"
          >
            <div className="flex items-center gap-3">
              <ChainIcon chain={item.chain} size={18} />
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-text-tertiary">{item.action}</div>
              </div>
            </div>
            <div className="text-sm text-text-tertiary">{item.time}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
