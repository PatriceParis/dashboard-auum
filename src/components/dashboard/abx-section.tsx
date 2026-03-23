"use client";

import type { ABXData } from "@/lib/types";
import { ABXKPIGrid } from "./abx-kpi-grid";
import { ABXFunnel } from "./abx-funnel";
import { ABXCompanyTable } from "./abx-company-table";

interface Props {
  data: ABXData;
}

export function ABXSection({ data }: Props) {
  return (
    <div className="space-y-6">
      <ABXKPIGrid summary={data.summary} />
      <ABXFunnel summary={data.summary} />
      <ABXCompanyTable companies={data.companies} />
    </div>
  );
}
