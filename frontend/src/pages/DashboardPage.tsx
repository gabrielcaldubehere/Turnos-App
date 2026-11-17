import StatCard from "../components/dashboard/StatCard";
import Icon, { type IconName } from "../components/ui/Icon";

type AppointmentStatus = "pendiente" | "confirmado" | "cancelado";

type RecentAppointment = {
  id: number;
  client: string;
  service: string;
  professional: string;
  time: string;
  status: AppointmentStatus;
};

const metrics: { label: string; value: number; hint: string; icon: IconName }[] = [
  { label: "Turnos de hoy", value: 5, hint: "Agenda del día", icon: "calendar" },
  { label: "Clientes activos", value: 12, hint: "Este mes", icon: "users" },
  {
    label: "Turnos pendientes",
    value: 3,
    hint: "Requieren confirmación",
    icon: "clock",
  },
  {
    label: "Servicios disponibles",
    value: 8,
    hint: "Catálogo activo",
    icon: "sparkles",
  },
];

const recentAppointments: RecentAppointment[] = [
  {
    id: 1,
    client: "María González",
    service: "Limpieza facial",
    professional: "Ana Ruiz",
    time: "09:00",
    status: "confirmado",
  },
  {
    id: 2,
    client: "Carlos Rodríguez",
    service: "Corte y peinado",
    professional: "Lucía Torres",
    time: "11:30",
    status: "pendiente",
  },
  {
    id: 3,
    client: "Sofía Martínez",
    service: "Manicura",
    professional: "Ana Ruiz",
    time: "16:00",
    status: "cancelado",
  },
  {
    id: 4,
    client: "Lucía Fernández",
    service: "Masaje relajante",
    professional: "Lucía Torres",
    time: "18:15",
    status: "confirmado",
  },
];

const statusBadge: Record<AppointmentStatus, string> = {
  pendiente: "badge-pending",
  confirmado: "badge-confirmed",
  cancelado: "badge-cancelled",
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

function DashboardPage() {
  return (
    <section className="space-y-8">
      <header>
        <p className="eyebrow">Resumen general</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
          Buen día
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Gestioná tus turnos y mantené tu agenda organizada.
        </p>
      </header>

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
              Turnos recientes
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              Últimas solicitudes registradas en tu agenda.
            </p>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
            {recentAppointments.length} turnos
          </span>
        </div>

        <ul className="divide-y divide-zinc-100">
          {recentAppointments.map((appointment) => (
            <li
              key={appointment.id}
              className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-zinc-50/70 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-500/10 text-sm font-semibold text-sage-700">
                  {getInitials(appointment.client)}
                </span>
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    {appointment.client}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {appointment.service} · {appointment.professional}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:justify-end">
                <span className="text-sm tabular-nums text-zinc-600">
                  {appointment.time}
                </span>
                <span className={statusBadge[appointment.status]}>
                  {appointment.status.charAt(0).toUpperCase() +
                    appointment.status.slice(1)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default DashboardPage;
