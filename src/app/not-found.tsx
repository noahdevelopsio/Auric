import Link from "next/link";
import Particles from "@/components/landing/Particles";

export default function NotFound() {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center text-center overflow-hidden py-20">
      <Particles count={28} />

      <div className="relative z-10 max-w-lg px-4 flex flex-col items-center">
        <h1 className="bg-gradient-sol bg-clip-text text-transparent font-headings font-bold text-7xl sm:text-8xl mb-4">
          404
        </h1>
        <p className="text-text-primary text-lg font-medium mb-2">
          This page doesn&apos;t exist on any chain.
        </p>
        <p className="text-text-secondary text-sm mb-8">
          The NFT, collection, or page you&apos;re looking for has either moved or never existed.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center h-12 px-6 text-base rounded-md bg-sol-500 text-bg-base hover:opacity-90 font-display font-medium transition-all focus:outline-none focus:ring-2 focus:ring-border-strong"
          >
            Go Home
          </Link>
          <Link
            href="/explore"
            className="inline-flex items-center justify-center h-12 px-6 text-base rounded-md border border-border-default text-text-primary hover:bg-bg-elevated font-display font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-border-strong"
          >
            Explore NFTs
          </Link>
        </div>
      </div>
    </section>
  );
}
