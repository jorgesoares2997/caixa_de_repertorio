"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StickerPillButton } from "./StickerPillButton";

export function FloatingNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-6 md:bottom-auto md:top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-2 md:gap-6 bg-canvas border-2 border-ink rounded-2xl p-2 shadow-neo flex-wrap md:flex-nowrap justify-center max-w-full overflow-x-auto">
        
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <NavLink href="/" label="Início" current={pathname === "/"} />
          <NavLink href="/songs" label="Acervo" current={pathname === "/songs"} />
          <NavLink href="/representatives" label="Projetos" current={pathname.startsWith("/representatives")} />
          <NavLink href="/gigs" label="Shows" current={pathname.startsWith("/gigs")} />
        </div>

        <div className="w-px h-6 bg-ink/20 hidden md:block" />

        <StickerPillButton className="hidden md:flex" onClick={() => window.location.href = '/gigs/new'}>
          Novo Show
        </StickerPillButton>
      </div>
    </div>
  );
}

function NavLink({ href, label, current }: { href: string; label: string; current: boolean }) {
  return (
    <Link 
      href={href}
      className={`px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider font-[family-name:var(--font-dm-sans)] transition-colors whitespace-nowrap ${current ? 'bg-ink text-surface' : 'text-ink hover:bg-muted'}`}
    >
      {label}
    </Link>
  );
}
