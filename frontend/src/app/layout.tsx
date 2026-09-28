import type { Metadata } from "next";
import { Inter, DM_Sans, Oswald } from "next/font/google";
import "./globals.css";
import { FloatingNav } from "@/components/FloatingNav";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const dmSans = DM_Sans({ subsets: ["latin"], variable: '--font-dm-sans' });
const oswald = Oswald({ subsets: ["latin"], variable: '--font-oswald' });

export const metadata: Metadata = {
  title: "GigManager & Repertoire Studio",
  description: "Manage your gigs and repertoire",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${dmSans.variable} ${oswald.variable} font-sans bg-canvas text-ink antialiased selection:bg-accent-lime selection:text-ink min-h-screen pb-20 md:pb-0`}>
        
        {/* Floating Pill Navigation */}
        <FloatingNav />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
          {children}
        </main>

      </body>
    </html>
  );
}
