import type { Metadata } from "next";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Blog — Auric",
  description: "Updates, guides, and announcements from the Auric team.",
};

const posts = [
  {
    title: "Why we built Auric across two chains",
    date: "2026-02-10",
    tag: "Product",
    body: [
      "Most NFT marketplaces ask you to pick a chain first and a piece of art second. We started Auric from the opposite direction: what if the chain were just a detail?",
      "Solana and Bitcoin Ordinals represent ownership in fundamentally different ways — one through program-based token standards, the other through inscriptions on individual satoshis. Auric's job is to make both feel native, with a single profile, a unified explore feed, and consistent minting and listing flows regardless of which network an NFT lives on.",
      "This is just the start. Over the coming months we're focused on deepening support for both ecosystems — including newer Solana standards like Metaplex Core and Token Extensions — while keeping the experience just as simple.",
    ],
  },
  {
    title: "A field guide to Ordinals vs. SPL NFTs",
    date: "2026-03-04",
    tag: "Education",
    body: [
      "If you've collected on Solana before, Bitcoin Ordinals can feel unfamiliar at first — there's no token program, no metadata account, and no royalty enforcement built into the protocol itself. Instead, an inscription's content lives directly inside a Bitcoin transaction, and ownership is just ownership of the satoshi it's written on.",
      "That difference shapes a lot of what you'll notice as a collector: Ordinals wallets need to be inscription-aware to avoid accidentally spending a sat that's carrying an inscription, while Solana wallets manage NFTs as ordinary (if non-fungible) SPL tokens.",
      "We wrote up the full comparison in our guides — see the Bitcoin Ordinals Guide and the Solana NFT Guide for a deeper dive.",
    ],
  },
  {
    title: "What's next on the roadmap",
    date: "2026-04-22",
    tag: "Roadmap",
    body: [
      "A quick look at what we're working on: a public API for collections, profiles, and metadata (currently in development — see the API reference), broader support for compressed NFTs on Solana, and improved fee-rate guidance for Bitcoin inscriptions during busy periods.",
      "We're also expanding profile customization and activity feeds based on early feedback. As always, if there's something you'd like to see, reach out — details are on the contact page.",
    ],
  },
];

export default function BlogPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <h1 className="text-3xl font-headings font-bold text-text-primary">Blog</h1>
      <p className="mt-2 text-text-secondary">
        Updates, guides, and announcements from the Auric team.
      </p>

      <div className="mt-8 space-y-6">
        {posts.map((post) => (
          <Card key={post.title} padding="lg">
            <div className="flex items-center gap-3 text-xs text-text-tertiary">
              <Badge variant="outline">{post.tag}</Badge>
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </time>
            </div>
            <h2 className="mt-3 text-xl font-headings font-semibold text-text-primary">{post.title}</h2>
            <div className="doc-content mt-3">
              {post.body.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
