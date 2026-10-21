"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { StickerPillButton } from "./StickerPillButton";
import { Plus, Home, Music2, Users, Calendar, Sparkles, LogOut, Shield, Eye, LogIn } from "lucide-react";
import { ReactNode } from "react";
import { useAppStore } from "@/lib/store";

export function FloatingNav() {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useAppStore((state) => state.currentUser);
  const logout = useAppStore((state) => state.logout);

  // Do not render nav on login page
  if (pathname === "/login") return null;

  const isAdmin = currentUser?.role === "ADMIN";
  const isVisitor = currentUser?.role === "VISITOR";

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className={`fixed bottom-3 md:bottom-auto ${isVisitor ? "md:top-14" : "md:top-5"} left-0 right-0 z-50 flex justify-center px-3 sm:px-4 pointer-events-none transition-all`}>
      <div className="pointer-events-auto flex items-center justify-between gap-1 sm:gap-3 md:gap-4 bg-surface border-2 border-ink rounded-2xl p-1.5 md:p-2 shadow-[4px_4px_0px_#161616] max-w-5xl w-full">
        
        {/* Brand Logo & Name */}
        <Link 
          href="/"
          className="flex items-center gap-2 px-1.5 py-1 rounded-xl hover:bg-muted/70 transition-colors group select-none shrink-0"
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
          <div className="hidden lg:flex flex-col text-left">
            <span className="font-black font-[family-name:var(--font-oswald)] uppercase text-base md:text-lg tracking-tight text-ink leading-none">
              Caixa de Repertório
            </span>
            <span className="text-[10px] font-bold text-dim uppercase tracking-wider font-[family-name:var(--font-dm-sans)] leading-none mt-0.5">
              Estúdio Musical & Gigs
            </span>
          </div>
        </Link>

        {/* Nav Links with Icons on Mobile and Labels on Desktop */}
        <div className="flex items-center gap-1 sm:gap-1.5 justify-center flex-1 sm:flex-none">
          <NavLink 
            href="/" 
            label="Início" 
            icon={<Home className="w-4 h-4" />} 
            current={pathname === "/"} 
          />
          <NavLink 
            href="/songs" 
            label="Acervo" 
            icon={<Music2 className="w-4 h-4" />} 
            current={pathname === "/songs"} 
          />
          <NavLink 
            href="/representatives" 
            label="Projetos" 
            icon={<Users className="w-4 h-4" />} 
            current={pathname.startsWith("/representatives")} 
          />
          <NavLink 
            href="/gigs" 
            label="Shows" 
            icon={<Calendar className="w-4 h-4" />} 
            current={pathname === "/gigs"} 
          />
        </div>

        {/* Actions & Role Indicator */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {!currentUser ? (
            <Link
              href="/login"
              title="Acessar o sistema ou entrar como visitante"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-ink bg-accent-lime hover:bg-accent-lime/80 text-ink transition-all shadow-[2px_2px_0px_#161616] text-xs font-black uppercase font-[family-name:var(--font-dm-sans)]"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </Link>
          ) : isAdmin ? (
            <>
              {/* Novo Show (Admin only) */}
              <Link
                href="/gigs/new"
                title="Criar Novo Show"
                className="md:hidden p-2 rounded-xl border-2 border-ink bg-accent-lime text-ink shadow-[2px_2px_0px_#161616] hover:bg-accent-lime/80 active:translate-y-0.5 transition-all flex items-center justify-center"
              >
                <Plus className="w-4 h-4 text-ink font-black" />
              </Link>

              <div className="hidden md:block">
                <StickerPillButton 
                  variant="lime"
                  onClick={() => router.push('/gigs/new')}
                  icon={<Plus className="w-3.5 h-3.5 text-surface" />}
                >
                  Novo Show
                </StickerPillButton>
              </div>

              {/* Admin Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                title="Sair do modo Admin (Fazer Logout)"
                className="p-2 sm:px-2.5 sm:py-2 rounded-xl border-2 border-ink bg-surface hover:bg-accent-cherry hover:text-surface text-ink transition-all shadow-[2px_2px_0px_#161616] flex items-center gap-1.5 text-xs font-bold font-[family-name:var(--font-dm-sans)]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden xl:inline text-[11px] uppercase">Sair</span>
              </button>
            </>
          ) : (
            /* Visitor Pill with Switch to Admin */
            <button
              type="button"
              onClick={handleLogout}
              title="Você está navegando como visitante. Clique para entrar como administrador."
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border-2 border-ink bg-accent-lavender hover:bg-accent-lime text-ink transition-all shadow-[2px_2px_0px_#161616] text-xs font-black uppercase font-[family-name:var(--font-dm-sans)]"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Visitante</span>
              <span className="text-[10px] text-dim font-bold hidden md:inline">• Entrar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function NavLink({ 
  href, 
  label, 
  icon, 
  current 
}: { 
  href: string; 
  label: string; 
  icon: ReactNode; 
  current: boolean 
}) {
  return (
    <Link 
      href={href}
      title={label}
      className={`flex items-center gap-1.5 px-2.5 sm:px-3 md:px-3.5 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider font-[family-name:var(--font-dm-sans)] transition-all select-none ${
        current 
          ? 'bg-ink text-surface shadow-[2px_2px_0px_#161616] -translate-y-0.5 md:translate-y-0' 
          : 'text-ink hover:bg-muted bg-surface sm:bg-transparent'
      }`}
    >
      <span className={current ? "text-accent-lime" : "text-ink"}>{icon}</span>
      <span className="hidden sm:inline whitespace-nowrap">{label}</span>
    </Link>
  );
}
