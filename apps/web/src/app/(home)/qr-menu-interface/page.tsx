import type { Metadata } from "next";
import QRMenuInteractive from "@/components/idea02/QRMenuInteractive";

export const metadata: Metadata = {
  title: "QR Menu Interface - BIQ",
  description:
    "Mobile-friendly QR menu with item customization, cart drawer, and real-time order + payment API integration."
};

export default function QRMenuInterfacePage() {
  return <QRMenuInteractive />;
}
