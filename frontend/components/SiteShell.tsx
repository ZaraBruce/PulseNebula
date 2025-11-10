"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useMemo } from "react";
import { WalletStatus } from "@/components/WalletStatus";

const NAV_ITEMS: Array<{
  href: string;
  title: string;
  caption: string;
}> = [
  { href: "/dashboard", title: "Overview", caption: "Personal metrics and timeline" },
  { href: "/upload", title: "Sample Ingest", caption: "Encrypt locally and send on-chain" },
  { href: "/insight", title: "Nebula Insights", caption: "Collective stats and trends" },
  { href: "/vault", title: "Private Vault", caption: "Samples and decryption history" },
];

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activeHref = useMemo(() => {
    if (!pathname) return "/dashboard";
    const match = NAV_ITEMS.find((item) => pathname.startsWith(item.href));
    return match?.href ?? "/dashboard";
  }, [pathname]);

  return (
    <div className="min-h-screen px-6 py-6 md:px-10 md:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="shell-surface flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-aurora text-white shadow-glow-aurora">
                PN
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-dusk/60">
                  PULSENEBULA
                </p>
                <p className="text-lg font-semibold text-dusk">Homomorphic Pulse Network</p>
              </div>
            </Link>
            <span className="pill">FHEVM dual-mode</span>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <nav className="flex flex-wrap gap-2 md:gap-3">
              {NAV_ITEMS.map((item) => {
                const isActive = item.href === activeHref;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sheet relative flex min-w-[140px] flex-col rounded-2xl px-4 py-3 transition ${
                      isActive ? "border-aurora/50 shadow-glow-aurora" : "border-clay/80 hover:border-aurora/40"
                    }`}
                  >
                    <span className="text-sm font-semibold text-dusk">{item.title}</span>
                    <span className="mt-1 text-xs text-dusk/60">{item.caption}</span>
                    {isActive && (
                      <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-aurora" />
                    )}
                  </Link>
                );
              })}
            </nav>
            <WalletStatus />
          </div>
        </header>

        <main className="space-y-6">{children}</main>
      </div>
    </div>
  );
}

