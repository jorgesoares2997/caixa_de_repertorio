import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Music, Mic2, Calendar, LayoutDashboard } from "lucide-react";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={`${inter.className} antialiased bg-brand-100 text-brand-800 selection:bg-brand-400/30 selection:text-brand-800`}>
        <div className="flex h-screen overflow-hidden bg-brand-100">
          {/* Sidebar */}
          <aside className="w-72 bg-brand-800/95 backdrop-blur-xl text-brand-100 border-r border-brand-800 p-6 flex flex-col shadow-2xl relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-lg border border-brand-600/50">
                <Image src="/logo.jpg" alt="GigManager Logo" fill className="object-cover" />
              </div>
              <div>
                <h1 className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-brand-300 to-brand-400 bg-clip-text text-transparent">
                  GigManager
                </h1>
                <p className="text-xs text-brand-300/70 font-medium tracking-wider uppercase mt-0.5">Studio</p>
              </div>
            </div>
            
            <nav className="space-y-1.5 flex-1">
              <div className="text-xs font-semibold text-brand-300/50 tracking-wider uppercase mb-3 px-3">Menu</div>
              <Link href="/songs" className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-600/30 transition-all duration-200 hover:shadow-sm">
                <div className="p-1.5 rounded-lg bg-brand-300/10 text-brand-300 group-hover:bg-brand-300/20 group-hover:scale-110 transition-all">
                  <Music className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm text-brand-100/80 group-hover:text-brand-100 transition-colors">Repertoire</span>
              </Link>
              <Link href="/representatives" className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-600/30 transition-all duration-200 hover:shadow-sm">
                <div className="p-1.5 rounded-lg bg-brand-400/10 text-brand-400 group-hover:bg-brand-400/20 group-hover:scale-110 transition-all">
                  <Mic2 className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm text-brand-100/80 group-hover:text-brand-100 transition-colors">Projects & Reps</span>
              </Link>
              <Link href="/gigs" className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-600/30 transition-all duration-200 hover:shadow-sm">
                <div className="p-1.5 rounded-lg bg-brand-300/10 text-brand-300 group-hover:bg-brand-300/20 group-hover:scale-110 transition-all">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm text-brand-100/80 group-hover:text-brand-100 transition-colors">Gigs & Setlists</span>
              </Link>
            </nav>

            <div className="mt-auto pt-6 border-t border-brand-600/30">
               <div className="flex items-center gap-3 px-3 py-2">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-300 to-brand-400 flex items-center justify-center shadow-inner">
                   <span className="text-xs font-bold text-brand-800">JS</span>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-sm font-medium text-brand-100">Jorge Soares</span>
                   <span className="text-xs text-brand-300/80">Pro Musician</span>
                 </div>
               </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto relative">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
            <div className="p-10 max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
