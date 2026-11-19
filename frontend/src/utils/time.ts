import type { Appointment } from "../types/appointment";

export type TimeSlot = {
  time: string;
  occupied: boolean;
};

const SLOT_MINUTES = 30;

export const TIME_SLOTS: readonly string[] = Array.from({ length: 25 }, (_, index) => {
  const totalMinutes = 8 * 60 + index * SLOT_MINUTES;
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
});

const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export const buildSlotAvailability = (
  date: string,
  appointments: Appointment[],
): TimeSlot[] => {
  const busyIntervals = appointments
    .filter(
      (appointment) =>
        appointment.date === date && appointment.status !== "cancelled",
    )
    .map((appointment) => {
      const start = toMinutes(appointment.time);
      return [start, start + (appointment.totalDurationMinutes || SLOT_MINUTES)] as const;
    });

  return TIME_SLOTS.map((time) => {
    const start = toMinutes(time);
    const end = start + SLOT_MINUTES;

    return {
      time,
      occupied: busyIntervals.some(
        ([busyStart, busyEnd]) => start < busyEnd && end > busyStart,
      ),
    };
  });
};
