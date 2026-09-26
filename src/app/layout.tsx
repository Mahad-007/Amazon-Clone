import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--nf-bricolage",
  display: "swap",
});
const sans = Inter({ subsets: ["latin"], variable: "--nf-inter", display: "swap" });
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--nf-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "HAUL — stuff worth hauling home",
    template: "%s · HAUL",
  },
  description:
    "HAUL is a loud little store: 268 products across 10 departments, real search, a real cart and real checkout, all backed by Postgres.",
  // A take-home project, not a real shop: public link, not indexed.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body id="top" className="flex min-h-screen flex-col bg-paper antialiased">
        {/* Keyboard users get past the header without tabbing through it. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:border-[3px] focus:border-ink focus:bg-lime focus:px-4 focus:py-2 focus:font-bold"
        >
          Skip to main content
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
