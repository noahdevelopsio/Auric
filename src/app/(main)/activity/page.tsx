"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChainIcon } from "@/components/ui/ChainIcon";
import { formatLamportsToSol, formatRelativeTime, shortenAddress } from "@/lib/utils/format";
import { ACTIVITY_PAGE_SIZE } from "@/lib/utils/constants";
import type { Activity } from "@/types/nft";
import type { PaginatedResponse } from "@/types/api";
import { History } from "lucide-react";

const EVENT_LABELS: Record<Activity["type"], string> = {
  mint: "Minted",
  inscribe: "Inscribed",
  list: "Listed",
  delist: "Delisted",
  sale: "Sold",
  transfer: "Transferred",
};

export default function ActivityPage() {
  const router = useRouter();
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/activity?limit=${ACTIVITY_PAGE_SIZE}`)
      .then((res) => res.json())
      .then((json: PaginatedResponse<Activity>) => {
        if (cancelled) return;
        if (json.success && json.data) setActivity(json.data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-headings font-bold">Recent Activity</h1>
      <p className="mt-2 text-text-secondary">Live activity across the network.</p>

      {loading ? (
        <div className="mt-8 rounded-2xl border border-border-default bg-bg-surface divide-y divide-border-subtle overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[68px] animate-pulse bg-bg-surface" />
          ))}
        </div>
      ) : activity.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border-default bg-bg-surface py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bg-elevated mx-auto mb-4">
            <History className="h-7 w-7 text-text-tertiary" />
          </div>
          <p className="font-semibold text-text-primary">No activity yet</p>
          <p className="text-sm text-text-tertiary mt-1">Mints, listings, and sales will show up here as they happen.</p>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-border-default bg-bg-surface divide-y divide-border-subtle overflow-hidden">
          {activity.map((item) => (
            <button
              key={item.id}
              onClick={() => item.nft_id && router.push(`/nft/${item.chain}/${item.nft_id}`)}
              className="w-full px-4 py-4 flex items-center justify-between gap-3 text-left hover:bg-bg-elevated transition-colors"
            >
              <div className="flex items-center gap-3">
                <ChainIcon chain={item.chain} size={18} />
                <div>
                  <div className="font-medium">{item.nft_name || (item.nft_id ? shortenAddress(item.nft_id) : "Untitled")}</div>
                  <div className="text-sm text-text-tertiary">
                    {EVENT_LABELS[item.type]}
                    {item.price_lamports != null && item.chain === "solana" && ` · ${formatLamportsToSol(item.price_lamports)}`}
                  </div>
                </div>
              </div>
              <div className="text-sm text-text-tertiary">{formatRelativeTime(item.created_at)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
