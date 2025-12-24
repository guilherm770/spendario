const StatCard = ({ title, value, helper }: { title: string; value: string; helper?: string }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-emerald-500/5">
    <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/70">{title}</p>
    <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    {helper && <p className="mt-1 text-sm text-slate-400">{helper}</p>}
  </div>
);

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-emerald-500/10">
        <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/70">Visão geral</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Bem-vindo de volta</h1>
        <p className="mt-2 text-sm text-slate-300">
          Estrutura de navegação protegida pronta para conectar com o backend. Use o menu para acessar despesas e
          categorias; o logout limpa a sessão local.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Gasto no mês" value="R$ 4.820" helper="Última atualização há 5min" />
        <StatCard title="Categorias usadas" value="8" helper="Sem buracos de categorização" />
        <StatCard title="Despesas lançadas" value="126" helper="Incluindo importações" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr,1fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-lg font-semibold text-white">Próximos passos</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            <li>• Conectar fetch das despesas para popular cards.</li>
            <li>• Manter token em header Authorization para rotas protegidas.</li>
            <li>• Aplicar filtros e paginação nas telas de despesas.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-lg font-semibold text-white">Checklist rápido</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            <li>• Navegação desktop e mobile.</li>
            <li>• Logout limpa localStorage.</li>
            <li>• Redirecionamento para /login sem token.</li>
            <li>• Testes E2E cobrem redirecionamento e navegação.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
