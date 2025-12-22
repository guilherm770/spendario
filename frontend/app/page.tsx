import Link from "next/link";

const Pill = ({ label }: { label: string }) => (
  <span className="rounded-full border border-emerald-400/40 bg-emerald-400/5 px-3 py-1 text-xs text-emerald-100">
    {label}
  </span>
);

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-lg shadow-emerald-500/10">
        <div className="grid gap-8 md:grid-cols-[1.2fr,0.9fr] md:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-300/80">Sprint 1</p>
            <h1 className="mt-3 text-3xl font-bold text-white">Autenticação pronta para testar</h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              Telas de login e registro com validação inline, feedback de erro e integração com a API de auth.
              O fluxo feliz e erros 400/401 são cobertos por testes E2E (Playwright).
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className="rounded-lg border border-emerald-500 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-white"
                href="/register"
              >
                Criar minha conta
              </Link>
              <Link
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-white"
                href="/login"
              >
                Já tenho acesso
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Pill label="Next.js 14" />
              <Pill label="Tailwind" />
              <Pill label="Auth FastAPI" />
              <Pill label="Playwright E2E" />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-cyan-500/10">
            <h2 className="text-lg font-semibold text-white">Como testar agora</h2>
            <ol className="mt-4 space-y-2 text-sm text-slate-200">
              <li>1) `make dev` sobe backend (8000) e frontend (3000).</li>
              <li>
                2) Opcional: defina `NEXT_PUBLIC_API_BASE_URL` se a API não estiver em{" "}
                <span className="text-emerald-300">http://localhost:8000</span>.
              </li>
              <li>3) Acesse /register ou /login e siga o fluxo.</li>
              <li>4) `npm run test:e2e` roda os cenários feliz e de erro (mockados).</li>
            </ol>
            <p className="mt-3 text-xs text-slate-400">Estrutura alinhada ao backlog da Sprint 1.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-emerald-500/5">
          <h3 className="text-lg font-semibold text-white">Fluxos implementados</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            <li>• Registro com senha mínima de 8 caracteres e nome opcional.</li>
            <li>• Login usando o mesmo endpoint da API.</li>
            <li>• Salvamos token + usuário em localStorage para próximos passos.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-cyan-500/5">
          <h3 className="text-lg font-semibold text-white">UX e feedbacks</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            <li>• Validação inline antes de enviar.</li>
            <li>• Estados de loading com botão desabilitado.</li>
            <li>• Erros 400/401 exibidos de forma clara.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-emerald-500/5">
          <h3 className="text-lg font-semibold text-white">Próximos passos</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            <li>• Proteger rotas internas com o token salvo.</li>
            <li>• Adicionar recuperação de senha.</li>
            <li>• Conectar onboarding de categorias após o login.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
