"use client";

import { useEffect, useMemo, useState } from "react";

type Category = { id: number; name: string; desc: string };
const STORAGE_KEY = "spendario.categories";

const CategoryCard = ({ name, desc }: { name: string; desc: string }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-md shadow-emerald-500/5">
    <p className="text-sm font-semibold text-white">{name}</p>
    <p className="text-sm text-slate-300">{desc}</p>
  </div>
);

export default function CategoriesPage() {
  const defaults: Category[] = useMemo(
    () => [
      { id: 1, name: "Alimentação", desc: "Supermercado, restaurantes e delivery." },
      { id: 2, name: "Transporte", desc: "Combustível, app de corridas, transporte público." },
      { id: 3, name: "Moradia", desc: "Aluguel, condomínio, luz, água, internet." },
      { id: 4, name: "Assinaturas", desc: "Streaming, apps, softwares." },
      { id: 5, name: "Saúde", desc: "Consultas, medicamentos, exames." },
      { id: 6, name: "Lazer", desc: "Viagens, cinema, shows." },
    ],
    [],
  );
  const [categories, setCategories] = useState<Category[]>(defaults);
  const [creating, setCreating] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!saved) {
      setCategories(defaults);
      return;
    }
    try {
      const parsed = JSON.parse(saved) as Category[];
      setCategories(parsed);
    } catch {
      setCategories(defaults);
    }
  }, [defaults]);

  const persist = (next: Category[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const handleCreate = () => {
    setError("");
    if (!formName.trim() || !formDesc.trim()) {
      setError("Preencha nome e descrição.");
      return;
    }
    const next: Category = {
      id: categories.length > 0 ? Math.max(...categories.map((c) => c.id)) + 1 : 1,
      name: formName.trim(),
      desc: formDesc.trim(),
    };
    setCategories((prev) => {
      const updated = [...prev, next];
      persist(updated);
      return updated;
    });
    setFormName("");
    setFormDesc("");
    setCreating(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/70">Categorias</p>
          <h1 className="text-2xl font-bold text-white">Organize suas despesas</h1>
          <p className="text-sm text-slate-300">Categorias prontas para editar e reordenar.</p>
        </div>
        <button
          className="rounded-lg border border-emerald-400/60 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/20"
          onClick={() => setCreating((prev) => !prev)}
          type="button"
        >
          Nova categoria
        </button>
      </div>

      {creating && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-md shadow-emerald-500/5">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-semibold text-white" htmlFor="category-name">
              Nome
              <input
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                id="category-name"
                maxLength={60}
                placeholder="Ex: Educação"
                value={formName}
                onChange={(event) => {
                  setFormName(event.target.value);
                  setError("");
                }}
              />
            </label>
            <label className="text-sm font-semibold text-white" htmlFor="category-desc">
              Descrição curta
              <input
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                id="category-desc"
                maxLength={100}
                placeholder="Ex: Cursos, livros, graduação"
                value={formDesc}
                onChange={(event) => {
                  setFormDesc(event.target.value);
                  setError("");
                }}
              />
            </label>
          </div>
          {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="rounded-lg border border-emerald-400/60 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-50 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/20"
              onClick={handleCreate}
              type="button"
            >
              Salvar categoria
            </button>
            <button
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-rose-400"
              onClick={() => {
                setCreating(false);
                setFormName("");
                setFormDesc("");
                setError("");
              }}
              type="button"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <CategoryCard key={category.id} name={category.name} desc={category.desc} />
        ))}
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
