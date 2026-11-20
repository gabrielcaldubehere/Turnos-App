export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface AppointmentServiceDetail {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
}

export interface Appointment {
  id: string;
  createdAt?: string;
  clientName: string;
  clientPhone: string;
  email?: string;
  age?: number;
  username?: string;
  professionalName: string;
  serviceName: string;
  services: AppointmentServiceDetail[];
  date: string;
  time: string;
  status: AppointmentStatus;
  price: number;
  totalPrice: number;
  totalDurationMinutes: number;
  notes?: string;
}

export interface ServiceOption {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  description: string;
}

export type ServiceInput = Omit<ServiceOption, "id">;

export interface ProfessionalOption {
  id: string;
  name: string;
  specialty: string | null;
  active: boolean;
}

export type ProfessionalInput = Pick<
  ProfessionalOption,
  "name" | "specialty" | "active"
>;

export type AppointmentCreate = {
  clientName: string;
  clientPhone: string;
  email: string;
  age: number;
  professionalName: string;
  serviceIds: string[];
  date: string;
  time: string;
  status: AppointmentStatus;
  notes?: string;
};

export interface ClientRecord {
  username: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  age: number | null;
  appointmentsCount: number;
}

export type ClientUpdate = Partial<
  Pick<ClientRecord, "username" | "name" | "phone" | "email" | "age">
>;

export type AppointmentReschedule = {
  date: string;
  time: string;
  serviceIds: string[];
};

export interface DashboardStats {
  todayAppointments: number;
  confirmedAppointments: number;
  pendingAppointments: number;
  estimatedRevenue: number;
}
