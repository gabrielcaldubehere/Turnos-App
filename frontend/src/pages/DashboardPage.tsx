import { useEffect, useState } from "react";
import StatusBadge from "../components/common/StatusBadge";
import StatCard from "../components/dashboard/StatCard";
import Icon, { type IconName } from "../components/ui/Icon";
import {
  getAppointments,
  getDashboardStats,
} from "../services/appointmentService";
import type { Appointment, DashboardStats } from "../types/appointment";
import { formatCurrency, formatDate } from "../utils/format";

const getInitials = (name: string): string =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all([getDashboardStats(), getAppointments()])
      .then(([statsData, appointmentsData]) => {
        if (!active) return;
        setStats(statsData);
        setRecentAppointments(
          [...appointmentsData]
            .sort((a, b) =>
              `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`),
            )
            .slice(0, 4),
        );
      })
      .catch(() => {
        if (active) setError("No se pudo cargar el resumen del panel.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const metrics: {
    label: string;
    value: string | number;
    hint: string;
    icon: IconName;
  }[] = [
    {
      label: "Turnos de hoy",
      value: stats?.todayAppointments ?? "—",
      hint: "Agenda del día",
      icon: "calendar",
    },
    {
      label: "Confirmados",
      value: stats?.confirmedAppointments ?? "—",
      hint: "Listos para atender",
      icon: "check",
    },
    {
      label: "Pendientes",
      value: stats?.pendingAppointments ?? "—",
      hint: "Requieren confirmación",
      icon: "clock",
    },
    {
      label: "Ingresos estimados",
      value: stats ? formatCurrency(stats.estimatedRevenue) : "—",
      hint: "Confirmados y completados",
      icon: "wallet",
    },
  ];

  return (
    <section className="space-y-8">
      <header>
        <p className="eyebrow">Resumen general</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
          Bienvenido de nuevo
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Mirá cómo viene tu agenda y gestioná los turnos pendientes.
        </p>
      </header>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <StatCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            hint={metric.hint}
            icon={<Icon name={metric.icon} className="h-5 w-5" />}
          />
        ))}
      </div>

      <div className="surface overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-zinc-900">
              Últimos turnos
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              Reservas más recientes de tu agenda.
            </p>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
            {recentAppointments.length} turnos
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 px-5 py-10 text-sm text-zinc-500">
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-sage-500 border-t-transparent"
              aria-hidden="true"
            />
            Cargando resumen...
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {recentAppointments.map((appointment) => (
              <li
                key={appointment.id}
                className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-zinc-50/70 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-500/10 text-sm font-semibold text-sage-700">
                    {getInitials(appointment.clientName)}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      {appointment.clientName}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {appointment.serviceName} · {appointment.professionalName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:justify-end">
                  <span className="text-xs tabular-nums text-zinc-500">
                    {formatDate(appointment.date)} · {appointment.time}
                  </span>
                  <StatusBadge status={appointment.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default DashboardPage;
