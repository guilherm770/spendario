"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type CategoryOption = {
  id: number;
  label: string;
  icon: string;
  keywords: string[];
};

type Expense = {
  id: string;
  amount: string;
  currency: string;
  description: string;
  transaction_date: string;
  category_id: number;
};

type FormState = {
  amount: string;
  description: string;
  date: string;
  categoryInput: string;
  currency: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const today = new Intl.DateTimeFormat("sv-SE").format(new Date()); // yyyy-mm-dd para input date
const PAGE_SIZE = 50;
const CATEGORY_STORAGE_KEY = "spendario.categories";

const defaultCategories: CategoryOption[] = [
  { id: 1, label: "Alimentação", icon: "🍽️", keywords: ["mercado", "restaurante", "comida"] },
  { id: 2, label: "Transporte", icon: "🚌", keywords: ["uber", "combustível", "gasolina"] },
  { id: 3, label: "Moradia", icon: "🏠", keywords: ["aluguel", "condomínio", "contas"] },
  { id: 4, label: "Saúde", icon: "🩺", keywords: ["farmácia", "remédio", "consulta"] },
  { id: 5, label: "Lazer", icon: "🎉", keywords: ["cinema", "viagem", "passeio"] },
  { id: 6, label: "Educação", icon: "📚", keywords: ["curso", "livro", "faculdade"] },
  { id: 7, label: "Supermercado", icon: "🛒", keywords: ["compras", "mercado"] },
  { id: 8, label: "Assinaturas", icon: "💻", keywords: ["streaming", "software", "app"] },
  { id: 9, label: "Serviços", icon: "🛠️", keywords: ["manutenção", "prestação"] },
  { id: 10, label: "Impostos", icon: "💸", keywords: ["taxa", "iptu", "ipva"] },
  { id: 11, label: "Investimentos", icon: "📈", keywords: ["aplicação", "renda"] },
  { id: 12, label: "Pets", icon: "🐾", keywords: ["veterinário", "ração"] },
  { id: 13, label: "Viagem", icon: "✈️", keywords: ["hotel", "passagem"] },
  { id: 14, label: "Presentes", icon: "🎁", keywords: ["aniversário", "surpresa"] },
  { id: 15, label: "Outros", icon: "🧭", keywords: ["diversos", "extra"] },
];

const normalize = (value: string) => value.trim().toLowerCase();

const formatCurrency = (amount: string, currency: string) => {
  const value = Number(amount);
  if (Number.isNaN(value)) return `${currency} ${amount}`;
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: currency || "BRL" }).format(value);
  } catch {
    return `${currency} ${amount}`;
  }
};

const toOption = (category: { id: number; name: string; desc: string }, nextIdSeed: number): CategoryOption => ({
  id: category.id || nextIdSeed,
  label: category.name,
  icon: "🧩",
  keywords: [normalize(category.name)],
});

export default function ExpensesPage() {
  const [form, setForm] = useState<FormState>({
    amount: "",
    description: "",
    date: today,
    categoryInput: "",
    currency: "BRL",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [serverMessage, setServerMessage] = useState("");

  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>(defaultCategories);

  const [list, setList] = useState<Expense[]>([]);
  const [listStatus, setListStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [listMessage, setListMessage] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [editing, setEditing] = useState<Expense | null>(null);
  const [editForm, setEditForm] = useState<FormState | null>(null);
  const [editErrors, setEditErrors] = useState<FormErrors>({});
  const [editStatus, setEditStatus] = useState<"idle" | "loading" | "error">("idle");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(CATEGORY_STORAGE_KEY);
    if (!saved) {
      setCategoryOptions(defaultCategories);
      return;
    }
    try {
      const parsed = JSON.parse(saved) as { id: number; name: string; desc: string }[];
      const seen = new Set<string>();
      const merged: CategoryOption[] = [];

      parsed.forEach((cat, index) => {
        const match = defaultCategories.find(
          (defaultCat) => normalize(defaultCat.label) === normalize(cat.name),
        );
        const option = match ?? toOption(cat, 10_000 + index);
        const key = normalize(option.label);
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(option);
        }
      });

      setCategoryOptions(merged.length > 0 ? merged : defaultCategories);
    } catch {
      setCategoryOptions(defaultCategories);
    }
  }, []);

  const resolveCategory = useCallback(
    (input: string): CategoryOption | undefined => {
      const normalized = normalize(input);
      if (!normalized) return undefined;
      return categoryOptions.find(
        (item) =>
          normalize(item.label) === normalized ||
          item.keywords.some((keyword) => normalize(keyword) === normalized) ||
          normalize(item.label).includes(normalized),
      );
    },
    [categoryOptions],
  );

  const matchedCategory = useMemo(() => resolveCategory(form.categoryInput), [form.categoryInput, resolveCategory]);
  const matchedEditCategory = useMemo(
    () => resolveCategory(editForm?.categoryInput ?? ""),
    [editForm?.categoryInput, resolveCategory],
  );

  const toFormState = useCallback(
    (expense: Expense): FormState => ({
      amount: String(expense.amount),
      description: expense.description,
      date: expense.transaction_date,
      categoryInput: categoryOptions.find((category) => category.id === expense.category_id)?.label ?? "",
      currency: expense.currency,
    }),
    [categoryOptions],
  );

  const validate = (state: FormState): FormErrors => {
    const next: FormErrors = {};

    const numeric = Number(state.amount.replace(",", "."));
    if (!state.amount || Number.isNaN(numeric) || numeric <= 0) {
      next.amount = "Informe um valor maior que zero.";
    }

    if (!state.description.trim()) {
      next.description = "Adicione uma descrição curta.";
    }

    if (!state.date) {
      next.date = "Escolha a data.";
    }

    if (!resolveCategory(state.categoryInput)) {
      next.categoryInput = "Selecione uma categoria da lista.";
    }

    return next;
  };

  const token = () => {
    if (process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === "1") return "test-token";
    return typeof window !== "undefined" ? localStorage.getItem("spendario.token") : null;
  };

  const fetchList = async (pageToLoad: number) => {
    const auth = token();
    if (!auth) {
      setListStatus("error");
      setListMessage("Faça login novamente para carregar suas despesas.");
      return;
    }
    setListStatus("loading");
    setListMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/expenses?page=${pageToLoad}&page_size=${PAGE_SIZE}`, {
        headers: { Authorization: `Bearer ${auth}` },
      });
      if (!response.ok) {
        throw new Error("Falha ao carregar despesas");
      }
      const data = (await response.json()) as { items: Expense[]; total?: number; page?: number; page_size?: number };
      const totalItems = typeof data.total === "number" ? data.total : data.items?.length ?? 0;

      setList(data.items || []);
      setTotal(totalItems);
      setListStatus("loaded");
    } catch (error) {
      setListStatus("error");
      setListMessage(error instanceof Error ? error.message : "Erro ao carregar despesas.");
    }
  };

  useEffect(() => {
    fetchList(page).catch(() => setListStatus("error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setServerMessage("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerMessage("");
    const validation = validate(form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      setStatus("error");
      return;
    }

    const category = resolveCategory(form.categoryInput);
    if (!category) return;

    const auth = token();
    if (!auth) {
      setServerMessage("Faça login novamente para lançar despesas.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    try {
      const numeric = Number(form.amount.replace(",", "."));
      const payload = {
        amount: numeric.toFixed(2),
        currency: form.currency.trim().toUpperCase() || "BRL",
        description: form.description.trim(),
        transaction_date: form.date,
        category_id: category.id,
      };

      const response = await fetch(`${API_BASE_URL}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const detail = (await response.json().catch(() => ({}))) as { detail?: unknown };
        const message =
          typeof detail?.detail === "string"
            ? detail.detail
            : response.status === 401
              ? "Sessão expirada. Entre novamente."
              : "Não foi possível salvar. Tente em instantes.";
        throw new Error(message);
      }

      const created = (await response.json()) as Expense;

      setStatus("success");
      setServerMessage("Despesa salva! Enter novamente lança outra.");
      setForm((prev) => ({
        ...prev,
        amount: "",
        description: "",
        categoryInput: "",
      }));
      setList((prev) => [created, ...prev]);
      setTotal((prev) => prev + 1);
    } catch (error) {
      setStatus("error");
      setServerMessage(error instanceof Error ? error.message : "Erro inesperado. Tente novamente.");
    }
  };

  const handleEditOpen = (expense: Expense) => {
    setEditing(expense);
    setEditForm(toFormState(expense));
    setEditErrors({});
    setEditStatus("idle");
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing || !editForm) return;
    const validation = validate(editForm);
    if (Object.keys(validation).length > 0) {
      setEditErrors(validation);
      setEditStatus("error");
      return;
    }

    const category = resolveCategory(editForm.categoryInput);
    if (!category) return;
    const auth = token();
    if (!auth) {
      setEditStatus("error");
      setEditErrors((prev) => ({ ...prev, categoryInput: "Sessão expirada. Refaça login." }));
      return;
    }

    setEditStatus("loading");
    try {
      const numeric = Number(editForm.amount.replace(",", "."));
      const payload = {
        amount: numeric.toFixed(2),
        currency: editForm.currency.trim().toUpperCase() || "BRL",
        description: editForm.description.trim(),
        transaction_date: editForm.date,
        category_id: category.id,
      };

      const response = await fetch(`${API_BASE_URL}/expenses/${editing.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const detail = (await response.json().catch(() => ({}))) as { detail?: unknown };
        const message =
          typeof detail?.detail === "string"
            ? detail.detail
            : response.status === 401
              ? "Sessão expirada. Entre novamente."
              : "Não foi possível atualizar. Tente de novo.";
        throw new Error(message);
      }

      const updated = (await response.json()) as Expense;
      setList((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditing(null);
      setEditForm(null);
      setEditStatus("idle");
      fetchList(page).catch(() => setListStatus("error"));
    } catch (error) {
      setEditStatus("error");
      setListMessage(error instanceof Error ? error.message : "Erro ao salvar alteração.");
    }
  };

  const handleDelete = async (expense: Expense) => {
    const auth = token();
    if (!auth) {
      setListMessage("Sessão expirada. Refaça login para excluir.");
      return;
    }
    setPendingDeleteId(expense.id);
    try {
      const response = await fetch(`${API_BASE_URL}/expenses/${expense.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth}` },
      });
      if (!response.ok && response.status !== 204) {
        throw new Error("Não foi possível excluir agora.");
      }
      const nextTotal = Math.max(0, total - 1);
      setList((prev) => prev.filter((item) => item.id !== expense.id));
      setTotal(nextTotal);
      setPendingDeleteId(null);
      const maxPage = Math.max(1, Math.ceil(nextTotal / PAGE_SIZE));
      if (page > maxPage) {
        setPage(maxPage);
      } else {
        fetchList(page).catch(() => setListStatus("error"));
      }
    } catch (error) {
      setListMessage(error instanceof Error ? error.message : "Erro ao excluir.");
      setPendingDeleteId(null);
    }
  };

  const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const listEmpty = listStatus === "loaded" && total === 0;
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(total, page * PAGE_SIZE);

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > maxPage || listStatus === "loading") return;
    setPage(nextPage);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/70">Despesas</p>
          <h1 className="text-2xl font-bold text-white">Formulário rápido</h1>
          <p className="text-sm text-slate-300">Valor, data, categoria e nota — Enter já salva.</p>
        </div>
        <div className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
          Atalho: Enter envia
        </div>
      </div>

      <form
        className="space-y-4 rounded-3xl border border-slate-800/80 bg-slate-900/80 p-6 shadow-xl shadow-emerald-500/10"
        onSubmit={handleSubmit}
      >
        <div className="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-semibold text-white" htmlFor="amount">
              <span className="flex items-center justify-between">
                Valor <span className="text-xs font-normal text-slate-400">Rápido: 120,50</span>
              </span>
              <input
                className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white outline-none transition focus:-translate-y-0.5 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                data-testid="expense-amount"
                id="amount"
                inputMode="decimal"
                maxLength={12}
                placeholder="0,00"
                value={form.amount}
                onChange={(event) => updateField("amount", event.target.value)}
                onBlur={() => setErrors((prev) => ({ ...prev, ...validate(form) }))}
              />
              {errors.amount && <p className="mt-1 text-xs text-rose-300">{errors.amount}</p>}
            </label>

            <label className="text-sm font-semibold text-white" htmlFor="date">
              <span className="flex items-center justify-between">
                Data <span className="text-xs font-normal text-slate-400">Default: hoje</span>
              </span>
              <input
                className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white outline-none transition focus:-translate-y-0.5 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                data-testid="expense-date"
                id="date"
                type="date"
                value={form.date}
                onChange={(event) => updateField("date", event.target.value)}
                onBlur={() => setErrors((prev) => ({ ...prev, ...validate(form) }))}
              />
            {errors.date && <p className="mt-1 text-xs text-rose-300">{errors.date}</p>}
          </label>

            <label className="text-sm font-semibold text-white" htmlFor="category">
              <span className="flex items-center justify-between">
                Categoria <span className="text-xs font-normal text-slate-400">Autocomplete</span>
              </span>
              <input
                className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white outline-none transition focus:-translate-y-0.5 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                data-testid="expense-category"
                id="category"
                list="expense-categories"
                placeholder="Ex: Alimentação"
                value={form.categoryInput}
                onChange={(event) => updateField("categoryInput", event.target.value)}
                onBlur={() => setErrors((prev) => ({ ...prev, ...validate(form) }))}
              />
              <datalist id="expense-categories">
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.label}>
                    {category.label}
                  </option>
                ))}
              </datalist>
              {errors.categoryInput && <p className="mt-1 text-xs text-rose-300">{errors.categoryInput}</p>}
            </label>
          </div>

          <div>
            <label className="text-sm font-semibold text-white" htmlFor="description">
              <span className="flex items-center justify-between">
                Descrição <span className="text-xs font-normal text-slate-400 whitespace-nowrap">Opcional curta</span>
              </span>
              <input
                className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white outline-none transition focus:-translate-y-0.5 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                data-testid="expense-description"
                id="description"
                maxLength={80}
                placeholder="Ex: Mercado da semana"
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                onBlur={() => setErrors((prev) => ({ ...prev, ...validate(form) }))}
              />
              {errors.description && <p className="mt-1 text-xs text-rose-300">{errors.description}</p>}
            </label>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 shadow-inner shadow-emerald-500/5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/70">Sugestões</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {categoryOptions.map((category) => (
                <button
                  key={category.id}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    matchedCategory?.id === category.id
                      ? "border-emerald-400/70 bg-emerald-400/10 text-emerald-100 shadow shadow-emerald-500/10"
                      : "border-slate-700 bg-slate-900/70 text-slate-200 hover:border-emerald-300/60"
                  }`}
                  onClick={(event) => {
                    event.preventDefault();
                    updateField("categoryInput", category.label);
                  }}
                  type="button"
                >
                  <span className="mr-1">{category.icon}</span>
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 sm:max-w-sm">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-200 shadow-inner shadow-emerald-500/5">
            <p className="font-semibold text-white">Atalho: Enter envia</p>
            <p className="text-xs text-slate-400">Shift + Tab + Enter também envia.</p>
          </div>
          <button
            className="flex items-center justify-center gap-2 rounded-lg border border-emerald-400/60 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-50 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-70"
            data-testid="expense-submit"
            type="submit"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Salvando..." : "Salvar (Enter)"}
          </button>
          {serverMessage && (
            <div
              className={`rounded-lg border px-3 py-2 text-xs ${
                status === "success"
                  ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-50"
                  : "border-amber-400/60 bg-amber-500/10 text-amber-50"
              }`}
              data-testid="expense-feedback"
              role="status"
            >
              {serverMessage}
            </div>
          )}
        </div>
      </form>

      <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-emerald-500/10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/70">Lista</p>
            <h2 className="text-xl font-semibold text-white">Edição inline e exclusão</h2>
            <p className="text-sm text-slate-300">Clique em editar para abrir o drawer e salvar rápido.</p>
          </div>
          <div className="flex flex-col items-end gap-2 text-xs text-slate-300 md:flex-row md:items-center">
            <div data-testid="pagination-info" className="text-right md:text-left">
              {total > 0 ? `Mostrando ${rangeStart}-${rangeEnd} de ${total}` : "Nenhuma despesa carregada"}
              <span className="ml-2 text-slate-500">| Página {page} de {maxPage}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] font-semibold text-slate-200 transition hover:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                data-testid="pagination-prev"
                disabled={page === 1 || listStatus === "loading"}
                onClick={() => goToPage(page - 1)}
                type="button"
              >
                Anterior
              </button>
              <button
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] font-semibold text-slate-200 transition hover:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                data-testid="pagination-next"
                disabled={page >= maxPage || listStatus === "loading"}
                onClick={() => goToPage(page + 1)}
                type="button"
              >
                Próxima
              </button>
            </div>
            {listStatus === "loading" && <span className="text-[11px] text-slate-400">Carregando...</span>}
          </div>
        </div>

        {listMessage && (
          <div className="rounded-lg border border-amber-400/60 bg-amber-500/10 px-3 py-2 text-xs text-amber-50">
            {listMessage}
          </div>
        )}

        {listEmpty && (
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-6 text-sm text-slate-200">
            Nenhuma despesa ainda. Use o formulário acima ou importe via CSV em breve.
          </div>
        )}

        {listStatus === "loading" && (
          <div className="space-y-2" data-testid="expenses-skeleton">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="flex animate-pulse items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3"
              >
                <div className="space-y-2">
                  <div className="h-4 w-40 rounded bg-slate-800" />
                  <div className="h-3 w-56 rounded bg-slate-800" />
                </div>
                <div className="h-8 w-28 rounded bg-slate-800" />
              </div>
            ))}
          </div>
        )}

        {listStatus === "loaded" && list.length > 0 && (
          <div className="space-y-2">
            {list.map((expense) => {
              const categoryLabel = categoryOptions.find((category) => category.id === expense.category_id)?.label;
              return (
                <div
                  key={expense.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-200"
                  data-testid={`expense-row-${expense.id}`}
                >
                  <div>
                    <p className="text-base font-semibold text-white">{expense.description}</p>
                    <p className="text-xs text-slate-400">
                      {formatCurrency(expense.amount, expense.currency)} •{" "}
                      {new Date(expense.transaction_date).toLocaleDateString("pt-BR")}{" "}
                      {categoryLabel ? `• ${categoryLabel}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-lg border border-emerald-400/60 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-50 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/20"
                      data-testid={`expense-edit-${expense.id}`}
                      onClick={() => handleEditOpen(expense)}
                      type="button"
                    >
                      Editar
                    </button>
                    {pendingDeleteId === expense.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          className="rounded-lg border border-rose-400/60 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-50 transition"
                          onClick={() => handleDelete(expense)}
                          type="button"
                        >
                          Confirmar
                        </button>
                        <button
                          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-slate-500"
                          onClick={() => setPendingDeleteId(null)}
                          type="button"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        className="rounded-lg border border-rose-400/60 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-50 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rose-500/20"
                        data-testid={`expense-delete-${expense.id}`}
                        onClick={() => setPendingDeleteId(expense.id)}
                        type="button"
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editing && editForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 backdrop-blur">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl shadow-emerald-500/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/70">Editar</p>
                <h3 className="text-xl font-semibold text-white">Atualize a despesa</h3>
              </div>
              <button
                className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-200 transition hover:border-emerald-400"
                onClick={() => {
                  setEditing(null);
                  setEditForm(null);
                }}
                type="button"
              >
                Fechar
              </button>
            </div>

            <form className="mt-4 grid gap-4 md:grid-cols-3" onSubmit={handleEditSubmit}>
              <div>
                <label className="text-sm font-semibold text-white" htmlFor="edit-amount">
                  Valor
                </label>
                <input
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                  data-testid="edit-amount"
                  id="edit-amount"
                  inputMode="decimal"
                  value={editForm.amount}
                  onChange={(event) =>
                    setEditForm((prev) => (prev ? { ...prev, amount: event.target.value } : prev))
                  }
                  onBlur={() => setEditErrors((prev) => ({ ...prev, ...validate(editForm) }))}
                />
                {editErrors.amount && <p className="mt-1 text-xs text-rose-300">{editErrors.amount}</p>}
              </div>

              <div>
                <label className="text-sm font-semibold text-white" htmlFor="edit-date">
                  Data
                </label>
                <input
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                  data-testid="edit-date"
                  id="edit-date"
                  type="date"
                  value={editForm.date}
                  onChange={(event) =>
                    setEditForm((prev) => (prev ? { ...prev, date: event.target.value } : prev))
                  }
                  onBlur={() => setEditErrors((prev) => ({ ...prev, ...validate(editForm) }))}
                />
                {editErrors.date && <p className="mt-1 text-xs text-rose-300">{editErrors.date}</p>}
              </div>

              <div>
                <label className="text-sm font-semibold text-white" htmlFor="edit-category">
                  Categoria
                </label>
                <input
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                  data-testid="edit-category"
                  id="edit-category"
                  list="expense-categories"
                  value={editForm.categoryInput}
                  onChange={(event) =>
                    setEditForm((prev) => (prev ? { ...prev, categoryInput: event.target.value } : prev))
                  }
                  onBlur={() => setEditErrors((prev) => ({ ...prev, ...validate(editForm) }))}
                />
                {editErrors.categoryInput && (
                  <p className="mt-1 text-xs text-rose-300">{editErrors.categoryInput}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {categoryOptions.slice(0, 4).map((category) => (
                    <button
                      key={category.id}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        matchedEditCategory?.id === category.id
                          ? "border-emerald-400/70 bg-emerald-400/10 text-emerald-100"
                          : "border-slate-700 bg-slate-900/70 text-slate-200 hover:border-emerald-300/60"
                      }`}
                      onClick={(event) => {
                        event.preventDefault();
                        setEditForm((prev) => (prev ? { ...prev, categoryInput: category.label } : prev));
                      }}
                      type="button"
                    >
                      <span className="mr-1">{category.icon}</span>
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-white" htmlFor="edit-description">
                  Descrição
                </label>
                <input
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                  data-testid="edit-description"
                  id="edit-description"
                  maxLength={80}
                  value={editForm.description}
                  onChange={(event) =>
                    setEditForm((prev) => (prev ? { ...prev, description: event.target.value } : prev))
                  }
                  onBlur={() => setEditErrors((prev) => ({ ...prev, ...validate(editForm) }))}
                />
                {editErrors.description && <p className="mt-1 text-xs text-rose-300">{editErrors.description}</p>}
              </div>

              <div className="flex items-center gap-3">
                <button
                  className="rounded-lg border border-emerald-400/60 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-50 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                  data-testid="edit-submit"
                  type="submit"
                  disabled={editStatus === "loading"}
                >
                  {editStatus === "loading" ? "Salvando..." : "Salvar edição"}
                </button>
                <button
                  className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-rose-400"
                  onClick={() => {
                    setEditing(null);
                    setEditForm(null);
                  }}
                  type="button"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
