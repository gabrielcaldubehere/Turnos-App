import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useAuth from "../auth/useAuth";
import StatusBadge from "../components/common/StatusBadge";
import Icon from "../components/ui/Icon";
import { getAppointmentsByEmail } from "../services/appointmentService";
import type { Appointment } from "../types/appointment";
import { formatCurrency, formatDate } from "../utils/format";

function ClientAppointmentsPage() {
  const { businessSlug = "negocio" } = useParams();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const email = user.email ?? "";
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(Boolean(email));
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = useCallback(() => {
    if (!email) return;

    let active = true;

    getAppointmentsByEmail(email)
      .then((data) => {
        if (active) {
          setAppointments(
            [...data].sort((a, b) =>
              `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`),
            ),
          );
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(
            caught instanceof Error
              ? caught.message
              : "No se pudieron cargar tus turnos.",
          );
          setAppointments([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [email]);

  useEffect(() => loadAppointments(), [loadAppointments]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    loadAppointments();
  };

  const handleSignOut = () => {
    signOut();
    navigate(`/b/${businessSlug}/booking`, { replace: true });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Área de clientes</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            Mis turnos
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Reservas asociadas a{" "}
            <span className="font-medium text-zinc-700">{email}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50"
        >
          Cerrar sesión
        </button>
      </header>

      {loading ? (
        <div className="surface flex items-center justify-center gap-3 px-6 py-12 text-sm text-zinc-500">
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-sage-500 border-t-transparent"
            aria-hidden="true"
          />
          Buscando tus turnos...
        </div>
      ) : error ? (
        <div className="surface border-rose-200 px-6 py-8 text-center">
          <p className="text-sm font-medium text-rose-700">{error}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-4 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            Reintentar
          </button>
        </div>
      ) : appointments.length === 0 ? (
        <div className="surface flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-50 text-sage-600">
            <Icon name="calendar" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-zinc-900">
              Todavía no tenés turnos
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Reservá uno nuevo y aparecerá acá.
            </p>
          </div>
          <Link
            to={`/b/${businessSlug}/booking`}
            className="mt-1 rounded-lg bg-sage-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-sage-700"
          >
            Reservar turno
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <article
              key={appointment.id}
              className="surface-interactive flex flex-wrap items-start justify-between gap-4 p-5"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold tabular-nums text-zinc-900">
                    {formatDate(appointment.date)} · {appointment.time}
                  </p>
                  <StatusBadge status={appointment.status} />
                </div>
                <p className="mt-1.5 text-sm text-zinc-700">
                  {appointment.serviceName}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {appointment.totalDurationMinutes} min ·{" "}
                  {appointment.professionalName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums text-sage-700">
                  {formatCurrency(appointment.totalPrice)}
                </p>
                <p className="mt-1 text-xs text-zinc-400">Reserva confirmada</p>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-zinc-400">
        ¿Necesitás otro turno?{" "}
        <Link
          to={`/b/${businessSlug}/booking`}
          className="font-semibold text-sage-700 underline decoration-sage-300 underline-offset-2"
        >
          Reservá acá
        </Link>
      </p>
    </div>
  );
}

export default ClientAppointmentsPage;
