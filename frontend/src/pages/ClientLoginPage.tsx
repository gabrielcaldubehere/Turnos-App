import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import useAuth from "../auth/useAuth";
import AuthShell from "../components/common/AuthShell";
import Icon from "../components/ui/Icon";
import { formatBusinessName } from "../utils/format";

function ClientLoginPage() {
  const { businessSlug = "negocio" } = useParams();
  const { user, signInClient } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const appointmentsPath = `/b/${businessSlug}/my-appointments`;

  if (user.role === "client") {
    return <Navigate to={appointmentsPath} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signInClient(email.trim());
      navigate(appointmentsPath, { replace: true });
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
      eyebrow="Área de clientes"
      title="Mis turnos"
      description={`Ingresá con el email que usaste al reservar en ${formatBusinessName(businessSlug)} para ver tus turnos.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="client-login-email"
            className="mb-1.5 block text-xs font-medium text-zinc-700"
          >
            Email
          </label>
          <input
            id="client-login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="Ej. maria@ejemplo.com"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-sage-500 focus:ring-2 focus:ring-sage-500/25"
            required
          />
          <p className="mt-1 text-xs text-zinc-400">
            Sin contraseña: usamos el email de tu reserva.
          </p>
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
            <Icon name="calendar" className="h-4 w-4" />
          )}
          {isSubmitting ? "Buscando turnos..." : "Ver mis turnos"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-zinc-500">
        ¿Todavía no reservaste?{" "}
        <Link
          to={`/b/${businessSlug}/booking`}
          className="font-semibold text-sage-700 underline decoration-sage-300 underline-offset-2 hover:text-sage-800"
        >
          Reservá un turno
        </Link>
      </p>
    </AuthShell>
  );
}

export default ClientLoginPage;
