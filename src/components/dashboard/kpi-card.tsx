import { formatKPI } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  label: string;
  value: number;
  format: string;
  icon: ReactNode;
}

export function KPICard({ label, value, format, icon }: Props) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        <span className="text-muted-foreground/50">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-foreground">
        {formatKPI(value, format)}
      </div>
    </div>
  );
}
