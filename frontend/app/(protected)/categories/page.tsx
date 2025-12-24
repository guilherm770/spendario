const CategoryCard = ({ name, desc }: { name: string; desc: string }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-md shadow-emerald-500/5">
    <p className="text-sm font-semibold text-white">{name}</p>
    <p className="text-sm text-slate-300">{desc}</p>
  </div>
);

export default function CategoriesPage() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/70">Categorias</p>
          <h1 className="text-2xl font-bold text-white">Organize suas despesas</h1>
          <p className="text-sm text-slate-300">Categorias prontas para editar e reordenar.</p>
        </div>
        <button className="rounded-lg border border-emerald-400/60 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/20">
          Nova categoria
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <CategoryCard name="Alimentação" desc="Supermercado, restaurantes e delivery." />
        <CategoryCard name="Transporte" desc="Combustível, app de corridas, transporte público." />
        <CategoryCard name="Moradia" desc="Aluguel, condomínio, luz, água, internet." />
        <CategoryCard name="Assinaturas" desc="Streaming, apps, softwares." />
        <CategoryCard name="Saúde" desc="Consultas, medicamentos, exames." />
        <CategoryCard name="Lazer" desc="Viagens, cinema, shows." />
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 text-sm text-slate-200">
        <p className="font-semibold text-white">Fluxo esperado</p>
        <ul className="mt-2 space-y-1">
          <li>• CRUD de categorias com validação e mensagens claras.</li>
          <li>• Seed inicial já populado no backend.</li>
          <li>• Integração com autocomplete do formulário de despesa.</li>
        </ul>
      </div>
    </div>
  );
}
