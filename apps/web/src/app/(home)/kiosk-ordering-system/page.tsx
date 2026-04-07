import type { Metadata } from "next";
import KioskInteractive from "@/components/idea02/KioskInteractive";

export const metadata: Metadata = {
  title: "Kiosk Ordering System - BIQ",
  description:
    "Self-service kiosk ordering with QR menu, tablet interface, and kiosk templates for dine-in and takeaway orders."
};

export default function KioskOrderingSystemPage() {
  return <KioskInteractive />;
}
