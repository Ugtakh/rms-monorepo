import type { Metadata } from "next";
import TabletPOSInteractive from "@/components/idea02/TabletPOSInteractive";

export const metadata: Metadata = {
  title: "Tablet Ordering Interface - BIQ",
  description:
    "Idea-pos-02 style tablet POS with customer self-order and cashier/waiter assisted ordering flows connected to RMS APIs."
};

export default function TabletOrderingInterfacePage() {
  return <TabletPOSInteractive />;
}
