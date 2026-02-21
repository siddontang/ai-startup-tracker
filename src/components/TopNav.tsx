"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Startups", href: "/startups" },
  { label: "People", href: "/people" },
  { label: "VCs", href: "/vcs" },
  { label: "RSS", href: "/api/rss", external: true },
];

const TIDB_URL =
  "https://tidbcloud.com/free-trial/?utm_source=sales_bdm&utm_medium=sales&utm_content=Siddon";

export default function TopNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16">
        {/* Logo */}
        <Link href="/" className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent whitespace-nowrap">
          🚀 AI Startup Tracker
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 ml-8">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const cls = `px-4 py-2 rounded-lg text-base font-medium transition-colors ${
              active ? "text-white bg-gray-800" : "text-gray-400 hover:text-white hover:bg-gray-800/50"
            }`;
            return item.external ? (
              <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className={cls}>
                {item.label}
              </a>
            ) : (
              <Link key={item.href} href={item.href} className={cls}>
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* CTA + mobile toggle */}
        <div className="flex items-center gap-3 ml-auto">
          <a
            href={TIDB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-lg shadow-blue-500/20"
          >
            ⚡ Powered by TiDB Cloud — Try Free
          </a>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-800 bg-gray-900/95 backdrop-blur px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const cls = `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active ? "text-white bg-gray-800" : "text-gray-400 hover:text-white hover:bg-gray-800/50"
            }`;
            return item.external ? (
              <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className={cls}>
                {item.label}
              </a>
            ) : (
              <Link key={item.href} href={item.href} className={cls} onClick={() => setMobileOpen(false)}>
                {item.label}
              </Link>
            );
          })}
          <a
            href={TIDB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center mt-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold"
          >
            ⚡ TiDB Cloud — Try Free
          </a>
        </div>
      )}
    </nav>
  );
}
