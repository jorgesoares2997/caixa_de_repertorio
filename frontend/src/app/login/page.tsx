"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { StickerPillButton } from "@/components/StickerPillButton";
import { Lock, User, Eye, EyeOff, ShieldCheck, Sparkles, ArrowRight, AlertTriangle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const currentUser = useAppStore((state) => state.currentUser);
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const login = useAppStore((state) => state.login);
  const loginAsVisitor = useAppStore((state) => state.loginAsVisitor);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // If already logged in, redirect to home
  useEffect(() => {
    if (hasHydrated && currentUser) {
      router.push("/");
    }
  }, [hasHydrated, currentUser, router]);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage("Por favor, preencha o usuário e a senha.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      await login(username.trim(), password.trim());
      router.push("/");
    } catch (err: any) {
      setErrorMessage(err?.message || "Usuário ou senha incorretos.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisitorClick = () => {
    loginAsVisitor();
    router.push("/");
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="w-full max-w-lg bg-surface border-2 border-ink rounded-3xl p-6 sm:p-8 shadow-[8px_8px_0px_#161616] relative overflow-hidden">
        
        {/* Decorative Top Accent Tag */}
        <div className="flex items-center justify-between mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent-lime border-2 border-ink rounded-full text-[11px] font-black uppercase tracking-wider text-ink shadow-[2px_2px_0px_#161616] font-[family-name:var(--font-dm-sans)]">
            <Sparkles className="w-3.5 h-3.5" /> Acesso ao Sistema
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-dim font-[family-name:var(--font-dm-sans)]">
            v2.0 • 2026
          </span>
        </div>

        {/* Brand Header */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b-2 border-ink/15">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-ink bg-accent-lime shadow-[3px_3px_0px_#161616] shrink-0 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Caixa de Repertório"
              width={64}
              height={64}
              className="object-cover w-full h-full"
              priority
            />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-ink font-[family-name:var(--font-oswald)] leading-none">
              Caixa de Repertório
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-dim uppercase tracking-wider mt-1 font-[family-name:var(--font-dm-sans)]">
              Estúdio Musical & Portfólio Artístico
            </p>
          </div>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mb-6 p-3.5 bg-accent-cherry/10 border-2 border-accent-cherry text-accent-cherry rounded-2xl flex items-center gap-2.5 text-xs font-bold font-[family-name:var(--font-dm-sans)] shadow-[2px_2px_0px_#161616]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Admin Login Form */}
        <form onSubmit={handleAdminSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-ink mb-1.5 font-[family-name:var(--font-dm-sans)]">
              Usuário do Administrador
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-canvas border-2 border-ink rounded-xl py-2.5 pl-10 pr-4 font-semibold text-ink text-sm shadow-[2px_2px_0px_#161616] focus:outline-none focus:ring-2 focus:ring-accent-lime"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-ink mb-1.5 font-[family-name:var(--font-dm-sans)]">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-canvas border-2 border-ink rounded-xl py-2.5 pl-10 pr-11 font-semibold text-ink text-sm shadow-[2px_2px_0px_#161616] focus:outline-none focus:ring-2 focus:ring-accent-lime"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-ink transition-colors p-1"
                title={showPassword ? "Ocultar senha" : "Ver senha"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl border-2 border-ink bg-accent-lime text-ink font-black text-sm uppercase tracking-wider transition-all shadow-[4px_4px_0px_#161616] hover:shadow-none hover:translate-y-0.5 active:translate-y-1 disabled:opacity-60 flex items-center justify-center gap-2 font-[family-name:var(--font-dm-sans)]"
            >
              <ShieldCheck className="w-4 h-4" />
              {isLoading ? "Autenticando..." : "Entrar como Administrador"}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="relative my-7">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-ink/20" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface px-3 font-black text-dim tracking-widest font-[family-name:var(--font-dm-sans)]">
              ou explore o portfólio
            </span>
          </div>
        </div>

        {/* Visitor Card & Action */}
        <div className="bg-canvas border-2 border-ink rounded-2xl p-4 sm:p-5 shadow-[4px_4px_0px_#161616] space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-lavender border-2 border-ink flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#161616]">
              <Eye className="w-5 h-5 text-ink" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase text-ink font-[family-name:var(--font-oswald)]">
                Acesso Aberto para Visitantes
              </h3>
              <p className="text-xs text-dim font-medium mt-0.5 leading-relaxed">
                Navegue livremente pelo meu acervo de músicas, repertórios por artista, filtros por gênero e exportações em PDF.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleVisitorClick}
            className="w-full py-2.5 px-4 rounded-xl border-2 border-ink bg-surface hover:bg-accent-lavender text-ink font-black text-xs uppercase tracking-wider transition-all shadow-[3px_3px_0px_#161616] hover:shadow-none hover:translate-y-0.5 active:translate-y-1 flex items-center justify-center gap-2 font-[family-name:var(--font-dm-sans)]"
          >
            <span>Entrar como Visitante</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
