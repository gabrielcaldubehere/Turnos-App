import { useCallback, useEffect, useState } from "react";
import StatusBadge from "../components/common/StatusBadge";
import CreateAppointmentModal from "../components/modals/CreateAppointmentModal";
import Icon from "../components/ui/Icon";
import {
  getAppointments,
  updateAppointmentStatus,
} from "../services/appointmentService";
import type { Appointment } from "../types/appointment";
import { formatCurrency, formatDate } from "../utils/format";

function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const handleAppointmentCreated = (created: Appointment) => {
    setAppointments((current) => [...current, created]);
    setError(null);
    closeModal();
  };

  const handleConfirm = async (id: string) => {
    setUpdatingId(id);
    setError(null);
    try {
      const updated = await updateAppointmentStatus(id, "confirmed");
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === updated.id ? updated : appointment,
        ),
      );
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
        <div className="surface overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50/70 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">Horario</th>
                <th scope="col" className="px-5 py-3 font-medium">Fecha</th>
                <th scope="col" className="px-5 py-3 font-medium">Cliente</th>
                <th scope="col" className="px-5 py-3 font-medium">Profesional</th>
                <th scope="col" className="px-5 py-3 font-medium">Servicio</th>
                <th scope="col" className="px-5 py-3 font-medium">Precio</th>
                <th scope="col" className="px-5 py-3 font-medium">Estado</th>
                <th scope="col" className="px-5 py-3 font-medium">Acción</th>
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
                  <td className="whitespace-nowrap px-5 py-4 text-zinc-500">
                    {formatDate(appointment.date)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-zinc-700">
                    {appointment.clientName}
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
                    {appointment.status === "pending" ? (
                      <button
                        type="button"
                        onClick={() => handleConfirm(appointment.id)}
                        disabled={updatingId === appointment.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-sage-500/10 px-3 py-1.5 text-xs font-semibold text-sage-700 transition-colors hover:bg-sage-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Icon name="check" className="h-3.5 w-3.5" />
                        {updatingId === appointment.id
                          ? "Confirmando..."
                          : "Confirmar"}
                      </button>
                    ) : (
                      <span className="text-xs text-zinc-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
