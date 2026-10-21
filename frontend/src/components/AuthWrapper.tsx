"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Eye, Shield, LogOut } from "lucide-react";
import Link from "next/link";

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useAppStore((state) => state.currentUser);
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const logout = useAppStore((state) => state.logout);

  const isPublicRoute = pathname === "/" || pathname === "/login";

  useEffect(() => {
    if (!hasHydrated) return;

    // The home page ("/") and login page ("/login") are public to anyone.
    // Accessing any other route without login redirects to /login.
    if (!currentUser && !isPublicRoute) {
      router.push("/login");
    }
  }, [hasHydrated, currentUser, isPublicRoute, router]);

  // When loading hydration on protected routes, avoid flicker
  if (!hasHydrated && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-ink border-t-accent-lime rounded-full animate-spin" />
          <span className="text-xs font-bold uppercase tracking-wider text-dim font-[family-name:var(--font-dm-sans)]">
            Carregando Caixa de Repertório...
          </span>
        </div>
      </div>
    );
  }

  const isVisitor = currentUser?.role === "VISITOR";

  return (
    <>
      {/* Visitor Banner Notification */}
      {isVisitor && pathname !== "/login" && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-accent-lavender border-b-2 border-ink px-4 py-2 text-ink shadow-[0_2px_0px_#161616]">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs font-bold font-[family-name:var(--font-dm-sans)]">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-accent-cherry animate-pulse shrink-0" />
              <Eye className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                <strong className="uppercase">Modo Visitante / Portfólio:</strong> Você pode visualizar todo o acervo e repertórios. Adições, edições e exclusões estão desativadas.
              </span>
            </div>

            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-ink bg-surface hover:bg-accent-lime transition-all text-[11px] font-black uppercase tracking-wider shadow-[1px_1px_0px_#161616] active:translate-y-0.5"
            >
              <Shield className="w-3 h-3 text-ink" />
              <span>Sou o Jorge (Admin)</span>
            </button>
          </div>
        </div>
      )}

      {children}
    </>
  );
}
