import { AuthForm } from "../_components/auth-form";

const Highlight = ({ title, description }: { title: string; description: string }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-md shadow-emerald-500/10">
    <p className="text-sm font-semibold text-white">{title}</p>
    <p className="mt-1 text-sm text-slate-300">{description}</p>
  </div>
);

export default function LoginPage() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr,1fr] lg:items-start">
      <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-cyan-500/10">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/70">Login</p>
          <h1 className="text-3xl font-bold text-white">Acesse sua conta</h1>
          <p className="text-sm text-slate-300">
            Validação inline, carregamento visível e feedback imediato para credenciais inválidas (401). Ideal
            para começar a testar navegação protegida.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Highlight title="Erro 401 claro" description="Mensagens em português sempre que as credenciais estiverem incorretas." />
          <Highlight title="Campo de e-mail" description="Validação de formato antes do submit evita round-trips desnecessários." />
          <Highlight title="Senha segura" description="Exigimos 8+ caracteres para alinhar com a API." />
          <Highlight title="Sessão salva" description="Token e usuário ficam no localStorage para uso em rotas protegidas." />
        </div>
      </div>

      <AuthForm mode="login" />
    </div>
  );
}
