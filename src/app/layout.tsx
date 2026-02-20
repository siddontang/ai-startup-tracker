import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SuggestWidget from "@/components/SuggestWidget";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Startup Tracker",
  description: "Track AI startups, products, and key persons",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="alternate" type="application/rss+xml" title="AI Startup Tracker RSS" href="/api/rss" />
      </head>
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
            <SuggestWidget />
            <footer className="border-t border-gray-800 mt-12 py-8 text-center">
              <a href="https://tidbcloud.com/free-trial/?utm_source=sales_bdm&utm_medium=sales&utm_content=Siddon" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-3 rounded-xl text-base font-semibold transition shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40">
                ⚡ Powered by TiDB Cloud — Try Free
              </a>
            </footer>
          </main>
        </div>
      </body>
    </html>
  );
}
