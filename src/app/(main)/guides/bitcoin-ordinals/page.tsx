import type { Metadata } from "next";
import { Badge } from "@/components/ui/Badge";
import { ChainIcon } from "@/components/ui/ChainIcon";

export const metadata: Metadata = {
  title: "Bitcoin Ordinals Guide — Auric",
  description: "How Bitcoin Ordinals and inscriptions work, and how they're represented as NFTs on Auric.",
};

export default function BitcoinOrdinalsGuidePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <Badge variant="btc"><span className="flex items-center gap-1"><ChainIcon chain="bitcoin" size={11} /> Bitcoin</span></Badge>

      <h1 className="mt-3 text-3xl font-headings font-bold text-text-primary">Bitcoin Ordinals Guide</h1>
      <p className="mt-2 text-text-secondary">
        How inscriptions turn satoshis into one-of-a-kind digital artifacts — and what that means
        when you mint or collect them on Auric.
      </p>

      <div className="doc-content mt-8">
        <h2>What is the Ordinals protocol?</h2>
        <p>
          Every bitcoin is made up of 100 million satoshis (&quot;sats&quot;), the smallest unit
          of the currency. The Ordinals protocol, introduced in early 2023, assigns each
          individual satoshi a unique number based on the order it was mined — its{" "}
          <strong>ordinal number</strong>. Because every sat is individually identifiable,
          arbitrary data can be attached to a specific sat. That data is called an{" "}
          <strong>inscription</strong>.
        </p>
        <p>
          An inscription can be an image, text, audio, video, or any other file type. Once
          written, the content is stored directly in the Bitcoin blockchain itself — there are no
          external links, off-chain metadata servers, or smart contracts involved. The sat
          carrying the inscription becomes a tradeable, one-of-a-kind digital artifact.
        </p>

        <h2>How is this different from other NFTs?</h2>
        <p>
          Most NFT ecosystems (including Solana&apos;s) use a smart-contract program to mint a
          token and point it at metadata, which may live on-chain or on decentralized storage.
          Ordinals skip the smart-contract layer entirely:
        </p>
        <ul>
          <li><strong>Fully on-chain</strong> — the inscription content itself is written into a Bitcoin transaction&apos;s witness data, inheriting Bitcoin&apos;s security and permanence.</li>
          <li><strong>No separate token standard</strong> — ownership of an inscription is simply ownership of the sat it&apos;s inscribed on, tracked using normal Bitcoin transactions (UTXOs).</li>
          <li><strong>Provenance by number</strong> — because sats are numbered in mining order, inscriptions can be ranked by how early they were created.</li>
        </ul>
        <p>
          Related protocols built on the same idea include <strong>BRC-20</strong> (fungible
          tokens defined via JSON inscriptions) and <strong>Runes</strong> (a more efficient
          fungible token protocol for Bitcoin) — but Auric focuses on inscription-based NFTs.
        </p>

        <h2>Inscribing on Auric</h2>
        <p>
          When you mint on the Bitcoin tab of the <a href="/mint">Create</a> page, Auric helps
          you prepare and broadcast an inscription transaction:
        </p>
        <ol>
          <li>Upload your file. Bitcoin inscriptions are capped at 4MB, so smaller files (especially SVG or compressed images) are cheaper and faster to confirm.</li>
          <li>Choose a fee rate — economy, standard, or priority — measured in satoshis per virtual byte (sat/vB). Higher rates confirm faster during busy periods.</li>
          <li>Sign and broadcast from your connected Bitcoin wallet. Your inscription is mined into a future block along with your transaction.</li>
        </ol>
        <p>
          Once confirmed, the inscription gets a unique <strong>inscription ID</strong> and
          appears on its own detail page (<code>/nft/bitcoin/[id]</code>) and in your
          profile&apos;s <strong>Created</strong> tab.
        </p>

        <h2>Buying, selling, and custody</h2>
        <p>
          Because an inscription&apos;s ownership is just ownership of a specific satoshi,
          transferring it means sending that exact sat to another wallet in a Bitcoin
          transaction — which is why Ordinals-aware wallets are important: a wallet that
          doesn&apos;t track inscriptions could accidentally spend the sat carrying your
          artifact. Auric&apos;s listing and purchase flows handle this UTXO selection for you,
          but always use a wallet built to support Ordinals when holding inscriptions long-term.
        </p>

        <h2>Learn more</h2>
        <p>
          For the Solana side of things, see the <a href="/guides/solana-nfts">Solana NFT
          Guide</a>. For step-by-step instructions on minting and listing, see the{" "}
          <a href="/docs">documentation</a>.
        </p>
      </div>
    </div>
  );
}
