import { useEffect, useState, type FormEvent } from "react";
import Icon from "../ui/Icon";
import {
  getServices,
  getTodayDate,
  rescheduleAppointment,
} from "../../services/appointmentService";
import type { Appointment, ServiceOption } from "../../types/appointment";
import { formatCurrency } from "../../utils/format";

const TIME_SLOTS = Array.from({ length: 25 }, (_, index) => {
  const minutes = 8 * 60 + index * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
    minutes % 60,
  ).padStart(2, "0")}`;
});

type RescheduleAppointmentModalProps = {
  appointment: Appointment | null;
  onClose: () => void;
  onUpdated: (updated: Appointment) => void;
};

function RescheduleAppointmentModal({
  appointment,
  onClose,
  onUpdated,
}: RescheduleAppointmentModalProps) {
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [date, setDate] = useState(() => appointment?.date ?? getTodayDate());
  const [time, setTime] = useState(() => appointment?.time ?? "08:00");
  const [serviceIds, setServiceIds] = useState<string[]>(() =>
    appointment?.services.map((service) => service.id) ?? [],
  );
  const [loading, setLoading] = useState(() => Boolean(appointment));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appointment) return;
    let active = true;

    getServices()
      .then((data: ServiceOption[]) => {
        if (active) setServices(data);
      })
      .catch(() => {
        if (active) setError("No se pudieron cargar los servicios.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [appointment]);

  if (!appointment) return null;

  const selectedServices = services.filter((service) =>
    serviceIds.includes(service.id),
  );
  const totalDuration = selectedServices.reduce(
    (total, service) => total + service.durationMinutes,
    0,
  );
  const totalPrice = selectedServices.reduce(
    (total, service) => total + service.price,
    0,
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (serviceIds.length === 0) {
      setError("Elegí al menos un servicio.");
      return;
    }

    setSaving(true);
    try {
      const updated = await rescheduleAppointment(appointment.id, {
        date,
        time,
        serviceIds,
      });
      onUpdated(updated);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudo reprogramar el turno.",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleService = (serviceId: string) => {
    setServiceIds((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId],
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/60 p-3 sm:items-center sm:p-6">
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reschedule-title"
        className="surface max-h-[92vh] w-full max-w-lg space-y-5 overflow-y-auto p-5 sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Reprogramar</p>
            <h2 id="reschedule-title" className="mt-1 text-lg font-semibold text-zinc-900">
              Modificar turno
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              {appointment.clientName} · {appointment.professionalName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg border border-zinc-200 p-2 text-zinc-500 transition hover:bg-zinc-50"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-zinc-700">
            Fecha
            <input
              type="date"
              min={getTodayDate()}
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-500/25"
              required
            />
          </label>
          <label className="text-xs font-medium text-zinc-700">
            Horario
            <select
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-500/25"
            >
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <p className="text-xs font-medium text-zinc-700">Servicios</p>
          {loading ? (
            <p className="mt-2 text-sm text-zinc-500">Cargando servicios...</p>
          ) : (
            <div className="mt-2 space-y-2">
              {services.map((service) => {
                const isSelected = serviceIds.includes(service.id);
                return (
                  <label
                    key={service.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition ${
                      isSelected
                        ? "border-sage-500 bg-sage-50"
                        : "border-zinc-200 bg-white hover:bg-zinc-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleService(service.id)}
                      className="h-4 w-4 shrink-0 accent-sage-600"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-zinc-900">
                        {service.name}
                      </span>
                      <span className="block text-xs text-zinc-500">
                        {service.durationMinutes} min · {formatCurrency(service.price)}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-lg bg-sage-50 px-4 py-3 text-xs text-sage-700">
          Duración total: <span className="font-semibold">{totalDuration} min</span>
          {" · "}Precio total:{" "}
          <span className="font-semibold">{formatCurrency(totalPrice)}</span>
        </div>

        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-sage-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sage-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Icon name="calendar" className="h-4 w-4" />
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default RescheduleAppointmentModal;
