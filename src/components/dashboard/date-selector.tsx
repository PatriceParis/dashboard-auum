"use client";

import { Calendar } from "lucide-react";

interface Props {
  startDate: string;
  endDate: string;
  onStartChange: (date: string) => void;
  onEndChange: (date: string) => void;
}

export function DateSelector({ startDate, endDate, onStartChange, onEndChange }: Props) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Calendar className="w-4 h-4 text-muted-foreground" />
      <input
        type="date"
        value={startDate}
        onChange={(e) => onStartChange(e.target.value)}
        className="bg-muted border border-border rounded-md px-2 py-1.5 text-sm text-foreground"
      />
      <span className="text-muted-foreground">—</span>
      <input
        type="date"
        value={endDate}
        onChange={(e) => onEndChange(e.target.value)}
        className="bg-muted border border-border rounded-md px-2 py-1.5 text-sm text-foreground"
      />
    </div>
  );
}
