"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type AuthMode = "login" | "register";

type UserPayload = {
  id: string;
  email: string;
  full_name?: string | null;
  created_at: string;
};

type TokenResponse = {
  access_token: string;
  token_type: string;
  user: UserPayload;
};

type FormState = {
  email: string;
  password: string;
  fullName: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const mapApiError = (detail: unknown, status: number) => {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const joined = detail.filter((item) => typeof item === "string").join(", ");
    if (joined) return joined;
  }
  if (status === 401) return "Credenciais incorretas. Revise e tente novamente.";
  if (status === 400) return "Dados inválidos. Corrija os campos destacados.";
  return "Não conseguimos completar a solicitação. Tente novamente em instantes.";
};

const persistSession = (data: TokenResponse) => {
  try {
    localStorage.setItem("spendario.token", data.access_token);
    localStorage.setItem("spendario.user", JSON.stringify(data.user));
  } catch (error) {
    console.warn("Não foi possível salvar a sessão localmente", error);
  }
};

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ email: "", password: "", fullName: "" });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const copy = useMemo(
    () =>
      mode === "login"
        ? {
            title: "Entrar no Spendario",
            subtitle: "Use seu e-mail e senha cadastrados para acessar o painel.",
            cta: "Entrar",
            switchHref: "/register",
            switchLabel: "Ainda não tem conta? Criar agora",
          }
        : {
            title: "Crie sua conta",
            subtitle: "Registre um novo usuário para começar a registrar despesas.",
            cta: "Criar conta",
            switchHref: "/login",
            switchLabel: "Já tem conta? Fazer login",
          },
    [mode],
  );

  const validate = (state: FormState) => {
    const validationErrors: Partial<FormState> = {};

    if (!emailRegex.test(state.email.trim())) {
      validationErrors.email = "Informe um e-mail válido.";
    }

    if (!state.password || state.password.length < 8) {
      validationErrors.password = "A senha precisa ter pelo menos 8 caracteres.";
    }

    if (mode === "register" && state.fullName.trim() && state.fullName.trim().length < 3) {
      validationErrors.fullName = "Use pelo menos 3 caracteres.";
    }

    return validationErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError("");
    setSuccessMessage("");

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const payload: Record<string, unknown> = {
        email: form.email.trim(),
        password: form.password,
      };

      if (mode === "register") {
        payload.full_name = form.fullName.trim() || null;
      }

      const response = await fetch(`${API_BASE_URL}/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response
        .json()
        .catch(() => ({ detail: "Resposta inesperada da API. Tente novamente." }));

      if (!response.ok) {
        const detail = (data as { detail?: unknown })?.detail;
        throw new Error(mapApiError(detail, response.status));
      }

      const parsed = data as TokenResponse;
      if (!parsed.access_token || !parsed.user) {
        throw new Error("Resposta de auth incompleta. Tente novamente.");
      }

      persistSession(parsed);
      setSuccessMessage(mode === "login" ? "Login realizado! Redirecionando..." : "Conta criada! Entrando...");

      setTimeout(() => {
        router.push("/");
      }, 600);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Falha ao enviar o formulário. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-emerald-500/10">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/70">Autenticação</p>
        <h1 className="text-2xl font-semibold text-white">{copy.title}</h1>
        <p className="text-sm text-slate-300">{copy.subtitle}</p>
      </div>

      {serverError && (
        <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100" role="alert">
          {serverError}
        </div>
      )}

      {successMessage && (
        <div className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50" role="status">
          {successMessage}
        </div>
      )}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-100" htmlFor="email">
            E-mail
          </label>
          <input
            autoComplete="email"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 shadow-inner shadow-emerald-500/5 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            disabled={loading}
            id="email"
            name="email"
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="seu@email.com"
            type="email"
            value={form.email}
          />
          {errors.email && <p className="text-sm text-rose-200">{errors.email}</p>}
        </div>

        {mode === "register" && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-100" htmlFor="fullName">
              Nome completo (opcional)
            </label>
            <input
              autoComplete="name"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 shadow-inner shadow-emerald-500/5 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              disabled={loading}
              id="fullName"
              name="fullName"
              onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
              placeholder="Como prefere ser chamado"
              type="text"
              value={form.fullName}
            />
            {errors.fullName && <p className="text-sm text-rose-200">{errors.fullName}</p>}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-100" htmlFor="password">
            Senha
          </label>
          <input
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 shadow-inner shadow-emerald-500/5 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            disabled={loading}
            id="password"
            minLength={8}
            name="password"
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            placeholder="Mínimo de 8 caracteres"
            type="password"
            value={form.password}
          />
          {errors.password && <p className="text-sm text-rose-200">{errors.password}</p>}
        </div>

        <button
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500 bg-emerald-500/90 px-4 py-2.5 text-sm font-semibold text-emerald-950 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? "Enviando..." : copy.cta}
        </button>

        <div className="text-center text-sm text-slate-300">
          <Link className="text-emerald-200 underline-offset-4 hover:text-emerald-100 hover:underline" href={copy.switchHref}>
            {copy.switchLabel}
          </Link>
        </div>
      </form>
    </div>
  );
}
