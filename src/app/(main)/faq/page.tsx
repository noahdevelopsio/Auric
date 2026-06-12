import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — Auric",
  description: "Frequently asked questions about wallets, fees, minting, and listings on Auric.",
};

export default function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <h1 className="text-3xl font-headings font-bold text-text-primary">Frequently Asked Questions</h1>
      <p className="mt-2 text-text-secondary">
        Answers to common questions about wallets, fees, and how Auric works across chains.
      </p>

      <div className="doc-content mt-8">
        <h2>Wallets</h2>

        <h3>Which wallets can I use?</h3>
        <p>
          Auric supports Solana wallet adapters (such as Phantom and Solflare) for Solana
          activity, and Bitcoin wallets for Ordinals activity. You can connect a Solana wallet,
          a Bitcoin wallet, or both at the same time — your profile will show holdings and
          activity from every connected chain.
        </p>

        <h3>Does Auric ever hold my funds or NFTs?</h3>
        <p>
          No. Auric is non-custodial. Every mint, listing, purchase, and transfer is signed
          directly in your wallet and settles on-chain. Auric never takes custody of your assets.
        </p>

        <h2>Minting</h2>

        <h3>What does it cost to mint?</h3>
        <p>
          Minting costs are made up of the underlying network fee (Solana transaction fees, or
          Bitcoin miner fees for inscriptions), plus a small flat platform fee shown before you
          confirm. On Solana, storing your NFT&apos;s media and metadata also incurs a storage
          cost. Exact totals are always displayed on the mint confirmation step before you sign
          anything.
        </p>

        <h3>What file types are supported?</h3>
        <p>
          On Solana, Auric accepts JPEG, PNG, GIF, WebP, and MP4 files up to 50MB. On Bitcoin,
          inscriptions are limited to 4MB and support JPEG, PNG, GIF, WebP, SVG, HTML, and plain
          text — keep in mind smaller files cost less to inscribe.
        </p>

        <h3>Can I set a royalty on my NFT?</h3>
        <p>
          Yes, when minting on Solana you can set a royalty percentage (up to 50%) that&apos;s
          recorded in the NFT&apos;s on-chain metadata. Marketplaces that respect Metaplex
          royalty enforcement will pay this out on secondary sales.
        </p>

        <h2>Listings &amp; sales</h2>

        <h3>How do I list an NFT for sale?</h3>
        <p>
          Open the NFT&apos;s detail page from your <strong>Collected</strong> or{" "}
          <strong>Created</strong> tab and choose <strong>List for Sale</strong>. Set a price and
          confirm in your wallet — your listing then appears in Explore and on your profile&apos;s{" "}
          <strong>Listed</strong> tab.
        </p>

        <h3>Can I cancel a listing?</h3>
        <p>
          Yes. From your profile&apos;s <strong>Listed</strong> tab, select <strong>Delist</strong>{" "}
          on any active listing. This cancels the on-chain listing and returns the NFT to your
          wallet — no sale occurs.
        </p>

        <h3>What happens when an NFT sells?</h3>
        <p>
          The sale is executed as a single on-chain transaction: payment goes to the seller
          (minus any royalty and platform fee), and the NFT transfers to the buyer&apos;s wallet.
          The sale then appears in both parties&apos; <strong>Activity</strong> tabs.
        </p>

        <h2>General</h2>

        <h3>Why does Auric support both Solana and Bitcoin?</h3>
        <p>
          Each chain represents NFTs very differently — Solana uses program-based token
          standards, while Bitcoin Ordinals inscribe data directly onto satoshis. Rather than
          pick one, Auric gives collectors and creators a single interface for both. Read more in
          our <a href="/guides/solana-nfts">Solana NFT Guide</a> and{" "}
          <a href="/guides/bitcoin-ordinals">Bitcoin Ordinals Guide</a>.
        </p>

        <h3>Is Auric audited or production-ready?</h3>
        <p>
          Auric is under active development. Some areas, including parts of our public API, are
          still being built and are not yet feature-complete. See the <a href="/security">Security</a>{" "}
          page for more details on our approach.
        </p>

        <h3>I have another question — who do I ask?</h3>
        <p>
          Reach out through the <a href="/contact">contact page</a> and we&apos;ll get back to
          you.
        </p>
      </div>
    </div>
  );
}
