"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { AuricGemLogo } from "@/components/ui/AuricLogo";
import { useWalletStore } from "@/store/walletStore";
import { ArrowLeft, ChevronDown, Menu, Search, Wallet, Bitcoin, CircleDot } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { WalletModal } from "@/components/wallet/WalletModal";
import MobileMenu from "./MobileMenu";
import WalletDropdown from "./WalletDropdown";

export function Navbar() {
  const { solanaAddress, btcAddress, activeChain, openModal } = useWalletStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [walletDropdown, setWalletDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isConnected = !!solanaAddress || !!btcAddress;
  const address = activeChain === "solana" ? solanaAddress : btcAddress;

  const shortenAddress = (address: string | null | undefined) => {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const searchRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setSearchOpen(false);
    setSearchQuery("");
    setMobileOpen(false);
    setWalletDropdown(false);
  }, [pathname]);

  const navItems = useMemo(
    () => [
      { href: "/explore", label: "Explore" },
      { href: "/marketplace", label: "Marketplace" },
      { href: "/mint", label: "Create" },
      { href: "/explore?view=collections", label: "Collections" },
    ],
    []
  );

  // mock data for search
  const mockNFTs = [
    { id: 'n1', title: 'Blue Robot #001', collection: 'Robots', chain: 'solana' as const, tokenId: '001' },
    { id: 'n2', title: 'Sol Bloom', collection: 'Solana Flowers', chain: 'solana' as const, tokenId: '011' },
    { id: 'n3', title: 'Ordinal Ape', collection: 'Ordinals Club', chain: 'bitcoin' as const, tokenId: '018' }
  ];
  const mockCollections = [
    { id: 'c1', title: 'Robots', slug: 'robots' },
    { id: 'c2', title: 'Solana Flowers', slug: 'solana-flowers' }
  ];
  const mockWallets = [
    { id: 'w1', title: '7xKp...3mZq', address: '7xKpBnZq3mRm7fYd3mZqABCDEF123456789abcdef12' },
    { id: 'w2', title: '4nFz...8PbT', address: '4nFzCQxmRm7fYd3mAbCdEf123456789abcdefghPbT' }
  ];

  const nftResults = mockNFTs.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const collectionResults = mockCollections.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const walletResults = mockWallets.filter(w => w.title.toLowerCase().includes(searchQuery.toLowerCase()) || w.title.includes(searchQuery));
  const showMobileSearch = searchOpen && !mobileOpen;

  const goToSearchResult = (href: string) => {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(href);
  };

  const chainDots = isConnected ? (
    <span className="flex items-center gap-1">
      {solanaAddress && btcAddress ? (
        <span className="flex items-center gap-0.5" aria-label="Dual chain connected">
          <Bitcoin className="h-3.5 w-3.5 text-btc-500" />
          <CircleDot className="h-3.5 w-3.5 text-sol-500" />
        </span>
      ) : activeChain === "solana" ? (
        <span className="h-2 w-2 rounded-full bg-sol-500 shadow-sol" aria-hidden="true" />
      ) : (
        <span className="h-2 w-2 rounded-full bg-btc-500 shadow-btc" aria-hidden="true" />
      )}
    </span>
  ) : null;

  return (
    <>
      <nav className={`fixed top-0 z-50 w-full border-b transition-colors duration-200 ${scrolled ? "border-border-subtle bg-bg-base/85 backdrop-blur-md" : "border-transparent bg-bg-base/55 backdrop-blur-md"}`}>
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-16 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href="/" className="group transition-transform duration-150 hover:scale-[1.02]" aria-label="Auric home">
              <AuricGemLogo size={26} textSize="text-[18px]" />
            </Link>

            <div className="hidden items-center gap-8 lg:flex">
              {navItems.map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href.split("?")[0]));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`border-b-2 pb-1 text-sm font-medium transition-colors duration-150 ${active ? "border-text-primary text-text-primary" : "border-transparent text-text-secondary hover:text-text-primary"}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center lg:flex">
              {!searchOpen ? (
                <button
                  aria-label="Search"
                  onClick={() => setSearchOpen(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong"
                >
                  <Search className="h-5 w-5" />
                </button>
              ) : (
                <div className="relative">
                  <div className="flex h-10 w-[480px] items-center rounded-md border border-border-strong bg-bg-overlay px-4 shadow-md transition-all duration-200">
                    <button
                      aria-label="Close search"
                      onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                      className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <Search className="mr-3 h-4 w-4 text-text-tertiary" />
                    <input
                      ref={searchRef}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowDown") {
                          const first = document.querySelector<HTMLButtonElement>('[role="listbox"] button');
                          first?.focus();
                          e.preventDefault();
                        }
                        if (e.key === "Escape") {
                          setSearchOpen(false);
                          setSearchQuery("");
                        }
                      }}
                      className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
                      placeholder="Search NFTs, collections, wallets..."
                      aria-label="Search"
                    />
                    <span className="ml-3 rounded-full border border-border-default px-2 py-1 text-[11px] text-text-tertiary">esc</span>
                  </div>

                  {searchQuery.length > 0 && (
                    <div role="listbox" aria-label="Search results" className="absolute left-0 top-full z-50 mt-2 w-[480px] overflow-hidden rounded-lg border border-border-default bg-bg-surface shadow-xl">
                      <div className="border-b border-border-subtle px-4 py-3 text-xs uppercase tracking-[0.08em] text-text-tertiary">Results</div>
                      <div className="p-2">
                        {nftResults.length > 0 && (
                          <div className="mb-3">
                            <div className="px-2 pb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-text-tertiary">NFTs</div>
                            {nftResults.map((n) => (
                              <button
                                key={n.id}
                                role="option"
                                onClick={() => goToSearchResult(`/nft/${n.chain}/${n.tokenId}`)}
                                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-text-primary transition-colors hover:bg-bg-elevated"
                              >
                                <span>{n.title}</span>
                                <span className="text-xs text-text-tertiary">{n.collection}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {collectionResults.length > 0 && (
                          <div className="mb-3">
                            <div className="px-2 pb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-text-tertiary">Collections</div>
                            {collectionResults.map((c) => (
                              <button
                                key={c.id}
                                role="option"
                                onClick={() => goToSearchResult(`/collection/${c.slug}`)}
                                className="w-full rounded-md px-3 py-2 text-left text-sm text-text-primary transition-colors hover:bg-bg-elevated"
                              >
                                {c.title}
                              </button>
                            ))}
                          </div>
                        )}

                        {walletResults.length > 0 && (
                          <div>
                            <div className="px-2 pb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-text-tertiary">Wallets</div>
                            {walletResults.map((w) => (
                              <button
                                key={w.id}
                                role="option"
                                onClick={() => goToSearchResult(`/profile/${w.address}`)}
                                className="w-full rounded-md px-3 py-2 text-left text-sm text-text-primary transition-colors hover:bg-bg-elevated"
                              >
                                {w.title}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <button
                aria-label="Search"
                onClick={() => setSearchOpen((s) => !s)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong"
              >
                <Search className="h-5 w-5" />
              </button>
              <button
                aria-label="Menu"
                aria-controls="mobile-menu"
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>

            <div className="ml-2 hidden lg:block">
              {isConnected ? (
                <div className="relative inline-block">
                  <button
                    onClick={() => setWalletDropdown((s) => !s)}
                    aria-haspopup="true"
                    aria-expanded={walletDropdown}
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-border-default bg-bg-surface px-3 font-mono text-xs text-text-primary transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong"
                  >
                    {chainDots}
                    <span>{shortenAddress(address)}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-text-tertiary" />
                  </button>
                  {walletDropdown && <WalletDropdown onClose={() => setWalletDropdown(false)} />}
                </div>
              ) : (
                <Button onClick={() => openModal()} size="sm">
                  <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <WalletModal />
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} onOpenWallet={() => openModal()} />

      {showMobileSearch && (
        <div className="fixed inset-x-0 top-14 z-40 h-[calc(100vh-3.5rem)] bg-bg-base px-4 py-4 lg:hidden">
          <div className="flex items-center rounded-md border border-border-default bg-bg-overlay px-3 py-2">
            <Search className="mr-2 h-4 w-4 text-text-tertiary" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
              placeholder="Search NFTs, collections, wallets..."
              aria-label="Search"
            />
            <button onClick={() => setSearchOpen(false)} className="ml-3 text-sm text-text-tertiary">
              Esc
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
