import type { Metadata } from "next";
import ExecutiveOverviewInteractive from "@/components/idea02/ExecutiveOverviewInteractive";

export const metadata: Metadata = {
  title: "Executive Overview - BIQ",
  description: "Enterprise-level executive dashboard with KPI, branch ranking, trend analytics and peak-hour heatmap."
};

export default function ExecutiveOverviewPage() {
  return <ExecutiveOverviewInteractive />;
}
