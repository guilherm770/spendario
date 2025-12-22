import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spendario",
  description: "Organize suas finanças com ingestão rápida de despesas.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-950 text-slate-100">
        <div className="min-h-screen">
          <header className="border-b border-slate-800 bg-slate-900/70 px-6 py-4 backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500" />
                <div>
                  <p className="text-sm text-slate-400">Spendario</p>
                  <p className="text-lg font-semibold">Controle de gastos, sem fricção</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-100 transition hover:-translate-y-0.5 hover:border-emerald-400 hover:text-white"
                  href="/login"
                >
                  Entrar
                </Link>
                <Link
                  className="rounded-lg border border-emerald-500 bg-emerald-500/10 px-3 py-1.5 text-sm font-semibold text-emerald-100 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-white"
                  href="/register"
                >
                  Criar conta
                </Link>
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
