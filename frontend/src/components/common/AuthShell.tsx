import type { ReactNode } from "react";
import heroImage from "../../assets/hero.png";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="relative hidden overflow-hidden bg-sage-700 lg:flex lg:w-1/2 lg:flex-col lg:justify-between">
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-sage-700/95 via-sage-600/90 to-[#18181b]/95" />
        <div className="relative z-10 p-10">
          <Logo className="[&_span]:text-white" showText />
        </div>
        <div className="relative z-10 max-w-md p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
            Turnos App
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight text-white">
            Tu agenda, siempre bajo control.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/70">
            Organizá reservas, confirmá turnos y liberá tiempo para lo que
            realmente importa: tus clientes.
          </p>
        </div>
        <div className="relative z-10 flex gap-6 p-10 text-xs text-white/50">
          <span>Reservas online</span>
          <span>Panel administrativo</span>
          <span>Recordatorios</span>
        </div>
      </aside>

      <main className="relative flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <ThemeToggle compact />
        </div>
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            {description}
          </p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}

export default AuthShell;
