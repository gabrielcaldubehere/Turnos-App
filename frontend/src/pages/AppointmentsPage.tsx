import Icon from "../components/ui/Icon";

type AppointmentStatus = "pendiente" | "confirmado" | "cancelado";

type Appointment = {
  id: number;
  time: string;
  client: string;
  professional: string;
  service: string;
  status: AppointmentStatus;
};

const appointments: Appointment[] = [
  {
    id: 1,
    time: "09:00",
    client: "María González",
    professional: "Ana Ruiz",
    service: "Limpieza facial",
    status: "confirmado",
  },
  {
    id: 2,
    time: "11:30",
    client: "Carlos Rodríguez",
    professional: "Lucía Torres",
    service: "Corte y peinado",
    status: "pendiente",
  },
  {
    id: 3,
    time: "16:00",
    client: "Sofía Martínez",
    professional: "Ana Ruiz",
    service: "Manicura",
    status: "cancelado",
  },
];

const statusBadge: Record<AppointmentStatus, string> = {
  pendiente: "badge-pending",
  confirmado: "badge-confirmed",
  cancelado: "badge-cancelled",
};

function AppointmentsPage() {
  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Gestión</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
            Turnos
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Consultá y organizá la agenda de tu negocio.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-card">
          <Icon name="calendar" className="h-4 w-4 text-sage-700" />
          {appointments.length} turnos
        </span>
      </header>

      <div className="surface overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50/70 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th scope="col" className="px-5 py-3 font-medium">Horario</th>
              <th scope="col" className="px-5 py-3 font-medium">Cliente</th>
              <th scope="col" className="px-5 py-3 font-medium">Profesional</th>
              <th scope="col" className="px-5 py-3 font-medium">Servicio</th>
              <th scope="col" className="px-5 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {appointments.map((appointment) => (
              <tr
                key={appointment.id}
                className="transition-colors hover:bg-zinc-50/70"
              >
                <td className="whitespace-nowrap px-5 py-4 font-medium tabular-nums text-zinc-900">
                  {appointment.time}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-zinc-700">
                  {appointment.client}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-zinc-700">
                  {appointment.professional}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-zinc-700">
                  {appointment.service}
                </td>
                <td className="px-5 py-4">
                  <span className={statusBadge[appointment.status]}>
                    {appointment.status.charAt(0).toUpperCase() +
                      appointment.status.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-zinc-400">
        Vista provisional: los datos se conectarán al backend en el siguiente sprint.
      </p>
    </section>
  );
}

export default AppointmentsPage;
