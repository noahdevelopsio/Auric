export default function ConnectPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col justify-center px-4 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">Wallet connection</p>
      <h1 className="mt-4 font-display text-display-lg text-text-primary sm:text-display-xl">Connect your wallet</h1>
      <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-text-secondary">
        Auric supports Solana and Bitcoin wallets. Use the wallet controls in the navbar to connect and continue to mint or browse the marketplace.
      </p>
    </div>
  );
}
