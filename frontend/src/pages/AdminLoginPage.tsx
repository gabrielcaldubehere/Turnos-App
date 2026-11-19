import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../auth/useAuth";
import AuthShell from "../components/common/AuthShell";
import Icon from "../components/ui/Icon";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-sage-500 focus:ring-2 focus:ring-sage-500/25";

function AdminLoginPage() {
  const { user, signInAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from =
    (location.state as { from?: string } | null)?.from ?? "/admin/dashboard";

  if (user.role === "admin") return <Navigate to={from} replace />;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signInAdmin(username.trim(), password);
      navigate(from, { replace: true });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudo iniciar sesión. Intentá nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Acceso administrativo"
      title="Ingresá al panel"
      description="Gestioná la agenda, los turnos y la operación de tu negocio desde un solo lugar."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="admin-username"
            className="mb-1.5 block text-xs font-medium text-zinc-700"
          >
            Usuario
          </label>
          <input
            id="admin-username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            placeholder="Ej. admin"
            className={inputClass}
            required
          />
        </div>
        <div>
          <label
            htmlFor="admin-password"
            className="mb-1.5 block text-xs font-medium text-zinc-700"
          >
            Contraseña
          </label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="Tu contraseña"
            className={inputClass}
            required
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-sage-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sage-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent"
              aria-hidden="true"
            />
          ) : (
            <Icon name="check" className="h-4 w-4" />
          )}
          {isSubmitting ? "Ingresando..." : "Ingresar al panel"}
        </button>
      </form>

      <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-500">
        <p className="font-semibold text-zinc-700">Acceso de prueba</p>
        <p className="mt-1">
          Usuario <code className="font-mono text-zinc-800">admin</code> ·
          Contraseña <code className="font-mono text-zinc-800">admin</code>
        </p>
      </div>

      <p className="mt-6 text-center text-xs text-zinc-500">
        ¿Sos cliente?{" "}
        <Link
          to="/b/turnos-ai/login"
          className="font-semibold text-sage-700 underline decoration-sage-300 underline-offset-2 hover:text-sage-800"
        >
          Ingresá con tu email
        </Link>
      </p>
    </AuthShell>
  );
}

export default AdminLoginPage;
