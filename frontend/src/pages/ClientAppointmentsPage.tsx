import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import useAuth from "../auth/useAuth";
import StatusBadge from "../components/common/StatusBadge";
import Icon from "../components/ui/Icon";
import { getClientAppointments } from "../services/appointmentService";
import type { Appointment } from "../types/appointment";
import { formatCurrency, formatDate } from "../utils/format";
import { normalizeUsername } from "../utils/username";

function ClientAppointmentsPage() {
  const { username } = useParams();
  const { user } = useAuth();
  const panelUsername = normalizeUsername(username ?? "");
  const token = user.token;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState<string | null>(null);

  const displayedError =
    error ?? (token ? null : "Ingresá nuevamente para ver tus turnos.");

  const loadAppointments = useCallback(() => {
    if (!token) return;

    let active = true;

    getClientAppointments(panelUsername, token)
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
  }, [panelUsername, token]);

  useEffect(() => loadAppointments(), [loadAppointments]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    loadAppointments();
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Área de clientes</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            Mis turnos
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Usuario:{" "}
            <span className="font-medium text-zinc-700">{panelUsername}</span>
          </p>
        </div>
        <Link
          to={`/client/${panelUsername}/new`}
          className="inline-flex items-center gap-2 rounded-lg bg-sage-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sage-700"
        >
          <Icon name="plus" className="h-4 w-4" />
          Nuevo Turno
        </Link>
      </header>

      {loading ? (
        <div className="surface flex items-center justify-center gap-3 px-6 py-12 text-sm text-zinc-500">
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-sage-500 border-t-transparent"
            aria-hidden="true"
          />
          Buscando tus turnos...
        </div>
      ) : displayedError ? (
        <div className="surface border-rose-200 px-6 py-8 text-center">
          <p className="text-sm font-medium text-rose-700">{displayedError}</p>
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
            to={`/client/${panelUsername}/new`}
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
              className="surface-interactive flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:p-5"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold tabular-nums text-zinc-900">
                    {formatDate(appointment.date)} · {appointment.time}
                  </p>
                  <StatusBadge status={appointment.status} />
                </div>
                <p className="mt-1.5 break-words text-sm text-zinc-700">
                  {appointment.serviceName}
                </p>
                <p className="mt-1 break-words text-xs text-zinc-500">
                  {appointment.totalDurationMinutes} min ·{" "}
                  {appointment.professionalName}
                </p>
              </div>
              <div className="shrink-0 text-left sm:text-right">
                <p className="text-sm font-semibold tabular-nums text-sage-700">
                  {formatCurrency(appointment.totalPrice)}
                </p>
                <p className="mt-1 break-all text-xs text-zinc-400">
                  Código: {appointment.id}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Una vez reservado el turno, debés esperar la confirmación o una posible
        modificación del mismo por parte del negocio.
      </p>
    </div>
  );
}

export default ClientAppointmentsPage;
