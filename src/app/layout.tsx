import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    default: "Amazon.com — Online Shopping for Electronics, Apparel & more",
    template: "%s — Amazon.com",
  },
  description:
    "Shop 268 products across 10 departments: electronics, computers, home & kitchen, fashion, books and more. Free delivery on Prime items.",
  // A clone that reproduces Amazon's branding should not turn up in search
  // results. Public link, yes; indexed, no. See src/app/robots.ts.
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body id="top" className="min-h-screen bg-canvas antialiased">
        {/* Keyboard users get past the nav without tabbing the whole header. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-ink"
        >
          Skip to main content
        </a>

        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
