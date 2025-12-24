"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

type NavItem = { label: string; href: string; badge?: string };

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Despesas", href: "/expenses" },
  { label: "Categorias", href: "/categories" },
  { label: "Onboarding", href: "/onboarding", badge: "Novo" },
];

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("spendario.token");
    if (!token) {
      router.replace("/login");
      setAuthorized(false);
      setChecking(false);
      return;
    }

    setAuthorized(true);
    setChecking(false);
  }, [router]);

  const activeMap = useMemo(
    () =>
      navItems.reduce<Record<string, boolean>>((acc, item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        acc[item.href] = isActive;
        return acc;
      }, {}),
    [pathname],
  );

  const handleLogout = () => {
    localStorage.removeItem("spendario.token");
    localStorage.removeItem("spendario.user");
    setAuthorized(false);
    router.replace("/login");
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-6 py-4 text-sm shadow-lg shadow-emerald-500/10">
          Verificando sessão...
        </div>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 border-r border-slate-800 bg-slate-900/80 px-4 py-6 transition lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:block"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500" />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/70">Spendario</p>
              <p className="text-sm font-semibold text-white">Painel</p>
            </div>
          </div>
          <button
            className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-200 transition hover:border-emerald-400 lg:hidden"
            onClick={() => setMobileOpen(false)}
            type="button"
          >
            Fechar
          </button>
        </div>

        <nav className="mt-6 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeMap[item.href]
                  ? "border border-emerald-400/60 bg-emerald-400/10 text-white shadow-lg shadow-emerald-500/10"
                  : "border border-transparent text-slate-200 hover:border-slate-700 hover:bg-slate-800/70"
              }`}
              href={item.href}
              onClick={() => setMobileOpen(false)}
            >
              <span>{item.label}</span>
              {item.badge && (
                <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-100">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="mt-10 space-y-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/70">Sessão</p>
          <p>Token salvo no navegador para chamadas autenticadas.</p>
          <button
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-400/60 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-100 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rose-500/20"
            onClick={handleLogout}
            type="button"
          >
            Sair
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:ml-0">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-semibold text-slate-100 transition hover:border-emerald-400 lg:hidden"
              onClick={() => setMobileOpen((prev) => !prev)}
              type="button"
            >
              Menu
            </button>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/70">Navegação</p>
              <p className="text-lg font-semibold text-white">
                {navItems.find((item) => activeMap[item.href])?.label ?? "Área autenticada"}
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            <div className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
              Sessão ativa
            </div>
            <button
              className="rounded-lg border border-rose-400/60 bg-rose-500/10 px-3 py-1.5 text-sm font-semibold text-rose-100 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rose-500/20"
              onClick={handleLogout}
              type="button"
            >
              Sair
            </button>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
