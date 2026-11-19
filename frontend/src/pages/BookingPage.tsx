import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import Icon from "../components/ui/Icon";
import {
  createAppointment,
  getServices,
  getSlotsForDate,
  getTodayDate,
} from "../services/appointmentService";
import type { Appointment, ServiceOption } from "../types/appointment";
import { formatBusinessName, formatCurrency, formatDate } from "../utils/format";
import type { TimeSlot } from "../utils/time";

type StepHeaderProps = {
  number: number;
  title: string;
  description: string;
};

function StepHeader({ number, title, description }: StepHeaderProps) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-600 text-sm font-semibold text-white">
        {number}
      </span>
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
        <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
      </div>
    </div>
  );
}

function BookingPage() {
  const { businessSlug } = useParams();
  const businessName = businessSlug
    ? formatBusinessName(businessSlug)
    : "Negocio";
  const today = getTodayDate();

  const [services, setServices] = useState<ServiceOption[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );
  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsVersion, setSlotsVersion] = useState(0);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Appointment | null>(null);

  useEffect(() => {
    let active = true;

    getServices()
      .then((data) => {
        if (active) setServices(data);
      })
      .catch(() => {
        if (active) setError("No se pudieron cargar los servicios.");
      })
      .finally(() => {
        if (active) setServicesLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    getSlotsForDate(date)
      .then((data) => {
        if (active) setSlots(data);
      })
      .catch(() => {
        if (active) {
          setSlots([]);
          setError("No se pudieron cargar los horarios disponibles.");
        }
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });

    return () => {
      active = false;
    };
  }, [date, slotsVersion]);

  const selectedService =
    services.find((service) => service.id === selectedServiceId) ?? null;

  const updateDate = (nextDate: string) => {
    setDate(nextDate);
    setSelectedTime(null);
    setLoadingSlots(true);
    setSlotsVersion((version) => version + 1);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!selectedService) {
      setError("Elegí un servicio para continuar.");
      return;
    }
    if (!selectedTime) {
      setError("Elegí un horario disponible.");
      return;
    }
    if (slots.find((slot) => slot.time === selectedTime)?.occupied) {
      setError("Ese horario ya está ocupado. Elegí otro.");
      return;
    }
    if (!clientName.trim() || !clientPhone.trim()) {
      setError("Completá tu nombre y tu teléfono para continuar.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Ingresá un email válido para continuar.");
      return;
    }
    const parsedAge = Number(age);
    if (!Number.isInteger(parsedAge) || parsedAge < 1 || parsedAge > 120) {
      setError("Ingresá una edad válida (entre 1 y 120 años).");
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await createAppointment({
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        email: email.trim(),
        age: parsedAge,
        professionalName: "Por asignar",
        serviceIds: [selectedService.id],
        date,
        time: selectedTime,
        status: "pending",
        notes: notes.trim() || undefined,
      });

      setSlots((current) =>
        current.map((slot) =>
          slot.time === selectedTime ? { ...slot, occupied: true } : slot,
        ),
      );
      setConfirmation(created);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudo completar la reserva. Intentá nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewBooking = () => {
    setConfirmation(null);
    setSelectedServiceId(null);
    setClientName("");
    setClientPhone("");
    setEmail("");
    setAge("");
    setNotes("");
    setError(null);
    updateDate(getTodayDate());
  };

  if (confirmation) {
    return (
      <section className="space-y-6">
        <div className="surface overflow-hidden">
          <div className="bg-sage-50 px-6 py-10 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage-600 text-white">
              <Icon name="check" className="h-7 w-7" />
            </span>
            <p className="eyebrow mt-4">Reserva enviada</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
              ¡Listo, {confirmation.clientName.split(" ")[0]}!
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
              Tu turno quedó registrado en {businessName}. El equipo lo
              confirmará a la brevedad.
            </p>
          </div>

          <div className="px-6 py-6">
            <dl className="divide-y divide-zinc-100 text-sm">
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-zinc-500">Servicio</dt>
                <dd className="text-right font-medium text-zinc-900">
                  {confirmation.serviceName}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-zinc-500">Fecha y hora</dt>
                <dd className="text-right font-medium tabular-nums text-zinc-900">
                  {formatDate(confirmation.date)} · {confirmation.time} hs
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-zinc-500">Cliente</dt>
                <dd className="text-right font-medium text-zinc-900">
                  {confirmation.clientName}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-zinc-500">Teléfono</dt>
                <dd className="text-right font-medium tabular-nums text-zinc-900">
                  {confirmation.clientPhone}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-zinc-500">Email</dt>
                <dd className="break-all text-right font-medium text-zinc-900">
                  {confirmation.email}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-zinc-500">Edad</dt>
                <dd className="text-right font-medium tabular-nums text-zinc-900">
                  {confirmation.age}
                </dd>
              </div>
              {confirmation.notes && (
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-zinc-500">Notas</dt>
                  <dd className="max-w-[60%] text-right text-zinc-700">
                    {confirmation.notes}
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-zinc-500">Precio</dt>
                <dd className="text-right font-semibold text-sage-700">
                  {formatCurrency(confirmation.price)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-zinc-500">Código de reserva</dt>
                <dd className="break-all text-right font-mono text-xs text-zinc-600">
                  {confirmation.id}
                </dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={handleNewBooking}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sage-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sage-700 sm:w-auto"
            >
              <Icon name="plus" className="h-4 w-4" />
              Hacer otra reserva
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="eyebrow">Reserva online</p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Reservá tu turno en {businessName}
        </h1>
        <p className="text-sm text-zinc-500">
          Elegí el servicio y el horario que mejor te quede. Es rápido y sin
          costo.
        </p>
      </header>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}

      <div className="surface p-5 sm:p-6">
        <StepHeader
          number={1}
          title="Elegí un servicio"
          description="Seleccioná el tratamiento que querés reservar."
        />

        {servicesLoading ? (
          <div className="mt-5 flex items-center gap-3 text-sm text-zinc-500">
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-sage-500 border-t-transparent"
              aria-hidden="true"
            />
            Cargando servicios...
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {services.map((service) => {
              const isSelected = selectedServiceId === service.id;

              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => {
                    setSelectedServiceId(service.id);
                    setError(null);
                  }}
                  aria-pressed={isSelected}
                  className={`rounded-xl border p-4 text-left transition ${
                    isSelected
                      ? "border-sage-500 bg-sage-50/70 ring-2 ring-sage-500/20"
                      : "border-zinc-200 bg-white hover:border-sage-200 hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        isSelected
                          ? "bg-sage-600 text-white"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      <Icon name="services" className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-semibold text-zinc-900">
                      {formatCurrency(service.price)}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-zinc-900">
                    {service.name}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                    {service.description}
                  </p>
                  <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600">
                    <Icon name="clock" className="h-3.5 w-3.5" />
                    {service.durationMinutes} min
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="surface p-5 sm:p-6">
        <StepHeader
          number={2}
          title="Fecha y horario"
          description="Los horarios en gris ya están ocupados."
        />

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="booking-date"
              className="mb-1.5 block text-xs font-medium text-zinc-700"
            >
              Fecha
            </label>
            <input
              id="booking-date"
              type="date"
              min={today}
              value={date}
              onChange={(event) => updateDate(event.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-sage-500 focus:ring-2 focus:ring-sage-500/25"
            />
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-zinc-700">Horario</p>
            {loadingSlots ? (
              <div className="flex items-center gap-2 py-2 text-sm text-zinc-500">
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-sage-500 border-t-transparent"
                  aria-hidden="true"
                />
                Buscando horarios...
              </div>
            ) : slots.length === 0 ? (
              <p className="py-2 text-sm text-zinc-500">
                No hay horarios disponibles para esta fecha.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Horarios disponibles">
                {slots.map((slot) => {
                  const isSelected = selectedTime === slot.time;

                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={slot.occupied}
                      onClick={() => {
                        if (slot.occupied) return;
                        setSelectedTime(slot.time);
                        setError(null);
                      }}
                      aria-pressed={isSelected}
                      aria-label={slot.occupied ? `${slot.time} Ocupado` : slot.time}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium tabular-nums transition ${
                        slot.occupied
                          ? "cursor-not-allowed border-zinc-100 bg-zinc-100 text-zinc-400"
                          : isSelected
                            ? "border-sage-600 bg-sage-600 text-white shadow-sm"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-sage-300 hover:bg-sage-50"
                      }`}
                    >
                      {slot.time}
                      {slot.occupied && (
                        <span className="ml-1 text-[10px] font-normal">
                          Ocupado
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="surface space-y-5 p-5 sm:p-6">
        <StepHeader
          number={3}
          title="Tus datos"
          description="Te contactaremos para confirmar la reserva."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="client-name"
              className="mb-1.5 block text-xs font-medium text-zinc-700"
            >
              Nombre completo
            </label>
            <input
              id="client-name"
              type="text"
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
              placeholder="Ej. María González"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-sage-500 focus:ring-2 focus:ring-sage-500/25"
            />
          </div>

          <div>
            <label
              htmlFor="client-phone"
              className="mb-1.5 block text-xs font-medium text-zinc-700"
            >
              Teléfono <span className="font-normal text-rose-500">*</span>
            </label>
            <input
              id="client-phone"
              type="tel"
              value={clientPhone}
              onChange={(event) => setClientPhone(event.target.value)}
              placeholder="Ej. +54 9 11 5555-0101"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-sage-500 focus:ring-2 focus:ring-sage-500/25"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="client-email"
              className="mb-1.5 block text-xs font-medium text-zinc-700"
            >
              Email
            </label>
            <input
              id="client-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Ej. maria@ejemplo.com"
              autoComplete="email"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-sage-500 focus:ring-2 focus:ring-sage-500/25"
            />
            <p className="mt-1 text-xs text-zinc-400">
              Lo usamos para enviarte la confirmación.
            </p>
          </div>
          <div>
            <label
              htmlFor="client-age"
              className="mb-1.5 block text-xs font-medium text-zinc-700"
            >
              Edad
            </label>
            <input
              id="client-age"
              type="number"
              min={1}
              max={120}
              value={age}
              onChange={(event) => setAge(event.target.value)}
              placeholder="Ej. 32"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-sage-500 focus:ring-2 focus:ring-sage-500/25"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="booking-notes"
            className="mb-1.5 block text-xs font-medium text-zinc-700"
          >
            Notas <span className="font-normal text-zinc-400">(opcional)</span>
          </label>
          <textarea
            id="booking-notes"
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Contanos algo que debamos saber..."
            className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-sage-500 focus:ring-2 focus:ring-sage-500/25"
          />
        </div>

        {selectedService && selectedTime && (
          <p className="rounded-lg bg-sage-50 px-4 py-3 text-sm text-sage-700">
            Reservando{" "}
            <span className="font-semibold">{selectedService.name}</span> el{" "}
            <span className="font-semibold tabular-nums">
              {formatDate(date)} a las {selectedTime} hs
            </span>
            .
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sage-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sage-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isSubmitting ? (
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent"
              aria-hidden="true"
            />
          ) : (
            <Icon name="calendar" className="h-4 w-4" />
          )}
          {isSubmitting ? "Reservando..." : "Confirmar reserva"}
        </button>
      </form>
    </section>
  );
}

export default BookingPage;
