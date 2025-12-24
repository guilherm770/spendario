const PlaceholderRow = ({ label, meta }: { label: string; meta: string }) => (
  <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-200">
    <span>{label}</span>
    <span className="text-slate-400">{meta}</span>
  </div>
);

export default function ExpensesPage() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/70">Despesas</p>
          <h1 className="text-2xl font-bold text-white">Lista e filtros</h1>
          <p className="text-sm text-slate-300">Pronto para conectar ao backend com paginação e filtros.</p>
        </div>
        <button className="rounded-lg border border-emerald-400/60 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/20">
          Nova despesa
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <PlaceholderRow label="Cartão • Mercado" meta="R$ 120,00 · Hoje" />
        <PlaceholderRow label="Transporte" meta="R$ 38,00 · Ontem" />
        <PlaceholderRow label="Assinaturas" meta="R$ 59,90 · 2 dias" />
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 text-sm text-slate-200">
        <p className="font-semibold text-white">Fluxo esperado</p>
        <ul className="mt-2 space-y-1">
          <li>• GET /expenses com paginação e filtros (mês, categoria, busca).</li>
          <li>• PUT/DELETE inline com feedback otimista.</li>
          <li>• Estado vazio amigável e skeleton enquanto carrega.</li>
        </ul>
      </div>
    </div>
  );
}
