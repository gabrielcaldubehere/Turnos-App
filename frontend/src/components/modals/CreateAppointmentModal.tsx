import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { createAppointment } from "../../services/appointmentService";
import type { Appointment } from "../../types/appointment";
import Icon from "../ui/Icon";

type AppointmentFormData = {
  clientName: string;
  clientPhone: string;
  serviceName: string;
  date: string;
  time: string;
  notes: string;
};

type FormErrors = Partial<Record<keyof AppointmentFormData, string>>;

const emptyForm: AppointmentFormData = {
  clientName: "",
  clientPhone: "",
  serviceName: "",
  date: "",
  time: "",
  notes: "",
};

const requiredFields: { field: keyof AppointmentFormData; message: string }[] = [
  { field: "clientName", message: "Ingresá el nombre del cliente." },
  { field: "clientPhone", message: "Ingresá un teléfono de contacto." },
  { field: "serviceName", message: "Ingresá el servicio solicitado." },
  { field: "date", message: "Elegí la fecha del turno." },
  { field: "time", message: "Elegí la hora del turno." },
];

type CreateAppointmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAppointmentCreated: (appointment: Appointment) => void;
};

const inputClass = (hasError?: string): string =>
  `w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-sage-500/25 disabled:cursor-not-allowed disabled:bg-zinc-50 ${
    hasError
      ? "border-rose-300 focus:border-rose-400"
      : "border-zinc-200 focus:border-sage-500"
  }`;

function CreateAppointmentModal({
  isOpen,
  onClose,
  onAppointmentCreated,
}: CreateAppointmentModalProps) {
  const [formData, setFormData] = useState<AppointmentFormData>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (isSubmitting) return;

    setFormData(emptyForm);
    setErrors({});
    setSubmitError(null);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    const field = name as keyof AppointmentFormData;

    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    for (const { field, message } of requiredFields) {
      if (!formData[field].trim()) nextErrors[field] = message;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const created = await createAppointment({
        clientName: formData.clientName.trim(),
        clientPhone: formData.clientPhone.trim(),
        serviceName: formData.serviceName.trim(),
        date: formData.date,
        time: formData.time,
        notes: formData.notes.trim() || undefined,
        status: "pending",
        professionalName: "Por asignar",
        price: 0,
      });

      onAppointmentCreated(created);
      setFormData(emptyForm);
      setErrors({});
      setSubmitError(null);
    } catch {
      setSubmitError("No se pudo crear el turno. Intentá nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-appointment-title"
        className="surface max-h-[90vh] w-full max-w-lg overflow-y-auto"
      >
        <header className="flex items-start justify-between gap-4 border-b border-zinc-100 px-6 py-5">
          <div>
            <p className="eyebrow">Agenda</p>
            <h2
              id="create-appointment-title"
              className="mt-1 text-xl font-semibold text-zinc-900"
            >
              Nuevo turno
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Completá los datos para reservar el turno.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Cerrar"
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4 px-6 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="clientName"
                  className="mb-1.5 block text-xs font-medium text-zinc-700"
                >
                  Nombre del cliente
                </label>
                <input
                  id="clientName"
                  name="clientName"
                  type="text"
                  value={formData.clientName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder="Ej. María González"
                  aria-invalid={Boolean(errors.clientName)}
                  className={inputClass(errors.clientName)}
                />
                {errors.clientName && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.clientName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="clientPhone"
                  className="mb-1.5 block text-xs font-medium text-zinc-700"
                >
                  Teléfono
                </label>
                <input
                  id="clientPhone"
                  name="clientPhone"
                  type="tel"
                  value={formData.clientPhone}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder="Ej. +54 9 11 5555-0101"
                  aria-invalid={Boolean(errors.clientPhone)}
                  className={inputClass(errors.clientPhone)}
                />
                {errors.clientPhone && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.clientPhone}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="serviceName"
                className="mb-1.5 block text-xs font-medium text-zinc-700"
              >
                Servicio
              </label>
              <input
                id="serviceName"
                name="serviceName"
                type="text"
                value={formData.serviceName}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Ej. Limpieza facial"
                aria-invalid={Boolean(errors.serviceName)}
                className={inputClass(errors.serviceName)}
              />
              {errors.serviceName && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.serviceName}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="date"
                  className="mb-1.5 block text-xs font-medium text-zinc-700"
                >
                  Fecha
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.date)}
                  className={inputClass(errors.date)}
                />
                {errors.date && (
                  <p className="mt-1 text-xs text-rose-600">{errors.date}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="time"
                  className="mb-1.5 block text-xs font-medium text-zinc-700"
                >
                  Hora
                </label>
                <input
                  id="time"
                  name="time"
                  type="time"
                  value={formData.time}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.time)}
                  className={inputClass(errors.time)}
                />
                {errors.time && (
                  <p className="mt-1 text-xs text-rose-600">{errors.time}</p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="notes"
                className="mb-1.5 block text-xs font-medium text-zinc-700"
              >
                Notas <span className="font-normal text-zinc-400">(opcional)</span>
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Observaciones para el profesional..."
                className={`${inputClass()} resize-none`}
              />
            </div>
          </div>

          {submitError && (
            <p className="mx-6 mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {submitError}
            </p>
          )}

          <footer className="flex items-center justify-end gap-3 border-t border-zinc-100 bg-zinc-50/60 px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-sage-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sage-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent"
                  aria-hidden="true"
                />
              ) : (
                <Icon name="check" className="h-4 w-4" />
              )}
              {isSubmitting ? "Guardando..." : "Guardar turno"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default CreateAppointmentModal;
