import type {
  Appointment,
  AppointmentCreate,
  AppointmentReschedule,
  AppointmentStatus,
  ClientRecord,
  ClientUpdate,
  DashboardStats,
  ProfessionalInput,
  ProfessionalOption,
  ServiceInput,
  ServiceOption,
} from "../types/appointment";
import { buildSlotAvailability, type TimeSlot } from "../utils/time";

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

export async function createService(payload: ServiceInput): Promise<ServiceOption> {
  return request<ServiceOption>(
    "/services",
    { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(payload) },
    201,
  );
}

export async function updateService(
  id: string,
  payload: ServiceInput,
): Promise<ServiceOption> {
  return request<ServiceOption>(`/services/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
}

export async function getProfessionals(): Promise<ProfessionalOption[]> {
  return request<ProfessionalOption[]>("/professionals");
}

export async function createProfessional(
  payload: ProfessionalInput,
): Promise<ProfessionalOption> {
  return request<ProfessionalOption>(
    "/professionals",
    { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(payload) },
    201,
  );
}

export async function updateProfessional(
  id: string,
  payload: ProfessionalInput,
): Promise<ProfessionalOption> {
  return request<ProfessionalOption>(
    `/professionals/${encodeURIComponent(id)}`,
    { method: "PATCH", headers: JSON_HEADERS, body: JSON.stringify(payload) },
  );
}

export async function getAppointments(): Promise<Appointment[]> {
  return request<Appointment[]>("/appointments");
}

export async function getAppointmentsByEmail(email: string): Promise<Appointment[]> {
  return request<Appointment[]>(
    `/appointments?email=${encodeURIComponent(email)}`,
  );
}

export type AuthResult = {
  role: "admin" | "client";
  token: string;
  username?: string;
  email?: string;
};

export async function login(
  username: string,
  password: string,
): Promise<AuthResult> {
  return request("/auth/login", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ username, password }),
  });
}

export async function registerClient(
  username: string,
  password: string,
): Promise<AuthResult> {
  return request("/auth/register", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ username, password }),
  });
}

export async function loginAdmin(
  username: string,
  password: string,
): Promise<AuthResult> {
  return login(username, password);
}

export async function loginClient(
  username: string,
  password: string,
): Promise<AuthResult> {
  return login(username, password);
}

export async function getClientAppointments(
  username: string,
  token: string,
): Promise<Appointment[]> {
  return request(`/client/${encodeURIComponent(username)}/appointments`, {
    headers: { ...JSON_HEADERS, Authorization: `Bearer ${token}` },
  });
}

export async function createAppointment(
  newAppointmentData: AppointmentCreate,
  token?: string,
): Promise<Appointment> {
  return request<Appointment>(
    "/appointments",
    {
      method: "POST",
      headers: token
        ? { ...JSON_HEADERS, Authorization: `Bearer ${token}` }
        : JSON_HEADERS,
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

export async function rescheduleAppointment(
  id: string,
  payload: AppointmentReschedule,
): Promise<Appointment> {
  return request<Appointment>(`/appointments/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
}

export async function getClients(): Promise<ClientRecord[]> {
  return request<ClientRecord[]>("/admin/clients");
}

export async function updateClient(
  username: string,
  payload: ClientUpdate,
): Promise<ClientRecord> {
  return request<ClientRecord>(
    `/admin/clients/${encodeURIComponent(username)}`,
    {
      method: "PATCH",
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
  );
}

export async function getSlotsForDate(date: string): Promise<TimeSlot[]> {
  const appointments = await getAppointments();
  return buildSlotAvailability(date, appointments);
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
