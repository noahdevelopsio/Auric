import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Auric",
  description: "The terms governing your use of the Auric platform.",
};

export default function TermsOfServicePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <h1 className="text-3xl font-headings font-bold text-text-primary">Terms of Service</h1>
      <p className="mt-2 text-text-secondary">Last updated: April 2026</p>

      <div className="doc-content mt-8">
        <blockquote>
          These terms are provided as a template for this project to set expectations for using
          the Auric application. They are not a substitute for legal advice, and should be
          reviewed by qualified counsel before use in a production marketplace.
        </blockquote>

        <h2>1. The service</h2>
        <p>
          Auric is a non-custodial interface for minting, listing, buying, and managing NFTs on
          the Solana and Bitcoin (Ordinals) networks. Auric does not custody funds, private keys,
          or NFTs at any point — all transactions are signed by you in your own wallet and
          executed directly on-chain.
        </p>

        <h2>2. Eligibility &amp; your responsibilities</h2>
        <ul>
          <li>You are responsible for the security of your wallet, private keys, and seed phrases. Auric cannot recover lost keys or reverse on-chain transactions.</li>
          <li>You are responsible for reviewing transaction details in your wallet before signing, and for any fees (network and platform) shown prior to confirmation.</li>
          <li>You must not use Auric to mint, list, or trade content that is illegal, infringes on others&apos; intellectual property, or violates the rights of third parties.</li>
        </ul>

        <h2>3. NFTs and on-chain content</h2>
        <p>
          NFTs minted or listed through Auric are created and stored according to the standards
          described in our <a href="/guides/solana-nfts">Solana NFT Guide</a> and{" "}
          <a href="/guides/bitcoin-ordinals">Bitcoin Ordinals Guide</a>. Once a transaction is
          confirmed on-chain, it is generally permanent and cannot be altered or removed by
          Auric. Auric does not guarantee the value, authenticity, or provenance of any NFT
          beyond what is verifiable on-chain.
        </p>

        <h2>4. No financial advice, no guarantees</h2>
        <p>
          Nothing on Auric constitutes financial, investment, or legal advice. Digital assets,
          including NFTs and cryptocurrencies, are volatile and can lose value entirely.
          Blockchain transactions are irreversible — double-check addresses, prices, and NFT
          details before confirming any transaction.
        </p>

        <h2>5. Platform availability &amp; changes</h2>
        <p>
          Auric is under active development, as described on our <a href="/about">About</a> and{" "}
          <a href="/security">Security</a> pages. Features, fees, and the availability of the
          service may change, and some functionality (such as the endpoints listed in our{" "}
          <a href="/api-docs">API reference</a>) may not yet be implemented.
        </p>

        <h2>6. Acceptable use</h2>
        <p>
          You agree not to use Auric to interfere with the platform&apos;s operation, attempt
          unauthorized access to other users&apos; wallets or data, or engage in fraudulent or
          manipulative trading practices.
        </p>

        <h2>7. Disclaimer &amp; limitation of liability</h2>
        <p>
          Auric is provided &quot;as is&quot; without warranties of any kind. To the fullest
          extent permitted by law, Auric and its operators are not liable for losses arising from
          your use of the platform, including losses resulting from wallet compromise, network
          congestion, smart contract behavior, or market volatility.
        </p>

        <h2>8. Changes to these terms</h2>
        <p>
          These terms may be updated as Auric evolves. Continued use of the platform after
          changes are posted constitutes acceptance of the updated terms.
        </p>

        <h2>9. Contact</h2>
        <p>
          Questions about these terms can be sent via the <a href="/contact">contact page</a>.
        </p>
      </div>
    </div>
  );
}
