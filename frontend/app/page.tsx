const Pill = ({ label }: { label: string }) => (
  <span className="rounded-full border border-emerald-400/50 bg-emerald-400/5 px-3 py-1 text-xs text-emerald-100">
    {label}
  </span>
);

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-lg shadow-emerald-500/5">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-300/80">Sprint 0</p>
        <h1 className="mt-3 text-3xl font-bold text-white">Fundação do Spendario</h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          Estrutura inicial para acelerar autenticação, ingestão rápida de despesas e monitoramento. O
          foco é ter ambiente local pronto e consistente para o time.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Pill label="Next.js 14" />
          <Pill label="FastAPI" />
          <Pill label="Tailwind" />
          <Pill label="PostgreSQL" />
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-cyan-500/5">
          <h2 className="text-xl font-semibold text-white">Ambiente Frontend</h2>
          <p className="mt-2 text-sm text-slate-300">
            Next.js 14 + Tailwind prontos para evoluir telas de login e ingestão de despesas.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-200">
            <li>• `npm run dev` inicia em <span className="text-emerald-300">http://localhost:3000</span></li>
            <li>• `npm run lint` garante padrões Next/TypeScript</li>
            <li>• `npm run type-check` para checar tipos</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-emerald-500/5">
          <h2 className="text-xl font-semibold text-white">API FastAPI</h2>
          <p className="mt-2 text-sm text-slate-300">
            Stub inicial com rota `/health` para validar pipeline e hot-reload com Uvicorn.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-200">
            <li>• `poetry run uvicorn app.main:app --reload` sobe em <span className="text-emerald-300">http://localhost:8000</span></li>
            <li>• `poetry run ruff check .` e `mypy src` já configurados</li>
            <li>• Teste de saúde com `pytest`</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
