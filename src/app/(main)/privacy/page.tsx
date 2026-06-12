import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Auric",
  description: "How Auric handles wallet data, local storage, and on-chain information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <h1 className="text-3xl font-headings font-bold text-text-primary">Privacy Policy</h1>
      <p className="mt-2 text-text-secondary">Last updated: April 2026</p>

      <div className="doc-content mt-8">
        <blockquote>
          This policy describes how the Auric application handles information when you use it.
          It is provided for transparency and as a template for this project — it is not a
          substitute for legal advice.
        </blockquote>

        <h2>What Auric does not collect</h2>
        <p>
          Auric does not require an account, email address, or password. We do not collect your
          private keys or seed phrases — these never leave your wallet software, and Auric never
          has access to them.
        </p>

        <h2>Wallet addresses &amp; on-chain data</h2>
        <p>
          When you connect a wallet, Auric reads your public wallet address(es) to display your
          balances, NFTs, listings, and activity. This information — along with anything you
          mint, list, buy, or transfer — is recorded on the Solana and/or Bitcoin blockchains,
          which are public and permanent by nature. Anyone can view this information using a
          block explorer, independent of Auric.
        </p>

        <h2>Profile information</h2>
        <p>
          If you set a display name, bio, avatar, or banner on your profile, that information is
          associated with your connected wallet address and stored so it can be shown on your
          profile page. You can edit or clear this information at any time from your profile.
        </p>

        <h2>Local storage &amp; cookies</h2>
        <p>
          Auric uses your browser&apos;s local storage to remember your connected wallet session,
          theme preference, and profile customizations between visits. This data stays on your
          device and is used to make the app work — it is not used for advertising or tracking
          across other sites.
        </p>

        <h2>Contact form</h2>
        <p>
          If you submit the <a href="/contact">contact form</a>, the name, email address, and
          message you provide are used solely to respond to your inquiry.
        </p>

        <h2>Third-party services</h2>
        <p>
          Connecting a wallet involves interacting with your wallet extension or app (such as
          Phantom, Solflare, or a Bitcoin wallet) and with the Solana and Bitcoin networks
          directly. Minted media may be stored on decentralized storage networks. These services
          have their own privacy practices, independent of Auric.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          As Auric&apos;s features evolve — particularly as the platform API described in our{" "}
          <a href="/api-docs">API reference</a> comes online — this policy may be updated to
          reflect new data handling. Material changes will be reflected by updating the date at
          the top of this page.
        </p>

        <h2>Questions</h2>
        <p>
          If you have questions about this policy, reach out via the{" "}
          <a href="/contact">contact page</a>.
        </p>
      </div>
    </div>
  );
}
