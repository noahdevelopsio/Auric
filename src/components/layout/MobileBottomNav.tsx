"use client";

import Link from "next/link";
import { Home, Compass, PlusCircle, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { useWalletStore } from "@/store/walletStore";
import { useHasMounted } from "@/hooks/useHasMounted";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/mint", label: "Create", icon: PlusCircle },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { solanaAddress, btcAddress, openModal } = useWalletStore();
  const hasMounted = useHasMounted();
  const address = hasMounted ? (solanaAddress || btcAddress) : null;
  const profileHref = address ? `/profile/${address}` : null;
  const profileActive = !!profileHref && pathname.startsWith("/profile/");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border-subtle bg-bg-base/95 backdrop-blur-md md:hidden">
      <div className="grid h-14 grid-cols-4 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] ${active ? "text-text-primary" : "text-text-tertiary"}`}
              aria-current={active ? "page" : undefined}
            >
              <span className="relative inline-flex items-center justify-center">
                <Icon className={item.label === "Create" ? "h-6 w-6" : "h-5 w-5"} />
                {active && <span className="absolute -bottom-1 h-0.5 w-2 rounded-full bg-sol-500" />}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}

        {profileHref ? (
          <Link
            href={profileHref}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] ${profileActive ? "text-text-primary" : "text-text-tertiary"}`}
            aria-current={profileActive ? "page" : undefined}
          >
            <span className="relative inline-flex items-center justify-center">
              <User className="h-5 w-5" />
              {profileActive && <span className="absolute -bottom-1 h-0.5 w-2 rounded-full bg-sol-500" />}
            </span>
            <span>Profile</span>
          </Link>
        ) : (
          <button
            onClick={() => openModal()}
            className="flex flex-col items-center justify-center gap-1 text-[11px] text-text-tertiary"
          >
            <span className="relative inline-flex items-center justify-center">
              <User className="h-5 w-5" />
            </span>
            <span>Profile</span>
          </button>
        )}
      </div>
    </nav>
  );
}

export default MobileBottomNav;
