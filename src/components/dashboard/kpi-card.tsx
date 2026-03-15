import { formatKPI } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  label: string;
  value: number;
  format: string;
  icon: ReactNode;
  accentColor?: string;
}

export function KPICard({ label, value, format, icon, accentColor }: Props) {
  return (
    <div className={`bg-card rounded-xl border border-border p-5 flex flex-col gap-2 ${accentColor ? `border-t-2 ${accentColor}` : ""}`}>
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
