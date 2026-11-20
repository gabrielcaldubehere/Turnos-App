import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import useAuth from "../auth/useAuth";
import Icon from "../components/ui/Icon";
import {
  createAppointment,
  getProfessionals,
  getServices,
  getSlotsForDate,
  getTodayDate,
} from "../services/appointmentService";
import type {
  Appointment,
  ProfessionalOption,
  ServiceOption,
} from "../types/appointment";
import { formatBusinessName, formatCurrency, formatDate } from "../utils/format";
import type { TimeSlot } from "../utils/time";
import { isValidUsername, normalizeUsername } from "../utils/username";

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

type BookingMode = "public" | "onboarding" | "client";

type BookingPageProps = {
  mode?: BookingMode;
};

function BookingPage({ mode = "public" }: BookingPageProps) {
  const { businessSlug } = useParams();
  const { user, signUpClient } = useAuth();
  const businessName = businessSlug
    ? formatBusinessName(businessSlug)
    : "Negocio";
  const today = getTodayDate();

  const [services, setServices] = useState<ServiceOption[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalOption[]>([]);
  const [professionalsLoading, setProfessionalsLoading] = useState(true);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<
    string | null
  >(null);
  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsVersion, setSlotsVersion] = useState(0);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Appointment | null>(null);

  useEffect(() => {
    let active = true;

    const loadCatalog = async () => {
      try {
        const [serviceData, professionalData] = await Promise.all([
          getServices(),
          getProfessionals(),
        ]);
        if (active) {
          setServices(serviceData);
          setProfessionals(professionalData.filter((item) => item.active));
        }
      } catch {
        if (active) setError("No se pudieron cargar servicios y profesionales.");
      } finally {
        if (active) {
          setServicesLoading(false);
          setProfessionalsLoading(false);
        }
      }
    };

    void loadCatalog();
    window.addEventListener("focus", loadCatalog);

    return () => {
      active = false;
      window.removeEventListener("focus", loadCatalog);
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

  const selectedServices = services.filter((service) =>
    selectedServiceIds.includes(service.id),
  );
  const selectedProfessional =
    professionals.find((item) => item.id === selectedProfessionalId) ?? null;
  const totalPrice = selectedServices.reduce(
    (total, service) => total + service.price,
    0,
  );
  const totalDuration = selectedServices.reduce(
    (total, service) => total + service.durationMinutes,
    0,
  );

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

    if (selectedServices.length === 0) {
      setError("Elegí al menos un servicio para continuar.");
      return;
    }
    if (!selectedProfessional) {
      setError("Elegí un profesional para continuar.");
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

    const normalizedUsername = normalizeUsername(username);
    if (mode === "onboarding") {
      if (!isValidUsername(normalizedUsername)) {
        setError("Elegí un usuario de 3 a 64 caracteres (letras, números, - o _).");
        return;
      }
      if (password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      let token: string | undefined;

      if (mode === "onboarding") {
        token =
          user.role === "client" &&
          user.username === normalizedUsername &&
          user.token
            ? user.token
            : (await signUpClient(normalizedUsername, password)).token;
      } else if (mode === "client") {
        if (user.role !== "client" || !user.token) {
          throw new Error("Ingresá nuevamente para reservar tus turnos.");
        }
        token = user.token;
      }

      const created = await createAppointment({
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        email: email.trim(),
        age: parsedAge,
        professionalName: selectedProfessional.name,
        serviceIds: selectedServiceIds,
        date,
        time: selectedTime,
        status: "pending",
        notes: notes.trim() || undefined,
      }, token);

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
    setSelectedServiceIds([]);
    setSelectedProfessionalId(null);
    setClientName("");
    setClientPhone("");
    setEmail("");
    setAge("");
    setUsername("");
    setPassword("");
    setNotes("");
    setError(null);
    updateDate(getTodayDate());
  };

  if (confirmation) {
    const panelHref =
      mode === "public"
        ? null
        : `/client/${normalizeUsername(user.username ?? username)}`;

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
            {panelHref && (
              <p className="mx-auto mt-4 max-w-md rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Una vez reservado el turno, debés esperar la confirmación o una
                posible modificación del mismo.
              </p>
            )}
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

            <div className="mt-6 flex flex-wrap gap-3">
              {panelHref && (
                <Link
                  to={panelHref}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sage-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sage-700 sm:w-auto"
                >
                  <Icon name="arrow-right" className="h-4 w-4" />
                  Ir a mis turnos
                </Link>
              )}
              <button
                type="button"
                onClick={handleNewBooking}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 sm:w-auto"
              >
                <Icon name="plus" className="h-4 w-4" />
                Hacer otra reserva
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="eyebrow">
          {mode === "onboarding"
            ? "Primer turno"
            : mode === "client"
              ? "Nuevo turno"
              : "Reserva online"}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          {mode === "onboarding"
            ? "Creá tu usuario y reservá tu turno"
            : mode === "client"
              ? "Reservá un nuevo turno"
              : `Reservá tu turno en ${businessName}`}
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
              const isSelected = selectedServiceIds.includes(service.id);

              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => {
                    setSelectedServiceIds((current) =>
                      current.includes(service.id)
                        ? current.filter((id) => id !== service.id)
                        : [...current, service.id],
                    );
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
          title="Elegí el profesional"
          description="Seleccioná con quién querés atenderte."
        />

        {professionalsLoading ? (
          <div className="mt-5 flex items-center gap-3 text-sm text-zinc-500">
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-sage-500 border-t-transparent"
              aria-hidden="true"
            />
            Cargando profesionales...
          </div>
        ) : professionals.length === 0 ? (
          <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Todavía no hay profesionales disponibles.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {professionals.map((professional) => {
              const isSelected = selectedProfessionalId === professional.id;
              return (
                <button
                  key={professional.id}
                  type="button"
                  onClick={() => {
                    setSelectedProfessionalId(professional.id);
                    setError(null);
                  }}
                  aria-pressed={isSelected}
                  className={`rounded-xl border p-4 text-left transition ${
                    isSelected
                      ? "border-sage-500 bg-sage-50/70 ring-2 ring-sage-500/20"
                      : "border-zinc-200 bg-white hover:border-sage-200 hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                        isSelected
                          ? "bg-sage-600 text-white"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {professional.name.charAt(0)}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-zinc-900">
                        {professional.name}
                      </span>
                      {professional.specialty && (
                        <span className="block text-xs text-zinc-500">
                          {professional.specialty}
                        </span>
                      )}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="surface p-5 sm:p-6">
        <StepHeader
          number={3}
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
          number={4}
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

        {mode === "onboarding" && (
          <div className="rounded-xl border border-sage-200 bg-sage-50/60 p-4">
            <p className="text-sm font-semibold text-zinc-900">
              Creá tu usuario para gestionar tus turnos
            </p>
            <p className="mt-1 text-xs text-sage-700">
              Con estos datos vas a poder ingresar a tu panel en{" "}
              <code className="font-mono">/client/tu-usuario</code>.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="booking-username"
                  className="mb-1.5 block text-xs font-medium text-zinc-700"
                >
                  Usuario
                </label>
                <input
                  id="booking-username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  placeholder="Ej. maria_gonzalez"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-sage-500 focus:ring-2 focus:ring-sage-500/25"
                />
              </div>
              <div>
                <label
                  htmlFor="booking-password"
                  className="mb-1.5 block text-xs font-medium text-zinc-700"
                >
                  Contraseña
                </label>
                <input
                  id="booking-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-sage-500 focus:ring-2 focus:ring-sage-500/25"
                />
              </div>
            </div>
          </div>
        )}

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

        {selectedServices.length > 0 && selectedProfessional && selectedTime && (
          <div className="space-y-1 rounded-lg bg-sage-50 px-4 py-3 text-sm text-sage-700">
            <p>
              Reservando{" "}
              <span className="font-semibold">
                {selectedServices.map((service) => service.name).join(", ")}
              </span>{" "}
              con <span className="font-semibold">{selectedProfessional.name}</span>{" "}
              el{" "}
              <span className="font-semibold tabular-nums">
                {formatDate(date)} a las {selectedTime} hs
              </span>
              .
            </p>
            <p className="text-xs text-sage-600">
              Duración estimada: {totalDuration} min · Total:{" "}
              {formatCurrency(totalPrice)}
            </p>
          </div>
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
