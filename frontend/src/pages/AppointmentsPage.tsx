import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import StatusBadge from "../components/common/StatusBadge";
import CreateAppointmentModal from "../components/modals/CreateAppointmentModal";
import Icon, { type IconName } from "../components/ui/Icon";
import {
  getAppointments,
  updateAppointmentStatus,
} from "../services/appointmentService";
import type { Appointment, AppointmentStatus } from "../types/appointment";
import { formatCurrency, formatDate } from "../utils/format";

type StatusFilter = AppointmentStatus | "all";

type QuickAction = {
  label: string;
  status: AppointmentStatus;
  icon: IconName;
  className: string;
};

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendientes" },
  { value: "confirmed", label: "Confirmados" },
  { value: "completed", label: "Completados" },
  { value: "cancelled", label: "Cancelados" },
];

const quickActions: Record<AppointmentStatus, QuickAction[]> = {
  pending: [
    {
      label: "Confirmar",
      status: "confirmed",
      icon: "check",
      className: "bg-sage-500/10 text-sage-700 hover:bg-sage-500/20",
    },
    {
      label: "Cancelar",
      status: "cancelled",
      icon: "close",
      className: "bg-rose-50 text-rose-700 hover:bg-rose-100",
    },
  ],
  confirmed: [
    {
      label: "Completar",
      status: "completed",
      icon: "check",
      className: "bg-sky-50 text-sky-700 hover:bg-sky-100",
    },
    {
      label: "Cancelar",
      status: "cancelled",
      icon: "close",
      className: "bg-rose-50 text-rose-700 hover:bg-rose-100",
    },
  ],
  completed: [],
  cancelled: [
    {
      label: "Reactivar",
      status: "pending",
      icon: "clock",
      className: "bg-zinc-100 text-zinc-700 hover:bg-zinc-200",
    },
  ],
};

function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [justUpdatedId, setJustUpdatedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;

    getAppointments()
      .then((data) => {
        if (active) setAppointments(data);
      })
      .catch(() => {
        if (active) setError("No se pudieron cargar los turnos.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(
    () => () => {
      if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    },
    [],
  );

  const filteredAppointments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const matchesSearch =
        !query ||
        appointment.clientName.toLowerCase().includes(query) ||
        appointment.clientPhone.includes(query) ||
        (appointment.email?.toLowerCase().includes(query) ?? false) ||
        appointment.serviceName.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" || appointment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [appointments, searchTerm, statusFilter]);

  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setStatusFilter("all");
  }, []);

  const handleAppointmentCreated = (created: Appointment) => {
    setAppointments((current) => [...current, created]);
    setError(null);
    clearFilters();
    closeModal();
  };

  const handleStatusChange = async (
    id: string,
    status: AppointmentStatus,
  ) => {
    setUpdatingId(id);
    setError(null);

    try {
      const updated = await updateAppointmentStatus(id, status);
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === updated.id ? updated : appointment,
        ),
      );

      if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
      setJustUpdatedId(id);
      feedbackTimeout.current = setTimeout(() => setJustUpdatedId(null), 1400);
    } catch {
      setError("No se pudo actualizar el turno.");
    } finally {
      setUpdatingId(null);
    }
  };

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
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-card">
            <Icon name="calendar" className="h-4 w-4 text-sage-700" />
            {appointments.length} turnos
          </span>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-sage-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sage-700"
          >
            <Icon name="plus" className="h-4 w-4" />
            Nuevo Turno
          </button>
        </div>
      </header>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="surface flex items-center justify-center gap-3 px-5 py-12 text-sm text-zinc-500">
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-sage-500 border-t-transparent"
            aria-hidden="true"
          />
          Cargando turnos...
        </div>
      ) : (
        <>
          <div className="surface flex flex-col gap-4 p-4">
            <div className="relative">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por cliente o servicio..."
                aria-label="Buscar turnos por cliente o servicio"
                className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-sage-500 focus:ring-2 focus:ring-sage-500/25"
              />
            </div>

            <div
              className="flex flex-wrap gap-2"
              role="tablist"
              aria-label="Filtrar turnos por estado"
            >
              {statusFilters.map(({ value, label }) => {
                const isActive = statusFilter === value;
                const count =
                  value === "all"
                    ? appointments.length
                    : appointments.filter((item) => item.status === value)
                        .length;

                return (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setStatusFilter(value)}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-sage-600 text-white shadow-sm"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {label}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-white text-zinc-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="surface overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/70 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Horario</th>
                  <th scope="col" className="px-5 py-3 font-medium">Fecha</th>
                  <th scope="col" className="px-5 py-3 font-medium">Cliente</th>
                  <th scope="col" className="px-5 py-3 font-medium">Email</th>
                  <th scope="col" className="px-5 py-3 font-medium">Edad</th>
                  <th scope="col" className="px-5 py-3 font-medium">Profesional</th>
                  <th scope="col" className="px-5 py-3 font-medium">Servicio</th>
                  <th scope="col" className="px-5 py-3 font-medium">Precio</th>
                  <th scope="col" className="px-5 py-3 font-medium">Estado</th>
                  <th scope="col" className="px-5 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-14 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                          <Icon name="search" className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-zinc-900">
                            No se encontraron turnos con los filtros
                            seleccionados
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            Probá con otro texto o cambiá el estado.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                        >
                          Limpiar filtros
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((appointment) => {
                    const actions = quickActions[appointment.status];
                    const isUpdating = updatingId === appointment.id;
                    const wasUpdated = justUpdatedId === appointment.id;

                    return (
                      <tr
                        key={appointment.id}
                        className="transition-colors hover:bg-zinc-50/70"
                      >
                        <td className="whitespace-nowrap px-5 py-4 font-medium tabular-nums text-zinc-900">
                          {appointment.time}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-zinc-500">
                          {formatDate(appointment.date)}
                        </td>
                        <td className="px-5 py-4">
                          <span className="block font-medium text-zinc-800">
                            {appointment.clientName}
                          </span>
                          <span className="mt-0.5 block text-xs tabular-nums text-zinc-400">
                            {appointment.clientPhone}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {appointment.email ? (
                            <a
                              href={`mailto:${appointment.email}`}
                              className="text-sage-700 underline decoration-sage-300 underline-offset-2 hover:text-sage-800"
                            >
                              {appointment.email}
                            </a>
                          ) : (
                            <span className="text-zinc-300">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 tabular-nums text-zinc-700">
                          {appointment.age ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-zinc-700">
                          {appointment.professionalName}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-zinc-700">
                          {appointment.serviceName}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 tabular-nums text-zinc-700">
                          {formatCurrency(appointment.price)}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={appointment.status} />
                        </td>
                        <td className="px-5 py-4">
                          {isUpdating ? (
                            <span className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500">
                              <span
                                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-sage-500 border-t-transparent"
                                aria-hidden="true"
                              />
                              Actualizando...
                            </span>
                          ) : wasUpdated ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sage-700">
                              <Icon name="check" className="h-3.5 w-3.5" />
                              Actualizado
                            </span>
                          ) : actions.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {actions.map((action) => (
                                <button
                                  key={action.status}
                                  type="button"
                                  onClick={() =>
                                    handleStatusChange(
                                      appointment.id,
                                      action.status,
                                    )
                                  }
                                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${action.className}`}
                                >
                                  <Icon
                                    name={action.icon}
                                    className="h-3.5 w-3.5"
                                  />
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <CreateAppointmentModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onAppointmentCreated={handleAppointmentCreated}
      />
    </section>
  );
}

export default AppointmentsPage;
