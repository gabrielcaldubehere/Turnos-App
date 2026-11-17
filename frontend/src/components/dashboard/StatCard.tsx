import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string | number;
  hint: string;
  icon: ReactNode;
};

function StatCard({ label, value, hint, icon }: StatCardProps) {
  return (
    <article className="surface-interactive p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
            {value}
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-500/10 text-sage-700">
          {icon}
        </span>
      </div>
      <p className="mt-4 text-xs text-zinc-400">{hint}</p>
    </article>
  );
}

export default StatCard;
