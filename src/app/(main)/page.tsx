import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Hero from "@/components/landing/Hero";
import StatsBar from "@/components/landing/StatsBar";
import FeaturedDrops from "@/components/sections/FeaturedDrops";
import CreatorSpotlight from "@/components/sections/CreatorSpotlight";
import PullToRefresh from "@/components/ui/PullToRefresh";

export default function LandingPage() {
  return (
    <PullToRefresh>
      <div className="flex flex-col min-h-screen">
        <Hero />
        <StatsBar />

        <section className="py-24 px-4 bg-bg-surface/40">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-xs uppercase tracking-[0.2em] text-text-tertiary mb-3">Two Chains. One Creator.</p>
              <h2 className="text-3xl md:text-4xl font-bold font-headings mb-3">Whether you want permanence or speed, we&apos;ve got you covered.</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Inscribe on Bitcoin</CardTitle>
                  <CardDescription>
                    Your art becomes part of Bitcoin&apos;s permanent ledger.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-text-secondary">
                    Ordinal inscriptions live on the most secure, decentralized blockchain ever created - forever.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mint on Solana</CardTitle>
                  <CardDescription>
                    Low fees, instant confirmation, massive collector base.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-text-secondary">
                    Metaplex-powered NFTs with full royalty support, collections, and marketplace listings.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Manage Both in One Place</CardTitle>
                  <CardDescription>
                    Your cross-chain portfolio in one dashboard.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-text-secondary">
                    See your Bitcoin inscriptions and Solana NFTs side by side. One profile, two chains, infinite possibilities.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <FeaturedDrops />
        <CreatorSpotlight />

        <section className="py-24 px-4 text-center bg-gradient-to-r from-sol/10 to-btc/10">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 font-headings">Your Art. Your Chain. Your Legacy.</h2>
          <p className="text-text-secondary mb-8 max-w-2xl mx-auto">Join thousands of creators building permanent digital legacies on Bitcoin and Solana.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" variant="primary">Start Minting</Button>
            <Button size="lg" variant="ghost">Learn More</Button>
          </div>
        </section>
      </div>
    </PullToRefresh>
  );
}
