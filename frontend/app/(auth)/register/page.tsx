import { AuthForm } from "../_components/auth-form";

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-md shadow-cyan-500/10">
    <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/70">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
  </div>
);

export default function RegisterPage() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr,1fr] lg:items-start">
      <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-emerald-500/10">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/70">Cadastro</p>
          <h1 className="text-3xl font-bold text-white">Crie sua conta no Spendario</h1>
          <p className="text-sm text-slate-300">
            Campos validados, senha mínima de 8 caracteres e nome opcional. Respostas 400 da API são exibidas de
            forma amigável para reduzir atrito no onboarding.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Tempo de envio" value="< 1s" />
          <Stat label="Feedbacks" value="400 / 201" />
          <Stat label="Campos" value="E-mail, senha, nome" />
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-sm text-slate-200">
          <p className="font-semibold text-white">Pronto para o onboarding</p>
          <p className="mt-1 text-slate-300">
            Ao criar, salvamos token e usuário no navegador. Isso já deixa pronto para conectar o wizard de
            categorias e proteger rotas com o bearer token.
          </p>
        </div>
      </div>

      <AuthForm mode="register" />
    </div>
  );
}
