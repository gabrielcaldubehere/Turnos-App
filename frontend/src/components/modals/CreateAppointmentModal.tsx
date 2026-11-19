import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  createAppointment,
  getServices,
  getSlotsForDate,
} from "../../services/appointmentService";
import type { Appointment, ServiceOption } from "../../types/appointment";
import { formatCurrency } from "../../utils/format";
import { TIME_SLOTS, type TimeSlot } from "../../utils/time";
import Icon from "../ui/Icon";

type AppointmentFormData = {
  clientName: string;
  clientPhone: string;
  email: string;
  age: string;
  date: string;
  time: string;
  notes: string;
};

type FormErrors = Partial<Record<keyof AppointmentFormData | "serviceIds", string>>;

const emptyForm: AppointmentFormData = {
  clientName: "",
  clientPhone: "",
  email: "",
  age: "",
  date: "",
  time: "",
  notes: "",
};

const requiredFields: { field: keyof AppointmentFormData; message: string }[] = [
  { field: "clientName", message: "Ingresá el nombre del cliente." },
  { field: "clientPhone", message: "Ingresá un teléfono de contacto." },
  { field: "email", message: "Ingresá el email del cliente." },
  { field: "age", message: "Ingresá la edad del cliente." },
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
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedServices = useMemo(
    () => services.filter((service) => selectedServiceIds.includes(service.id)),
    [services, selectedServiceIds],
  );

  const totalDurationMinutes = useMemo(
    () =>
      selectedServices.reduce(
        (total, service) => total + service.durationMinutes,
        0,
      ),
    [selectedServices],
  );

  const totalPrice = useMemo(
    () => selectedServices.reduce((total, service) => total + service.price, 0),
    [selectedServices],
  );

  const handleClose = useCallback(() => {
    if (isSubmitting) return;

    setFormData(emptyForm);
    setSelectedServiceIds([]);
    setSlots([]);
    setSlotsError(null);
    setErrors({});
    setServicesError(null);
    setSubmitError(null);
    onClose();
  }, [isSubmitting, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;

    getServices()
      .then((data) => {
        if (active) {
          setServices(data);
          setServicesError(null);
        }
      })
      .catch(() => {
        if (active) setServicesError("No se pudieron cargar los servicios.");
      })
      .finally(() => {
        if (active) setServicesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !formData.date) return;

    let active = true;

    getSlotsForDate(formData.date)
      .then((data) => {
        if (active) setSlots(data);
      })
      .catch(() => {
        if (active) setSlotsError("No se pudieron cargar los horarios.");
      })
      .finally(() => {
        if (active) setSlotsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, formData.date]);

  if (!isOpen) return null;

  const isLoadingServices = servicesLoading && services.length === 0;

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target;
    const field = name as keyof AppointmentFormData;

    if (field === "date") {
      setSlots([]);
      setSlotsLoading(true);
      setSlotsError(null);
      setFormData((current) => ({ ...current, date: value, time: "" }));
      setErrors((current) => ({ ...current, date: undefined, time: undefined }));
      return;
    }

    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId],
    );
    setErrors((current) => ({ ...current, serviceIds: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    for (const { field, message } of requiredFields) {
      if (!formData[field].trim()) nextErrors[field] = message;
    }
    if (
      formData.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    ) {
      nextErrors.email = "Ingresá un email válido.";
    }
    const parsedAge = Number(formData.age);
    if (
      formData.age.trim() &&
      (!Number.isInteger(parsedAge) || parsedAge < 1 || parsedAge > 120)
    ) {
      nextErrors.age = "Ingresá una edad válida (1 a 120 años).";
    }

    if (selectedServiceIds.length === 0) {
      nextErrors.serviceIds = "Seleccioná al menos un servicio.";
    }
    if (slots.find((slot) => slot.time === formData.time)?.occupied) {
      nextErrors.time = "Ese horario ya está ocupado. Elegí otro.";
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
        email: formData.email.trim(),
        age: parsedAge,
        professionalName: "Por asignar",
        serviceIds: selectedServiceIds,
        date: formData.date,
        time: formData.time,
        notes: formData.notes.trim() || undefined,
        status: "pending",
      });

      onAppointmentCreated(created);
      setFormData(emptyForm);
      setSelectedServiceIds([]);
      setErrors({});
      setSubmitError(null);
    } catch (caught) {
      setSubmitError(
        caught instanceof Error
          ? caught.message
          : "No se pudo crear el turno. Intentá nuevamente.",
      );
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

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs font-medium text-zinc-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder="Ej. maria@ejemplo.com"
                  aria-invalid={Boolean(errors.email)}
                  className={inputClass(errors.email)}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="age"
                  className="mb-1.5 block text-xs font-medium text-zinc-700"
                >
                  Edad
                </label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  min={1}
                  max={120}
                  value={formData.age}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder="Ej. 32"
                  aria-invalid={Boolean(errors.age)}
                  className={inputClass(errors.age)}
                />
                {errors.age && (
                  <p className="mt-1 text-xs text-rose-600">{errors.age}</p>
                )}
              </div>
            </div>

            <fieldset disabled={isSubmitting || isLoadingServices}>
              <legend className="mb-1.5 block text-xs font-medium text-zinc-700">
                Servicios{" "}
                <span className="font-normal text-zinc-400">
                  (podés elegir varios)
                </span>
              </legend>

              {isLoadingServices ? (
                <div className="mt-2 flex items-center gap-3 text-sm text-zinc-500">
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-sage-500 border-t-transparent"
                    aria-hidden="true"
                  />
                  Cargando servicios...
                </div>
              ) : servicesError ? (
                <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {servicesError}
                </p>
              ) : (
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {services.map((service) => {
                    const isSelected = selectedServiceIds.includes(service.id);

                    return (
                      <label
                        key={service.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                          isSelected
                            ? "border-sage-500 bg-sage-50/70 ring-2 ring-sage-500/20"
                            : "border-zinc-200 bg-white hover:border-sage-200 hover:bg-zinc-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleService(service.id)}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-sage-600"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className="text-sm font-semibold text-zinc-900">
                              {service.name}
                            </span>
                            <span className="text-sm font-semibold text-sage-700">
                              {formatCurrency(service.price)}
                            </span>
                          </span>
                          <span className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                            <Icon name="clock" className="h-3.5 w-3.5" />
                            {service.durationMinutes} min
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {errors.serviceIds && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.serviceIds}
                </p>
              )}

              {selectedServices.length > 0 && (
                <p className="mt-2 rounded-lg bg-sage-50 px-3 py-2 text-xs text-sage-700">
                  {selectedServices.length}{" "}
                  {selectedServices.length === 1 ? "servicio" : "servicios"} ·{" "}
                  {totalDurationMinutes} min ·{" "}
                  <span className="font-semibold tabular-nums">
                    {formatCurrency(totalPrice)}
                  </span>
                </p>
              )}
            </fieldset>

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
                <select
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  disabled={isSubmitting || slotsLoading}
                  aria-invalid={Boolean(errors.time)}
                  className={inputClass(errors.time)}
                >
                  <option value="">
                    {slotsLoading
                      ? "Buscando horarios..."
                      : "Seleccioná un horario"}
                  </option>
                  {TIME_SLOTS.map((time) => {
                    const occupied =
                      slots.find((slot) => slot.time === time)?.occupied ?? false;

                    return (
                      <option
                        key={time}
                        value={time}
                        disabled={occupied}
                        className={occupied ? "bg-zinc-100 text-zinc-400" : undefined}
                      >
                        {occupied ? `${time} · Ocupado` : time}
                      </option>
                    );
                  })}
                </select>
                {slotsError && (
                  <p className="mt-1 text-xs text-rose-600">{slotsError}</p>
                )}
                {errors.time && (
                  <p className="mt-1 text-xs text-rose-600">{errors.time}</p>
                )}
                {!slotsError && (
                  <p className="mt-1 text-xs text-zinc-400">
                    Los horarios en gris ya están ocupados.
                  </p>
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
              disabled={isSubmitting || isLoadingServices}
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
