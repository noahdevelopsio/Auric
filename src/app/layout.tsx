import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { ToastContainer } from "@/components/ui/Toast";
import SolanaProviders from "@/components/wallet/SolanaProviders";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Auric — Dual-Chain NFT Platform",
  description: "Mint, collect, and trade NFTs on Bitcoin Ordinals and Solana in one place.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased bg-bg-base text-text-primary ${inter.className}`}
      >
        <SolanaProviders>
          <Navbar />
          <main className="min-h-screen pt-14 lg:pt-16">
            {children}
          </main>
        </SolanaProviders>
        <MobileBottomNav />
        <Footer />
        <ToastContainer />
      </body>
    </html>
  );
}
