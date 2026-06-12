import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation — Auric",
  description: "Get started with Auric: connect a wallet, mint NFTs, and manage listings across Solana and Bitcoin Ordinals.",
};

export default function DocsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <h1 className="text-3xl font-headings font-bold text-text-primary">Documentation</h1>
      <p className="mt-2 text-text-secondary">
        Everything you need to start minting, collecting, and trading on Auric.
      </p>

      <div className="doc-content mt-8">
        <h2>1. Connect a wallet</h2>
        <p>
          Click <strong>Connect Wallet</strong> in the top navigation. Auric supports Solana
          wallets (such as Phantom or Solflare) and Bitcoin wallets for Ordinals. You can connect
          one or both — your profile and activity history are tracked per address, and a single
          profile page shows holdings from whichever chains you&apos;ve connected.
        </p>
        <p>
          Switch your active chain at any time from the wallet menu. The active chain determines
          which network new mints and listings are created on.
        </p>

        <h2>2. Browse and search</h2>
        <p>
          Use <strong>Explore</strong> to browse listings across both chains. Filter by chain
          (Solana / Bitcoin), listing status (Buy Now / Live Auction), and price range, or search
          directly from the navigation bar for NFTs, collections, and wallet addresses.
        </p>
        <p>
          Each NFT has its own detail page at <code>/nft/[chain]/[id]</code> showing its
          attributes, current listing, and on-chain identifiers (mint address for Solana,
          inscription ID for Bitcoin).
        </p>

        <h2>3. Mint an NFT</h2>
        <p>
          Go to <strong>Create</strong> and choose a chain:
        </p>
        <ul>
          <li>
            <strong>Solana</strong> — upload your media and metadata, set a name, description,
            and optional royalty percentage, then confirm the transaction in your wallet. Your
            NFT is minted using the Metaplex Token Metadata standard.
          </li>
          <li>
            <strong>Bitcoin</strong> — upload content to be inscribed onto a satoshi. Choose a
            fee rate (economy, standard, or priority) based on how quickly you want the
            inscription to confirm.
          </li>
        </ul>
        <p>
          Minting fees are shown up front before you confirm, including network and platform
          fees. Once confirmed, your new NFT appears under the <strong>Created</strong> tab on
          your profile.
        </p>

        <h2>4. List, buy, and manage sales</h2>
        <p>
          From an NFT&apos;s detail page, owners can create a listing with a fixed price. Buyers
          can purchase listed NFTs directly — the marketplace handles the on-chain transfer and
          payment in a single transaction.
        </p>
        <p>
          To cancel a listing, open your profile&apos;s <strong>Listed</strong> tab and select{" "}
          <strong>Delist</strong>. This returns the NFT to your wallet without a sale.
        </p>

        <h2>5. Your profile</h2>
        <p>
          Your profile page (<code>/profile/[address]</code>) is organized into four tabs:{" "}
          <strong>Collected</strong>, <strong>Created</strong>, <strong>Listed</strong>, and{" "}
          <strong>Activity</strong>. If you&apos;re viewing your own profile, you can edit your
          display name, bio, avatar, and banner from the <strong>Edit Profile</strong> button.
        </p>

        <h2>Next steps</h2>
        <p>
          For a deeper look at how each chain represents NFTs, read the{" "}
          <a href="/guides/bitcoin-ordinals">Bitcoin Ordinals Guide</a> and the{" "}
          <a href="/guides/solana-nfts">Solana NFT Guide</a>. For platform fees and common
          questions, see the <a href="/faq">FAQ</a>.
        </p>
      </div>
    </div>
  );
}
