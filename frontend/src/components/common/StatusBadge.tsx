import type { AppointmentStatus } from "../../types/appointment";

const statusStyles: Record<
  AppointmentStatus,
  { label: string; className: string; dotClassName: string }
> = {
  pending: {
    label: "Pendiente",
    className: "badge-pending",
    dotClassName: "bg-amber-500",
  },
  confirmed: {
    label: "Confirmado",
    className: "badge-confirmed",
    dotClassName: "bg-sage-500",
  },
  cancelled: {
    label: "Cancelado",
    className: "badge-cancelled",
    dotClassName: "bg-rose-500",
  },
  completed: {
    label: "Completado",
    className: "badge-completed",
    dotClassName: "bg-zinc-400",
  },
};

type StatusBadgeProps = {
  status: AppointmentStatus;
};

function StatusBadge({ status }: StatusBadgeProps) {
  const { label, className, dotClassName } = statusStyles[status];
  return (
    <span className={className}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${dotClassName}`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

export default StatusBadge;
