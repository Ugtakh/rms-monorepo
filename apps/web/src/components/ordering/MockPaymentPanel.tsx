"use client";

import { useState } from "react";
import { CheckCircle2, CreditCard, QrCode, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { playPaymentSuccessSound } from "@/lib/sounds";

type PaymentMethod = "CARD" | "QPAY" | "CASH";

const methodLabel: Record<PaymentMethod, string> = {
  CARD: "Card",
  QPAY: "QPay",
  CASH: "Cash"
};

export default function MockPaymentPanel({
  total,
  orderNo,
  onPaid,
  onCancel
}: {
  total: number;
  orderNo: string;
  onPaid: (method: PaymentMethod) => void;
  onCancel: () => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("QPAY");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const startMockPayment = () => {
    setProcessing(true);

    window.setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
      playPaymentSuccessSound();
      onPaid(method);
    }, 1200);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div>
        <h3 className="text-lg font-display font-semibold text-foreground">Mock Payment</h3>
        <p className="text-sm text-muted-foreground">Order: {orderNo}</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(["QPAY", "CARD", "CASH"] as PaymentMethod[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMethod(item)}
            className={`rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${
              method === item
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            <span className="mb-1 block">
              {item === "QPAY" ? <QrCode className="h-4 w-4 mx-auto" /> : null}
              {item === "CARD" ? <CreditCard className="h-4 w-4 mx-auto" /> : null}
              {item === "CASH" ? <Wallet className="h-4 w-4 mx-auto" /> : null}
            </span>
            {methodLabel[item]}
          </button>
        ))}
      </div>

      <div className="rounded-xl bg-muted p-3 text-sm">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Total</span>
          <span className="font-mono text-foreground">{total.toLocaleString()}₮</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={processing}>
          Буцах
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={startMockPayment}
          disabled={processing || success}
        >
          {processing ? "Шалгаж байна..." : success ? <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Paid</span> : "Mock төлөх"}
        </Button>
      </div>
    </div>
  );
}
