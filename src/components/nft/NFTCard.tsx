import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ChainIcon } from "@/components/ui/ChainIcon";
import { Heart, Check, ShoppingCart } from "lucide-react";
import Image from "next/image";

interface NFTCardProps {
  name: string;
  chain: "solana" | "bitcoin";
  price: string;
  image?: string;
  verified?: boolean;
  priceChange?: number | string; // positive: 3.2, or string like '+3.2%'
  onClick?: () => void;
}

export function NFTCard({ name, chain, price, image, verified = true, priceChange, onClick }: NFTCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(24);
  // price prop expected like: "55 SOL" or "0.2 BTC". We try to format the numeric part.
  const [amountRaw, currency] = price.split(" ");
  const amount = Number(amountRaw.replace(/,/g, ""));
  const formattedAmount = Number.isFinite(amount)
    ? amount >= 1000
      ? new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 2 }).format(amount)
      : amount < 1
      ? amount.toFixed(4).replace(/(?:\.0+|0+$)/, "")
      : amount.toFixed(2).replace(/(?:\.0+|0+$)/, "")
    : price;

  const change = priceChange;
  // normalize change to number when possible
  let changeVal: number | undefined;
  if (typeof change === "number") changeVal = change;
  else if (typeof change === "string") {
    const parsed = Number(String(change).replace(/[^0-9.-]/g, ""));
    if (!Number.isNaN(parsed)) changeVal = parsed;
  }

  return (
    <Card 
      className="overflow-hidden hover:border-border-strong transition-all duration-200 cursor-pointer group hover:-translate-y-1 hover:shadow-md"
      onClick={onClick}
    >
      <div className="aspect-square bg-bg-elevated relative group">
        {image ? (
          <Image src={image} alt={name} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-text-tertiary font-mono text-sm">
            NO_IMAGE_DATA
          </div>
        )}
        
        {/* Network Badge */}
        <div className="absolute top-2 left-2">
          <Badge
            variant={chain === "solana" ? "sol" : "btc"}
            className="shadow-black/50 shadow-sm backdrop-blur-md bg-opacity-80"
            aria-label={chain === "solana" ? "Solana network" : "Bitcoin network"}
          >
            <span className="flex items-center gap-1">
              <ChainIcon chain={chain} size={12} />
              {chain === "solana" ? "Solana" : "Bitcoin"}
            </span>
          </Badge>
        </div>

        {/* Like button (top-right) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setLiked((prev) => !prev);
            setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
          }}
          className={`absolute top-2 right-2 rounded-full bg-black/50 backdrop-blur-sm px-2 py-1 text-xs inline-flex items-center gap-1 transition-colors ${liked ? "text-red-400" : "text-white"}`}
          aria-label={liked ? `Unlike ${name}` : `Like ${name}`}
          aria-pressed={liked}
        >
          <Heart className="w-3.5 h-3.5" fill={liked ? "currentColor" : "none"} /> {likeCount}
        </button>

        {/* Hover CTA */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-3 opacity-0 translate-y-2 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            className="flex items-center gap-2 bg-white/95 text-black rounded-full px-3 py-1 text-sm shadow-md hover:scale-105"
            aria-label={chain === "solana" ? `Mint ${name}` : `Buy ${name}`}
          >
            <ShoppingCart className="w-4 h-4" />
            {chain === "solana" ? "Mint" : "Buy"}
          </button>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold truncate mb-1" title={name}>{name}</h3>
          <span className="text-xs text-muted-foreground">#001</span>
        </div>
        <div className="flex justify-between items-end mt-2">
          <div className="flex items-center gap-2">
            {verified ? (
              <span className="text-xs text-text-tertiary flex items-center gap-1.5" aria-hidden>
                <span className="w-4 h-4 rounded-full bg-semantic-success text-bg-base inline-flex items-center justify-center shadow-sm">
                  <Check className="w-2.5 h-2.5" />
                </span>
                <span>Verified</span>
              </span>
            ) : (
              <span className="text-xs text-text-tertiary">Unverified</span>
            )}
          </div>
          <div className="text-right">
            <div className="font-mono text-sm font-semibold flex items-baseline justify-end gap-2">
              <span className="text-2xl leading-none">{formattedAmount}</span>
              <span className="text-xs text-text-tertiary">{currency}</span>
            </div>
            {typeof changeVal !== "undefined" ? (
              <div className="mt-1">
                <span className={"text-xs " + (changeVal >= 0 ? "text-green-500" : "text-red-400")} aria-hidden>
                  {changeVal >= 0 ? "+" : ""}{changeVal}%
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
