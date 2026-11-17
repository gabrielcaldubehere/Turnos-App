export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Appointment {
  id: string;
  createdAt?: string;
  clientName: string;
  clientPhone: string;
  professionalName: string;
  serviceName: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  price: number;
  notes?: string;
}

export interface ServiceOption {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  description: string;
}

export interface DashboardStats {
  todayAppointments: number;
  confirmedAppointments: number;
  pendingAppointments: number;
  estimatedRevenue: number;
}
