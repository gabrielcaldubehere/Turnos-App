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

export interface DashboardStats {
  todayAppointments: number;
  confirmedAppointments: number;
  pendingAppointments: number;
  estimatedRevenue: number;
}
