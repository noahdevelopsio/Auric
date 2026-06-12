import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security — Auric",
  description: "How Auric approaches wallet security, transaction signing, and responsible disclosure.",
};

export default function SecurityPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <h1 className="text-3xl font-headings font-bold text-text-primary">Security</h1>
      <p className="mt-2 text-text-secondary">
        How we think about wallet safety, transaction signing, and reporting issues.
      </p>

      <div className="doc-content mt-8">
        <h2>Non-custodial by design</h2>
        <p>
          Auric never holds your private keys, seed phrases, or assets. Every action that moves
          funds or NFTs — minting, listing, buying, cancelling a listing — is constructed by the
          app and then signed by you in your own wallet (Solana wallet adapter or Bitcoin
          wallet). If a transaction doesn&apos;t prompt a signature in your wallet, Auric cannot
          execute it.
        </p>

        <h2>What to check before you sign</h2>
        <ul>
          <li>Review the amount, recipient, and NFT details shown in your wallet&apos;s confirmation prompt — it should match what Auric displayed on screen.</li>
          <li>Be cautious of unexpected approval requests, especially ones that ask for broad or unlimited permissions.</li>
          <li>Only connect your wallet to Auric from this site, and double-check the URL in your browser before connecting or signing.</li>
        </ul>

        <h2>Inscription &amp; UTXO awareness</h2>
        <p>
          If you hold Bitcoin Ordinals, use a wallet that&apos;s aware of inscriptions. A wallet
          that treats all satoshis as interchangeable could accidentally spend a sat that carries
          an inscription you own. Auric&apos;s listing and transfer flows account for this, but
          your wallet&apos;s coin selection matters too.
        </p>

        <h2>Where we stand today</h2>
        <p>
          Auric is under active development. Marketplace flows interact directly with
          well-established programs and standards (Metaplex Token Metadata on Solana, standard
          inscription tooling on Bitcoin) rather than custom escrow contracts. That said, the
          platform has not yet undergone a formal third-party security audit — treat it
          accordingly, and avoid using funds or assets you can&apos;t afford to lose while
          features are still being hardened.
        </p>

        <h2>Reporting a vulnerability</h2>
        <p>
          If you believe you&apos;ve found a security issue, please report it through the{" "}
          <a href="/contact">contact page</a> rather than disclosing it publicly. Include as much
          detail as you can — steps to reproduce, affected pages or wallets, and any relevant
          transaction signatures — so we can investigate quickly.
        </p>
      </div>
    </div>
  );
}
