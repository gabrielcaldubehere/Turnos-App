import type {
  Appointment,
  AppointmentStatus,
  DashboardStats,
  ServiceOption,
} from "../types/appointment";

const API_URL = "http://localhost:8000/api";
const JSON_HEADERS: HeadersInit = { "Content-Type": "application/json" };

type ApiErrorBody = {
  detail?: string | { msg?: string }[];
};

const formatDate = (offsetDays: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getTodayDate = (): string => formatDate(0);

const getErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as ApiErrorBody;
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail) && body.detail[0]?.msg) {
      return body.detail[0].msg;
    }
  } catch {
    return `Error ${response.status} al consultar la API.`;
  }

  return `Error ${response.status} al consultar la API.`;
};

async function request<T>(
  path: string,
  init?: RequestInit,
  expectedStatus?: number,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new Error(
      "No se pudo conectar con el backend. Verificá que FastAPI esté corriendo en localhost:8000.",
    );
  }

  if (
    !response.ok ||
    (expectedStatus !== undefined && response.status !== expectedStatus)
  ) {
    throw new Error(await getErrorMessage(response));
  }

  return (await response.json()) as T;
}

export async function getServices(): Promise<ServiceOption[]> {
  return request<ServiceOption[]>("/services");
}

export async function getAppointments(): Promise<Appointment[]> {
  return request<Appointment[]>("/appointments");
}

export async function createAppointment(
  newAppointmentData: Omit<Appointment, "id" | "createdAt">,
): Promise<Appointment> {
  return request<Appointment>(
    "/appointments",
    {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(newAppointmentData),
    },
    201,
  );
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<Appointment> {
  return request<Appointment>(
    `/appointments/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      headers: JSON_HEADERS,
      body: JSON.stringify({ status }),
    },
  );
}

export async function getAvailableSlots(date: string): Promise<string[]> {
  const appointments = await getAppointments();

  const occupiedHours = new Set(
    appointments
      .filter(
        (appointment) =>
          appointment.date === date && appointment.status !== "cancelled",
      )
      .map((appointment) => appointment.time.slice(0, 2)),
  );

  const slots: string[] = [];
  for (let hour = 9; hour <= 18; hour += 1) {
    const hourLabel = String(hour).padStart(2, "0");
    if (!occupiedHours.has(hourLabel)) slots.push(`${hourLabel}:00`);
  }

  return slots;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const appointments = await getAppointments();
  const today = formatDate(0);
  const todayAppointments = appointments.filter(
    (appointment) =>
      appointment.date === today && appointment.status !== "cancelled",
  );

  return {
    todayAppointments: todayAppointments.length,
    confirmedAppointments: appointments.filter(
      (appointment) => appointment.status === "confirmed",
    ).length,
    pendingAppointments: appointments.filter(
      (appointment) => appointment.status === "pending",
    ).length,
    estimatedRevenue: appointments
      .filter(
        (appointment) =>
          appointment.status === "confirmed" ||
          appointment.status === "completed",
      )
      .reduce((total, appointment) => total + appointment.price, 0),
  };
}
