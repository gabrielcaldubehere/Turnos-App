import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import useAuth from "../auth/useAuth";
import AuthShell from "../components/common/AuthShell";
import Icon from "../components/ui/Icon";
import { normalizeUsername } from "../utils/username";

function MainPage() {
  const { user, signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user.role === "admin") return <Navigate to="/admin" replace />;
  if (user.role === "client" && user.username) {
    return <Navigate to={`/client/${user.username}`} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const session = await signIn(username.trim(), password);
      if (session.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate(`/client/${normalizeUsername(session.username ?? username)}`, {
          replace: true,
        });
      }
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
      eyebrow="Bienvenido"
      title="Ingresá a Turnos App"
      description="Accedé con tu usuario y contraseña para gestionar tus turnos, o reservá el primero si todavía no tenés cuenta."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="main-username"
            className="mb-1.5 block text-xs font-medium text-zinc-700"
          >
            Usuario
          </label>
          <input
            id="main-username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            placeholder="Ej. maria_gonzalez"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-sage-500 focus:ring-2 focus:ring-sage-500/25"
            required
          />
        </div>
        <div>
          <label
            htmlFor="main-password"
            className="mb-1.5 block text-xs font-medium text-zinc-700"
          >
            Contraseña
          </label>
          <input
            id="main-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="Tu contraseña"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-sage-500 focus:ring-2 focus:ring-sage-500/25"
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
            <Icon name="arrow-right" className="h-4 w-4" />
          )}
          {isSubmitting ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <div className="mt-4">
        <Link
          to="/main/new"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-sage-300 bg-white px-4 py-3 text-sm font-semibold text-sage-700 transition hover:bg-sage-50"
        >
          <Icon name="plus" className="h-4 w-4" />
          Nuevo Turno
        </Link>
      </div>

      <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-500">
        <p className="font-semibold text-zinc-700">Acceso de prueba</p>
        <p className="mt-1">
          Administrador:{" "}
          <code className="font-mono text-zinc-800">admin</code> /{" "}
          <code className="font-mono text-zinc-800">admin</code>
        </p>
      </div>

      {user.role !== "guest" && (
        <button
          type="button"
          onClick={signOut}
          className="mt-4 w-full text-center text-xs font-medium text-zinc-500 underline underline-offset-2 hover:text-zinc-800"
        >
          Cerrar sesión actual
        </button>
      )}
    </AuthShell>
  );
}

export default MainPage;
