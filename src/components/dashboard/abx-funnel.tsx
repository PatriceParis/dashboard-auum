import type { ABXSummary } from "@/lib/types";

interface Props {
  summary: ABXSummary;
}

export function ABXFunnel({ summary }: Props) {
  const { funnel } = summary;
  const steps = [
    { label: "Sociétés touchées", value: funnel.reached, color: "bg-blue-500" },
    { label: "Dans le CRM", value: funnel.inCRM, color: "bg-purple-500" },
    { label: "Avec devis", value: funnel.withDevis, color: "bg-amber-500" },
    { label: "Deals gagnés", value: funnel.won, color: "bg-emerald-500" },
  ];

  const maxValue = steps[0].value || 1;

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="text-lg font-semibold mb-6">Funnel ABX</h3>
      <div className="space-y-4">
        {steps.map((step, i) => {
          const widthPct = Math.max((step.value / maxValue) * 100, 8);
          const convRate =
            i > 0 && steps[i - 1].value > 0
              ? ((step.value / steps[i - 1].value) * 100).toFixed(1)
              : null;
          return (
            <div key={step.label} className="flex items-center gap-4">
              <div className="w-40 text-sm text-muted-foreground text-right shrink-0">
                {step.label}
              </div>
              <div className="flex-1 relative">
                <div
                  className={`${step.color} h-10 rounded-lg flex items-center px-3 transition-all`}
                  style={{ width: `${widthPct}%` }}
                >
                  <span className="text-white font-bold text-sm">
                    {step.value.toLocaleString("fr-FR")}
                  </span>
                </div>
              </div>
              {convRate && (
                <div className="w-16 text-xs text-muted-foreground shrink-0">
                  {convRate}%
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
