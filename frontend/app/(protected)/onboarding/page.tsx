"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "spendario.onboarding";
const defaultCategories = [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Assinaturas",
  "Saúde",
  "Lazer",
  "Educação",
  "Mercado",
  "Outros",
];

type OnboardingStatus = "in_progress" | "completed" | "skipped";
type PersistedOnboarding = {
  step: number;
  country: string;
  currency: string;
  categories: string[];
  status: OnboardingStatus;
  updatedAt: string;
};

const loadPersisted = (): PersistedOnboarding | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedOnboarding;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
};

export default function OnboardingPage() {
  const router = useRouter();

  const [country, setCountry] = useState("Brasil");
  const [currency, setCurrency] = useState("BRL - Real brasileiro");
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<OnboardingStatus>("in_progress");
  const [hydrated, setHydrated] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const persisted = loadPersisted();
    if (persisted) {
      setCountry(persisted.country || "Brasil");
      setCurrency(persisted.currency || "BRL - Real brasileiro");
      setCategories(persisted.categories?.length ? persisted.categories : defaultCategories);
      setStep(persisted.step || 1);
      setStatus(persisted.status || "in_progress");
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    const payload: PersistedOnboarding = {
      step,
      country,
      currency,
      categories,
      status,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [categories, country, currency, hydrated, status, step]);

  const stepCopy = useMemo(
    () => [
      {
        title: "País e moeda",
        description: "Escolha o país e a moeda padrão para relatórios e lançamento.",
      },
      {
        title: "Categorias favoritas",
        description: "Confirme as categorias iniciais para acelerar o autocomplete.",
      },
    ],
    [],
  );

  const toggleCategory = (label: string) => {
    setCategories((prev) => {
      if (prev.includes(label)) {
        return prev.filter((item) => item !== label);
      }
      return [...prev, label];
    });
  };

  const handleNext = () => {
    setStep(2);
    setStatus("in_progress");
  };

  const handleBack = () => setStep(1);

  const handleSaveForLater = () => {
    setStatus("in_progress");
    setMessage("Progresso salvo. Você pode continuar depois.");
    setTimeout(() => router.push("/dashboard"), 400);
  };

  const handleSkip = () => {
    setStatus("skipped");
    setMessage("Onboarding pulado. Você pode voltar a qualquer momento.");
    setTimeout(() => router.push("/dashboard"), 400);
  };

  const handleFinish = () => {
    setStatus("completed");
    setMessage("Onboarding concluído! Redirecionando para o painel...");
    setTimeout(() => router.push("/dashboard"), 600);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/70">Onboarding</p>
          <h1 className="text-3xl font-bold text-white">Configuração inicial</h1>
          <p className="max-w-2xl text-sm text-slate-300">
            Wizard em 2 etapas. Salvamos o progresso localmente para você continuar depois. Você pode pular e concluir
            o onboarding quando quiser.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-semibold text-slate-200 transition hover:border-emerald-400"
            onClick={handleSaveForLater}
            type="button"
          >
            Salvar e continuar depois
          </button>
          <button
            className="rounded-lg border border-rose-400/60 bg-rose-500/10 px-3 py-1.5 text-sm font-semibold text-rose-100 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rose-500/20"
            onClick={handleSkip}
            type="button"
          >
            Pular
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {stepCopy.map((item, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === step;
          const isDone = stepNumber < step || status === "completed";
          return (
            <div
              key={item.title}
              className={`rounded-xl border p-4 transition ${
                isActive
                  ? "border-emerald-400/60 bg-emerald-400/5 shadow-lg shadow-emerald-500/10"
                  : "border-slate-800 bg-slate-900/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                      isDone ? "bg-emerald-500/20 text-emerald-100" : "bg-slate-800 text-slate-200"
                    }`}
                  >
                    {stepNumber}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-xs text-slate-300">{item.description}</p>
                  </div>
                </div>
                {isDone && <span className="text-xs text-emerald-300">Salvo</span>}
              </div>
            </div>
          );
        })}
      </div>

      {message && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50" role="status">
          {message}
        </div>
      )}

      {step === 1 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-emerald-500/10">
          <h2 className="text-lg font-semibold text-white">Escolha país e moeda</h2>
          <p className="text-sm text-slate-300">Usaremos essas configurações como padrão para relatórios e lançamentos.</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-100">
              País
              <select
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 shadow-inner shadow-emerald-500/5 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                onChange={(event) => setCountry(event.target.value)}
                value={country}
              >
                <option value="Brasil">Brasil</option>
                <option value="Portugal">Portugal</option>
                <option value="Estados Unidos">Estados Unidos</option>
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-100">
              Moeda
              <select
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 shadow-inner shadow-emerald-500/5 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                onChange={(event) => setCurrency(event.target.value)}
                value={currency}
              >
                <option value="BRL - Real brasileiro">BRL - Real brasileiro</option>
                <option value="EUR - Euro">EUR - Euro</option>
                <option value="USD - Dólar americano">USD - Dólar americano</option>
              </select>
            </label>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              className="rounded-lg border border-emerald-500 bg-emerald-500/90 px-4 py-2.5 text-sm font-semibold text-emerald-950 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/20"
              onClick={handleNext}
              type="button"
            >
              Avançar
            </button>
            <p className="text-sm text-slate-300">
              Padrão atual: <span className="text-emerald-200">{country}</span> /{" "}
              <span className="text-emerald-200">{currency}</span>
            </p>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-emerald-500/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Categorias favoritas</h2>
              <p className="text-sm text-slate-300">Confirme ou desmarque o que você quer sugerir automaticamente.</p>
            </div>
            <div className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
              {categories.length} selecionadas
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
            Padrão atual: <span className="text-emerald-200">{country}</span> /{" "}
            <span className="text-emerald-200">{currency}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {defaultCategories.map((label) => (
              <label
                key={label}
                className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition ${
                  categories.includes(label)
                    ? "border-emerald-400/60 bg-emerald-400/10 text-white shadow-lg shadow-emerald-500/10"
                    : "border-slate-800 bg-slate-950/70 text-slate-200 hover:border-slate-700"
                }`}
              >
                <span>{label}</span>
                <input
                  aria-label={label}
                  checked={categories.includes(label)}
                  className="h-4 w-4 accent-emerald-400"
                  onChange={() => toggleCategory(label)}
                  type="checkbox"
                />
              </label>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-emerald-400 hover:text-white"
              onClick={handleBack}
              type="button"
            >
              Voltar
            </button>
            <button
              className="rounded-lg border border-emerald-500 bg-emerald-500/90 px-4 py-2.5 text-sm font-semibold text-emerald-950 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/20"
              onClick={handleFinish}
              type="button"
            >
              Concluir
            </button>
            <button
              className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-emerald-400 hover:text-white"
              onClick={handleSaveForLater}
              type="button"
            >
              Salvar e sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
