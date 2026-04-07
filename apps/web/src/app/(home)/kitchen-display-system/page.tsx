import type { Metadata } from "next";
import KDSInteractive from "@/components/idea02/KDSInteractive";

export const metadata: Metadata = {
  title: "Kitchen Display System - BIQ",
  description:
    "Real-time kitchen order queue with preparation time tracking, station assignments, and completion status indicators."
};

export default function KitchenDisplaySystemPage() {
  return <KDSInteractive />;
}
