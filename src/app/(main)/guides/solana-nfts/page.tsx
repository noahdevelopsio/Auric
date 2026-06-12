import type { Metadata } from "next";
import { Badge } from "@/components/ui/Badge";
import { ChainIcon } from "@/components/ui/ChainIcon";

export const metadata: Metadata = {
  title: "Solana NFT Guide — Auric",
  description: "How Solana NFTs, the Metaplex Token Metadata standard, and compressed NFTs work on Auric.",
};

export default function SolanaNFTGuidePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <Badge variant="sol"><span className="flex items-center gap-1"><ChainIcon chain="solana" size={11} /> Solana</span></Badge>

      <h1 className="mt-3 text-3xl font-headings font-bold text-text-primary">Solana NFT Guide</h1>
      <p className="mt-2 text-text-secondary">
        How NFTs are minted, priced, and represented on Solana — and what that looks like inside
        Auric.
      </p>

      <div className="doc-content mt-8">
        <h2>The building blocks: SPL tokens + metadata</h2>
        <p>
          On Solana, an NFT starts as a regular SPL token with a total supply of one and zero
          decimals — that uniqueness is what makes it &quot;non-fungible.&quot; On its own, a
          token like that has no name, image, or attributes. The{" "}
          <strong>Metaplex Token Metadata</strong> program solves this by attaching a metadata
          account to the token mint, pointing to an off-chain (or on-chain) JSON file with the
          NFT&apos;s name, description, image URI, and attributes.
        </p>
        <p>
          When you mint on Auric&apos;s Solana tab, your media is uploaded to decentralized
          storage and a metadata JSON file is generated automatically, then linked to a new
          token mint via the Token Metadata program — all in a transaction you sign from your
          wallet.
        </p>

        <h2>Programmable NFTs &amp; royalties</h2>
        <p>
          A challenge with early NFT standards was enforcing creator royalties — nothing stopped
          a marketplace from skipping the royalty transfer on a sale. <strong>Programmable NFTs
          (pNFTs)</strong> address this by keeping the token account permanently frozen, so
          transfers must go through the Token Metadata program&apos;s transfer rules, which can
          enforce a royalty percentage on secondary sales.
        </p>
        <p>
          When minting, Auric lets you set a royalty percentage (up to 50%) that&apos;s written
          into the NFT&apos;s on-chain metadata at creation time.
        </p>

        <h2>Compressed NFTs</h2>
        <p>
          Minting thousands of individual metadata accounts can get expensive. <strong>State
          compression</strong> solves this by storing many NFTs&apos; data inside a single
          on-chain Merkle tree account, with the full data kept off-chain and validated against
          that tree. The result — <strong>compressed NFTs (cNFTs)</strong> — can cost a fraction
          of a standard mint, which is why they&apos;re common for large collections, gaming
          items, and event tickets. Auric&apos;s marketplace and detail pages work the same way
          regardless of whether an NFT is a standard mint or a compressed one.
        </p>

        <h2>What&apos;s next: Metaplex Core &amp; Token Extensions</h2>
        <p>
          Newer standards are gradually replacing the original Token Metadata approach for new
          collections. <strong>Metaplex Core</strong> represents an entire NFT in a single
          account (instead of three or more), reducing mint costs and adding built-in royalty
          enforcement and a plugin system for custom behavior. Separately, Solana&apos;s{" "}
          <strong>Token Extensions</strong> (Token-2022) program adds native metadata and other
          features directly at the token level. Auric tracks these standards as they mature and
          aims to support newly-minted assets across them.
        </p>

        <h2>Buying and selling on Auric</h2>
        <p>
          Listings are created by delegating sale authority for your NFT to Auric&apos;s
          marketplace program — your NFT stays in your wallet until it actually sells. A
          purchase executes the transfer and payment (including any royalty and platform fee) in
          a single transaction. Cancelling a listing revokes that delegation, with no transfer
          taking place.
        </p>

        <h2>Learn more</h2>
        <p>
          For the Bitcoin side of things, see the <a href="/guides/bitcoin-ordinals">Bitcoin
          Ordinals Guide</a>. For step-by-step minting and listing instructions, see the{" "}
          <a href="/docs">documentation</a>.
        </p>
      </div>
    </div>
  );
}
