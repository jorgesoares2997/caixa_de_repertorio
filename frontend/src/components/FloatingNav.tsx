"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { StickerPillButton } from "./StickerPillButton";
import { Plus } from "lucide-react";

export function FloatingNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-4 md:bottom-auto md:top-5 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-2 md:gap-4 bg-surface border-2 border-ink rounded-2xl p-1.5 md:p-2 shadow-[4px_4px_0px_#161616] flex-wrap md:flex-nowrap justify-between max-w-5xl w-full">
        
        {/* Brand Logo & Name */}
        <Link 
          href="/"
          className="flex items-center gap-2.5 px-2 py-1 rounded-xl hover:bg-muted/70 transition-colors group select-none"
        >
          <div className="relative w-8 h-8 md:w-9 md:h-9 rounded-xl overflow-hidden border-2 border-ink bg-accent-lime shadow-[1.5px_1.5px_0px_#161616] group-hover:scale-105 transition-transform shrink-0 flex items-center justify-center">
            <Image 
              src="/logo.png" 
              alt="Caixa de Repertório" 
              width={36} 
              height={36} 
              className="object-cover w-full h-full"
              priority
            />
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="font-black font-[family-name:var(--font-oswald)] uppercase text-base md:text-lg tracking-tight text-ink leading-none">
              Caixa de Repertório
            </span>
            <span className="text-[10px] font-bold text-dim uppercase tracking-wider font-[family-name:var(--font-dm-sans)] leading-none mt-0.5">
              Estúdio Musical & Gigs
            </span>
          </div>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <NavLink href="/" label="Início" current={pathname === "/"} />
          <NavLink href="/songs" label="Acervo" current={pathname === "/songs"} />
          <NavLink href="/representatives" label="Projetos" current={pathname.startsWith("/representatives")} />
          <NavLink href="/gigs" label="Shows" current={pathname === "/gigs"} />
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-2">
          <StickerPillButton 
            variant="lime"
            onClick={() => window.location.href = '/gigs/new'}
            icon={<Plus className="w-3.5 h-3.5 text-surface" />}
          >
            Novo Show
          </StickerPillButton>
        </div>
      </div>
    </div>
  );
}

function NavLink({ href, label, current }: { href: string; label: string; current: boolean }) {
  return (
    <Link 
      href={href}
      className={`px-3 md:px-3.5 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider font-[family-name:var(--font-dm-sans)] transition-colors whitespace-nowrap ${
        current 
          ? 'bg-ink text-surface shadow-[2px_2px_0px_#161616]' 
          : 'text-ink hover:bg-muted'
      }`}
    >
      {label}
    </Link>
  );
}
