import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Startup Tracker",
  description: "Track AI startups, products, and key persons",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen`}>
        <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                🚀 AI Startup Tracker
              </Link>
              <div className="flex gap-6">
                <Link href="/" className="text-gray-300 hover:text-white transition">Dashboard</Link>
                <Link href="/startups" className="text-gray-300 hover:text-white transition">Startups</Link>
                <Link href="/products" className="text-gray-300 hover:text-white transition">Products</Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-gray-800 mt-12 py-6 text-center text-gray-500 text-sm">
          <a href="https://zero.tidbcloud.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-gray-300 transition">
            Powered by TiDB Cloud ⚡
          </a>
        </footer>
      </body>
    </html>
  );
}
