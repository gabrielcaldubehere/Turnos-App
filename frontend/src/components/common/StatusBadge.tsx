import type { AppointmentStatus } from "../../types/appointment";

const statusStyles: Record<
  AppointmentStatus,
  { label: string; className: string }
> = {
  pending: { label: "Pendiente", className: "badge-pending" },
  confirmed: { label: "Confirmado", className: "badge-confirmed" },
  cancelled: { label: "Cancelado", className: "badge-cancelled" },
  completed: { label: "Completado", className: "badge-completed" },
};

type StatusBadgeProps = {
  status: AppointmentStatus;
};

function StatusBadge({ status }: StatusBadgeProps) {
  const { label, className } = statusStyles[status];
  return <span className={className}>{label}</span>;
}

export default StatusBadge;
