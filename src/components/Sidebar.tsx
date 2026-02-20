"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const navItems = [
  { icon: "🚀", label: "Dashboard", href: "/" },
  { icon: "🔍", label: "Startups", href: "/startups" },
  { icon: "👥", label: "People", href: "/people" },
  { icon: "🏦", label: "VCs", href: "/vcs" },
  { icon: "📡", label: "RSS", href: "/api/rss", external: true },
];

const TIDB_URL =
  "https://tidbcloud.com/free-trial/?utm_source=sales_bdm&utm_medium=sales&utm_content=Siddon";

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed, mounted]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-gray-800 shrink-0">
        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent truncate">
          {collapsed ? "🚀" : "🚀 AI Startup Tracker"}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const cls = `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            active
              ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
              : "text-gray-400 hover:text-white hover:bg-gray-800"
          }`;
          const content = (
            <>
              <span className="text-lg shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </>
          );
          return item.external ? (
            <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className={cls}>
              {content}
            </a>
          ) : (
            <Link key={item.href} href={item.href} className={cls} onClick={() => setMobileOpen(false)}>
              {content}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-4 space-y-2 shrink-0">
        <a
          href={TIDB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-medium transition justify-center"
        >
          <span>⚡</span>
          {!collapsed && <span>TiDB Cloud</span>}
        </a>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition text-sm"
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-gray-800 p-2 rounded-lg text-gray-300 hover:text-white"
      >
        ☰
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative w-[220px] bg-gray-900 h-full z-50">{sidebarContent}</div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:block fixed left-0 top-0 h-full bg-gray-900 border-r border-gray-800 z-40 transition-all duration-300 ${
          collapsed ? "w-16" : "w-[220px]"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Spacer */}
      <div
        className={`hidden md:block shrink-0 transition-all duration-300 ${
          collapsed ? "w-16" : "w-[220px]"
        }`}
      />
    </>
  );
}
