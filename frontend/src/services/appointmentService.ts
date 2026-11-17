import type {
  Appointment,
  AppointmentStatus,
  DashboardStats,
} from "../types/appointment";

const MOCK_LATENCY_MS = 400;

const formatDate = (offsetDays: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

let appointments: Appointment[] = [
  {
    id: "apt-1001",
    clientName: "María González",
    clientPhone: "+54 9 11 5555-0101",
    professionalName: "Ana Ruiz",
    serviceName: "Limpieza facial",
    date: formatDate(0),
    time: "09:00",
    status: "confirmed",
    price: 45000,
    notes: "Prefiere atención en horario de mañana.",
  },
  {
    id: "apt-1002",
    clientName: "Carlos Rodríguez",
    clientPhone: "+54 9 11 5555-0102",
    professionalName: "Lucía Torres",
    serviceName: "Corte y peinado",
    date: formatDate(0),
    time: "11:30",
    status: "pending",
    price: 38000,
  },
  {
    id: "apt-1003",
    clientName: "Sofía Martínez",
    clientPhone: "+54 9 11 5555-0103",
    professionalName: "Ana Ruiz",
    serviceName: "Manicura",
    date: formatDate(0),
    time: "16:00",
    status: "cancelled",
    price: 32000,
    notes: "Canceló por motivos personales.",
  },
  {
    id: "apt-1004",
    clientName: "Lucía Fernández",
    clientPhone: "+54 9 11 5555-0104",
    professionalName: "Lucía Torres",
    serviceName: "Masaje relajante",
    date: formatDate(0),
    time: "18:15",
    status: "confirmed",
    price: 62000,
  },
  {
    id: "apt-1005",
    clientName: "Diego López",
    clientPhone: "+54 9 11 5555-0105",
    professionalName: "Ana Ruiz",
    serviceName: "Pedicura",
    date: formatDate(-1),
    time: "15:00",
    status: "completed",
    price: 34000,
  },
  {
    id: "apt-1006",
    clientName: "Valentina Rossi",
    clientPhone: "+54 9 11 5555-0106",
    professionalName: "Lucía Torres",
    serviceName: "Tratamiento capilar",
    date: formatDate(1),
    time: "10:00",
    status: "pending",
    price: 55000,
    notes: "Primera visita al salón.",
  },
  {
    id: "apt-1007",
    clientName: "Martín Silva",
    clientPhone: "+54 9 11 5555-0107",
    professionalName: "Ana Ruiz",
    serviceName: "Limpieza facial",
    date: formatDate(1),
    time: "12:30",
    status: "confirmed",
    price: 45000,
  },
  {
    id: "apt-1008",
    clientName: "Camila Torres",
    clientPhone: "+54 9 11 5555-0108",
    professionalName: "Lucía Torres",
    serviceName: "Depilación",
    date: formatDate(3),
    time: "17:00",
    status: "confirmed",
    price: 41000,
  },
];

const delay = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

let idSequence = 0;

const copyAppointment = (appointment: Appointment): Appointment => ({
  ...appointment,
});

export async function getAppointments(): Promise<Appointment[]> {
  await delay(MOCK_LATENCY_MS);
  return appointments.map(copyAppointment);
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<Appointment> {
  await delay(MOCK_LATENCY_MS);

  const existing = appointments.find((appointment) => appointment.id === id);
  if (!existing) {
    throw new Error(`No se encontró el turno con id "${id}"`);
  }

  const updated: Appointment = { ...existing, status };
  appointments = appointments.map((appointment) =>
    appointment.id === id ? updated : appointment,
  );

  return copyAppointment(updated);
}

export async function createAppointment(
  newAppointmentData: Omit<Appointment, "id" | "createdAt">,
): Promise<Appointment> {
  await delay(MOCK_LATENCY_MS);

  idSequence += 1;
  const created: Appointment = {
    ...newAppointmentData,
    id: `apt-${Date.now().toString()}-${idSequence}`,
    createdAt: new Date().toISOString(),
  };

  appointments = [...appointments, created];

  return copyAppointment(created);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await delay(MOCK_LATENCY_MS);

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
