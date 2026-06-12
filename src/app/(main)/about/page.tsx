import type { Metadata } from "next";
import { AuricGemLogo } from "@/components/ui/AuricLogo";

export const metadata: Metadata = {
  title: "About — Auric",
  description: "Auric is a dual-chain NFT platform for minting, collecting, and trading on Solana and Bitcoin Ordinals.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <AuricGemLogo size={32} textSize="text-2xl" />

      <h1 className="mt-6 text-3xl font-headings font-bold text-text-primary">About Auric</h1>
      <p className="mt-2 text-text-secondary">
        One marketplace for two chains — built for collectors and creators who don&apos;t want to choose.
      </p>

      <div className="doc-content mt-8">
        <h2>Why a dual-chain marketplace?</h2>
        <p>
          NFTs grew up in two very different neighborhoods. Solana became the home of fast,
          low-cost minting and vibrant generative collections, while Bitcoin Ordinals brought
          digital artifacts directly onto the most battle-tested ledger in existence by
          inscribing data onto individual satoshis. Most marketplaces force you to pick a side.
          Auric doesn&apos;t.
        </p>
        <p>
          We built Auric so a single profile, a single search, and a single set of marketplace
          tools work across both ecosystems. Connect a Solana wallet, a Bitcoin wallet, or both,
          and browse, mint, list, and collect without switching tabs or platforms.
        </p>

        <h2>What you can do on Auric</h2>
        <ul>
          <li>Mint NFTs on Solana using the Metaplex Token Metadata standard, or inscribe ordinals directly on Bitcoin.</li>
          <li>Browse a unified explore feed that mixes listings from both chains, with filters for status and price.</li>
          <li>List, edit, and cancel listings from one profile, with activity history across both networks.</li>
          <li>Customize a creator profile — display name, bio, avatar, and banner — that travels with your wallet address.</li>
        </ul>

        <h2>Our approach</h2>
        <p>
          Auric is <strong>non-custodial</strong>: your keys and your assets stay in your own
          wallet at all times. The app is a thin, fast interface over each chain&apos;s native
          tooling — Solana program calls for SPL/Metaplex assets, and standard inscription
          tooling for Bitcoin Ordinals. We&apos;d rather be transparent about what&apos;s
          on-chain versus what&apos;s app-side than hide it behind a black box.
        </p>
        <p>
          The project is under active development. Some surfaces — like our public API — are
          still being built out. You can track the platform&apos;s direction on the{" "}
          <a href="/blog">blog</a> or read more in the <a href="/docs">documentation</a>.
        </p>

        <h2>Get in touch</h2>
        <p>
          Questions, feedback, or partnership ideas? Visit the <a href="/contact">contact page</a>{" "}
          and send us a message.
        </p>
      </div>
    </div>
  );
}
