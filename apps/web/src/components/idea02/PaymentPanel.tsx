"use client";

import { useState, useEffect } from "react";
import Icon from "@/components/idea02/AppIcon";
import { loadPrinterSettings } from "@/lib/printer-settings";

// ── Types ──────────────────────────────────────────────────────────────────────
export type PaymentMethod = "qpay" | "card" | "cash";
export type PaymentStatus = "idle" | "processing" | "success" | "failed";
export type ReceiptType = "print" | "email" | "sms" | "none";
export type EbarimtCustomerType = "PERSONAL" | "ORGANIZATION";
export interface EbarimtCustomerInput {
  customerType: EbarimtCustomerType;
  customerName?: string;
  customerTin?: string;
  customerPhone?: string;
}

interface PaymentPanelProps {
  total: number;
  orderNumber?: string;
  onSuccess: (
    method: PaymentMethod,
    receipt: ReceiptType,
    ebarimt: EbarimtCustomerInput,
  ) => void;
  onCancel: () => void;
  lang?: "en" | "mn";
  compact?: boolean;
}

const formatPrice = (p: number) => `₮${p.toLocaleString()}`;

// ── QPay QR Display ────────────────────────────────────────────────────────────
function QPayQRDisplay({
  total,
  status,
  onSimulate,
  lang,
}: {
  total: number;
  status: PaymentStatus;
  onSimulate: () => void;
  lang: "en" | "mn";
}) {
  const [countdown, setCountdown] = useState(300); // 5 min expiry

  useEffect(() => {
    if (status !== "idle") return;
    const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [status]);

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;

  if (status === "processing") {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="text-center">
          <p className="font-bold text-foreground text-base">
            {lang === "mn" ? "Төлбөр шалгаж байна..." : "Verifying payment..."}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === "mn"
              ? "QPay-ээс баталгаажуулалт хүлээж байна"
              : "Waiting for QPay confirmation"}
          </p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
          <Icon name="CheckCircleIcon" size={44} className="text-success" />
        </div>
        <p className="font-bold text-success text-lg">
          {lang === "mn" ? "Төлбөр амжилттай!" : "Payment Successful!"}
        </p>
        <p className="text-2xl font-bold text-foreground mono">
          {formatPrice(total)}
        </p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
          <Icon name="XCircleIcon" size={44} className="text-destructive" />
        </div>
        <p className="font-bold text-destructive text-base">
          {lang === "mn" ? "Төлбөр амжилтгүй" : "Payment Failed"}
        </p>
        <p className="text-sm text-muted-foreground text-center">
          {lang === "mn" ? "Дахин оролдоно уу" : "Please try again"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* QR Code */}
      <div className="relative">
        <div className="w-48 h-48 bg-white rounded-2xl shadow-card flex items-center justify-center border-2 border-border p-3">
          {/* Simulated QR pattern */}
          <div className="w-full h-full relative">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Corner squares */}
              <rect
                x="5"
                y="5"
                width="28"
                height="28"
                rx="3"
                fill="none"
                stroke="#1e293b"
                strokeWidth="4"
              />
              <rect
                x="11"
                y="11"
                width="16"
                height="16"
                rx="1"
                fill="#1e293b"
              />
              <rect
                x="67"
                y="5"
                width="28"
                height="28"
                rx="3"
                fill="none"
                stroke="#1e293b"
                strokeWidth="4"
              />
              <rect
                x="73"
                y="11"
                width="16"
                height="16"
                rx="1"
                fill="#1e293b"
              />
              <rect
                x="5"
                y="67"
                width="28"
                height="28"
                rx="3"
                fill="none"
                stroke="#1e293b"
                strokeWidth="4"
              />
              <rect
                x="11"
                y="73"
                width="16"
                height="16"
                rx="1"
                fill="#1e293b"
              />
              {/* Data modules */}
              {[40, 44, 48, 52, 56, 60, 64].map((x, i) =>
                [40, 44, 48, 52, 56, 60, 64].map((y, j) =>
                  (i + j) % 2 === 0 ? (
                    <rect
                      key={`${i}-${j}`}
                      x={x}
                      y={y}
                      width="3"
                      height="3"
                      fill="#1e293b"
                    />
                  ) : null,
                ),
              )}
              {[5, 9, 13, 17, 21, 25].map((x, i) =>
                [40, 44, 48, 52, 56, 60, 64, 68, 72, 76, 80, 84, 88, 92].map(
                  (y, j) =>
                    (i * 3 + j) % 3 !== 0 ? (
                      <rect
                        key={`l-${i}-${j}`}
                        x={x}
                        y={y}
                        width="3"
                        height="3"
                        fill="#1e293b"
                      />
                    ) : null,
                ),
              )}
              {[40, 44, 48, 52, 56, 60, 64, 68, 72, 76, 80, 84, 88, 92].map(
                (x, i) =>
                  [5, 9, 13, 17, 21, 25].map((y, j) =>
                    (i + j * 2) % 3 !== 1 ? (
                      <rect
                        key={`t-${i}-${j}`}
                        x={x}
                        y={y}
                        width="3"
                        height="3"
                        fill="#1e293b"
                      />
                    ) : null,
                  ),
              )}
              {/* QPay logo center */}
              <rect x="42" y="42" width="16" height="16" rx="2" fill="white" />
              <text
                x="50"
                y="53"
                textAnchor="middle"
                fontSize="7"
                fontWeight="bold"
                fill="#0066CC"
              >
                Q
              </text>
            </svg>
          </div>
        </div>
        {/* Expiry badge */}
        <div
          className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${countdown < 60 ? "bg-destructive text-white" : "bg-muted text-muted-foreground"}`}
        >
          {countdown > 0
            ? `${mins}:${secs.toString().padStart(2, "0")}`
            : lang === "mn"
              ? "Дуусгавар"
              : "Expired"}
        </div>
      </div>

      <div className="text-center mt-2">
        <p className="font-bold text-2xl text-primary mono">
          {formatPrice(total)}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {lang === "mn"
            ? "QPay апп-аар скан хийж төлнө үү"
            : "Scan with QPay app to pay"}
        </p>
      </div>

      {/* QPay bank logos */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {["Khan Bank", "TDB", "Golomt", "XacBank", "State Bank"].map((bank) => (
          <span
            key={bank}
            className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium"
          >
            {bank}
          </span>
        ))}
      </div>

      {/* Simulate payment button (for demo) */}
      <button
        onClick={onSimulate}
        className="text-xs text-primary underline underline-offset-2 opacity-60 hover:opacity-100 transition-standard"
      >
        {lang === "mn" ? "(Demo: Төлбөр симуляц)" : "(Demo: Simulate payment)"}
      </button>
    </div>
  );
}

// ── Bank POS Card Reader ───────────────────────────────────────────────────────
function BankPOSDisplay({
  total,
  status,
  onSimulate,
  lang,
}: {
  total: number;
  status: PaymentStatus;
  onSimulate: () => void;
  lang: "en" | "mn";
}) {
  if (status === "processing") {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="w-32 h-20 bg-slate-800 rounded-xl flex items-center justify-center shadow-elevated relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-slate-700 to-slate-900" />
          <div className="relative flex flex-col items-center gap-1">
            <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-green-400 text-[10px] font-mono">
              PROCESSING
            </span>
          </div>
          {/* Card slot animation */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-400/30">
            <div
              className="h-full bg-green-400 animate-pulse"
              style={{ width: "60%" }}
            />
          </div>
        </div>
        <div className="text-center">
          <p className="font-bold text-foreground text-base">
            {lang === "mn" ? "Картыг уншиж байна..." : "Reading card..."}
          </p>
          <p className="text-sm text-muted-foreground">
            {lang === "mn"
              ? "Картаа POS терминалд хийнэ үү"
              : "Insert or tap your card on the POS terminal"}
          </p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
          <Icon name="CheckCircleIcon" size={44} className="text-success" />
        </div>
        <p className="font-bold text-success text-lg">
          {lang === "mn" ? "Карт амжилттай уншигдлаа!" : "Card Approved!"}
        </p>
        <p className="text-2xl font-bold text-foreground mono">
          {formatPrice(total)}
        </p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
          <Icon name="XCircleIcon" size={44} className="text-destructive" />
        </div>
        <p className="font-bold text-destructive text-base">
          {lang === "mn" ? "Карт уншигдсангүй" : "Card Declined"}
        </p>
        <p className="text-sm text-muted-foreground text-center">
          {lang === "mn"
            ? "Картаа шалгаад дахин оролдоно уу"
            : "Check your card and try again"}
        </p>
      </div>
    );
  }

  // Idle — waiting state
  return (
    <div className="flex flex-col items-center gap-5">
      {/* POS Terminal illustration */}
      <div className="relative">
        <div className="w-36 h-52 bg-slate-800 rounded-2xl shadow-elevated flex flex-col items-center justify-between py-4 px-3 border border-slate-700">
          {/* Screen */}
          <div className="w-full h-20 bg-slate-900 rounded-lg border border-slate-600 flex flex-col items-center justify-center gap-1">
            <p className="text-green-400 text-xs font-mono font-bold">READY</p>
            <p className="text-green-300 text-[10px] font-mono">
              {formatPrice(total)}
            </p>
          </div>
          {/* Keypad */}
          <div className="grid grid-cols-3 gap-1 w-full">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map(
              (k) => (
                <div
                  key={k}
                  className="h-5 bg-slate-700 rounded text-slate-400 text-[9px] flex items-center justify-center font-mono"
                >
                  {k}
                </div>
              ),
            )}
          </div>
          {/* Card slot */}
          <div className="w-full h-3 bg-slate-900 rounded border border-slate-600 flex items-center justify-center">
            <div className="w-16 h-0.5 bg-slate-600 rounded-full" />
          </div>
        </div>
        {/* Tap indicator */}
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
          <div className="w-8 h-8 rounded-full border-2 border-primary/40 flex items-center justify-center animate-ping absolute" />
          <div className="w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center relative bg-white">
            <Icon
              name="WifiIcon"
              size={14}
              className="text-primary rotate-90"
            />
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="font-bold text-foreground text-base">
          {lang === "mn" ? "Картаа хүлээж байна" : "Waiting for card"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {lang === "mn"
            ? "Картаа хийх, гүйлгэх эсвэл тавих"
            : "Insert, swipe, or tap your card"}
        </p>
        <div className="flex items-center justify-center gap-3 mt-3">
          {["Visa", "MC", "UnionPay", "Amex"].map((c) => (
            <span
              key={c}
              className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded font-semibold"
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={onSimulate}
        className="text-xs text-primary underline underline-offset-2 opacity-60 hover:opacity-100 transition-standard"
      >
        {lang === "mn" ? "(Demo: Карт дуурайлга)" : "(Demo: Simulate card tap)"}
      </button>
    </div>
  );
}

// ── Cash Confirmation ──────────────────────────────────────────────────────────
function CashDisplay({
  total,
  status,
  onConfirm,
  lang,
}: {
  total: number;
  status: PaymentStatus;
  onConfirm: () => void;
  lang: "en" | "mn";
}) {
  const [cashGiven, setCashGiven] = useState("");
  const cashAmount = parseInt(cashGiven.replace(/[^0-9]/g, "")) || 0;
  const change = cashAmount - total;

  const quickAmounts = [
    Math.ceil(total / 1000) * 1000,
    Math.ceil(total / 5000) * 5000,
    Math.ceil(total / 10000) * 10000,
    Math.ceil(total / 20000) * 20000,
  ]
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, 4);

  if (status === "processing") {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="font-bold text-foreground text-base">
          {lang === "mn" ? "Баталгаажуулж байна..." : "Confirming..."}
        </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
          <Icon name="CheckCircleIcon" size={44} className="text-success" />
        </div>
        <p className="font-bold text-success text-lg">
          {lang === "mn"
            ? "Бэлэн мөнгөөр баталгаажлаа!"
            : "Cash Payment Confirmed!"}
        </p>
        {change > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-3 text-center">
            <p className="text-xs text-amber-600 mb-1">
              {lang === "mn" ? "Буцаах мөнгө" : "Change"}
            </p>
            <p className="text-2xl font-bold text-amber-700 mono">
              {formatPrice(change)}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Total due */}
      <div className="bg-muted rounded-xl p-4 text-center">
        <p className="text-xs text-muted-foreground mb-1">
          {lang === "mn" ? "Нийт дүн" : "Amount Due"}
        </p>
        <p className="text-3xl font-bold text-primary mono">
          {formatPrice(total)}
        </p>
      </div>

      {/* Cash received input */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
          {lang === "mn" ? "Авсан мөнгө" : "Cash Received"}
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
            ₮
          </span>
          <input
            type="number"
            value={cashGiven}
            onChange={(e) => setCashGiven(e.target.value)}
            placeholder="0"
            className="w-full pl-8 pr-4 py-3 bg-card border-2 border-border rounded-xl text-lg font-bold text-foreground focus:outline-none focus:border-primary mono"
          />
        </div>
      </div>

      {/* Quick amount buttons */}
      <div className="grid grid-cols-4 gap-2">
        {quickAmounts.map((amt) => (
          <button
            key={amt}
            onClick={() => setCashGiven(amt.toString())}
            className={`py-2 rounded-lg text-xs font-bold border transition-standard ${
              cashAmount === amt
                ? "bg-primary text-white border-primary"
                : "bg-muted border-border text-foreground hover:border-primary"
            }`}
          >
            {(amt / 1000).toFixed(0)}K
          </button>
        ))}
      </div>

      {/* Change display */}
      {cashAmount > 0 && (
        <div
          className={`rounded-xl p-3 flex items-center justify-between ${change >= 0 ? "bg-success/10 border border-success/30" : "bg-destructive/10 border border-destructive/30"}`}
        >
          <span className="text-sm font-semibold text-foreground">
            {lang === "mn" ? "Буцаах мөнгө" : "Change"}
          </span>
          <span
            className={`text-lg font-bold mono ${change >= 0 ? "text-success" : "text-destructive"}`}
          >
            {change >= 0
              ? formatPrice(change)
              : `-${formatPrice(Math.abs(change))}`}
          </span>
        </div>
      )}

      <button
        onClick={onConfirm}
        disabled={cashAmount < total}
        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-standard disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Icon name="BanknotesIcon" size={18} />
        {lang === "mn"
          ? "Бэлэн мөнгөөр баталгаажуулах"
          : "Confirm Cash Payment"}
      </button>
    </div>
  );
}

// ── Receipt Options ────────────────────────────────────────────────────────────
function ReceiptOptions({
  selected,
  onChange,
  lang,
}: {
  selected: ReceiptType;
  onChange: (r: ReceiptType) => void;
  lang: "en" | "mn";
}) {
  const options: {
    id: ReceiptType;
    label: string;
    labelMn: string;
    icon: string;
    desc: string;
    descMn: string;
  }[] = [
    {
      id: "print",
      label: "Print Receipt",
      labelMn: "Хэвлэх",
      icon: "PrinterIcon",
      desc: "Paper receipt",
      descMn: "Цаасан баримт",
    },
    {
      id: "email",
      label: "Email",
      labelMn: "И-мэйл",
      icon: "EnvelopeIcon",
      desc: "Send to email",
      descMn: "И-мэйлээр илгээх",
    },
    {
      id: "sms",
      label: "SMS",
      labelMn: "SMS",
      icon: "DevicePhoneMobileIcon",
      desc: "Text message",
      descMn: "Мессеж",
    },
    {
      id: "none",
      label: "No Receipt",
      labelMn: "Баримтгүй",
      icon: "XMarkIcon",
      desc: "Skip",
      descMn: "Алгасах",
    },
  ];

  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        {lang === "mn" ? "Баримтын сонголт" : "Receipt Options"}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-standard ${
              selected === opt.id
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            <Icon name={opt.icon} size={18} />
            <span className="text-[10px] font-semibold text-center leading-tight">
              {lang === "mn" ? opt.labelMn : opt.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main PaymentPanel ──────────────────────────────────────────────────────────
export default function PaymentPanel({
  total,
  orderNumber,
  onSuccess,
  onCancel,
  lang = "en",
  compact = false,
}: PaymentPanelProps) {
  const [method, setMethod] = useState<PaymentMethod>("qpay");
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [receipt, setReceipt] = useState<ReceiptType>("print");
  const [customerType, setCustomerType] =
    useState<EbarimtCustomerType>("PERSONAL");
  const [organizationName, setOrganizationName] = useState("");
  const [organizationTin, setOrganizationTin] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [ebarimtError, setEbarimtError] = useState("");
  const [hotkeysEnabled, setHotkeysEnabled] = useState(true);

  const methods: {
    id: PaymentMethod;
    label: string;
    labelMn: string;
    icon: string;
    color: string;
  }[] = [
    {
      id: "qpay",
      label: "QPay QR",
      labelMn: "QPay QR",
      icon: "QrCodeIcon",
      color: "text-blue-600",
    },
    {
      id: "card",
      label: "Bank Card",
      labelMn: "Банкны карт",
      icon: "CreditCardIcon",
      color: "text-slate-600",
    },
    {
      id: "cash",
      label: "Cash",
      labelMn: "Бэлэн мөнгө",
      icon: "BanknotesIcon",
      color: "text-amber-600",
    },
  ];

  const handleSimulateQPay = () => {
    setStatus("processing");
    setTimeout(() => setStatus("success"), 2500);
  };

  const handleSimulateCard = () => {
    setStatus("processing");
    setTimeout(() => setStatus("success"), 3000);
  };

  const handleCashConfirm = () => {
    setStatus("processing");
    setTimeout(() => setStatus("success"), 1000);
  };

  const handleFinish = () => {
    if (customerType === "ORGANIZATION") {
      if (!organizationName.trim() || !organizationTin.trim()) {
        setEbarimtError(
          lang === "mn"
            ? "Байгууллагын нэр болон РД/ТТД оруулна уу."
            : "Please enter organization name and register/TIN.",
        );
        return;
      }
    }

    setEbarimtError("");
    onSuccess(method, receipt, {
      customerType,
      customerName:
        customerType === "ORGANIZATION"
          ? organizationName.trim()
          : undefined,
      customerTin:
        customerType === "ORGANIZATION" ? organizationTin.trim() : undefined,
      customerPhone: customerPhone.trim() || undefined,
    });
  };

  const handleRetry = () => {
    setStatus("idle");
  };

  useEffect(() => {
    setHotkeysEnabled(loadPrinterSettings().enableHotkeys);
  }, []);

  useEffect(() => {
    if (!hotkeysEnabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F1") {
        event.preventDefault();
        setMethod("qpay");
        setStatus("idle");
      }

      if (event.key === "F2") {
        event.preventDefault();
        setMethod("card");
        setStatus("idle");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [hotkeysEnabled]);

  const isProcessingOrDone =
    status === "processing" || status === "success" || status === "failed";

  return (
    <div className={`flex flex-col gap-4 ${compact ? "" : "p-1"}`}>
      {/* Payment Method Selector */}
      {!isProcessingOrDone && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {lang === "mn" ? "Төлбөрийн арга" : "Payment Method"}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setMethod(m.id);
                  setStatus("idle");
                }}
                className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl border-2 transition-standard ${
                  method === m.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${method === m.id ? "bg-primary text-white" : "bg-muted " + m.color}`}
                >
                  <Icon name={m.icon} size={18} />
                </div>
                <span
                  className={`text-xs font-semibold ${method === m.id ? "text-primary" : "text-foreground"}`}
                >
                  {lang === "mn" ? m.labelMn : m.label}
                </span>
              </button>
            ))}
          </div>
          {hotkeysEnabled ? (
            <p className="text-[11px] text-muted-foreground mt-2">Hotkeys: F1 = QPay, F2 = Card</p>
          ) : null}
        </div>
      )}

      {status !== "processing" && (
        <div className="rounded-2xl border border-border bg-card p-3.5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {lang === "mn" ? "Е-Баримтын төрөл" : "eBarimt customer type"}
            </p>
            {orderNumber ? (
              <span className="text-[11px] text-muted-foreground">
                {lang === "mn" ? "Захиалга" : "Order"}: {orderNumber}
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setCustomerType("PERSONAL");
                setEbarimtError("");
              }}
              className={`h-9 rounded-xl border text-xs font-semibold transition-standard ${
                customerType === "PERSONAL"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {lang === "mn" ? "Хувь хүн" : "Personal"}
            </button>
            <button
              onClick={() => {
                setCustomerType("ORGANIZATION");
                setEbarimtError("");
              }}
              className={`h-9 rounded-xl border text-xs font-semibold transition-standard ${
                customerType === "ORGANIZATION"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {lang === "mn" ? "Байгууллага" : "Organization"}
            </button>
          </div>

          {customerType === "ORGANIZATION" ? (
            <div className="grid grid-cols-1 gap-2">
              <input
                value={organizationName}
                onChange={(event) => {
                  setOrganizationName(event.target.value);
                  if (ebarimtError) setEbarimtError("");
                }}
                placeholder={lang === "mn" ? "Байгууллагын нэр" : "Organization name"}
                className="h-9 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
              <input
                value={organizationTin}
                onChange={(event) => {
                  setOrganizationTin(event.target.value);
                  if (ebarimtError) setEbarimtError("");
                }}
                placeholder={lang === "mn" ? "РД / ТТД" : "Register / TIN"}
                className="h-9 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </div>
          ) : null}

          <input
            value={customerPhone}
            onChange={(event) => setCustomerPhone(event.target.value)}
            placeholder={lang === "mn" ? "Утас (заавал биш)" : "Phone (optional)"}
            className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          />

          {ebarimtError ? (
            <p className="text-xs text-destructive">{ebarimtError}</p>
          ) : null}
        </div>
      )}

      {/* Payment State Display */}
      <div className="bg-muted/50 rounded-2xl p-4">
        {method === "qpay" && (
          <QPayQRDisplay
            total={total}
            status={status}
            onSimulate={handleSimulateQPay}
            lang={lang}
          />
        )}
        {method === "card" && (
          <BankPOSDisplay
            total={total}
            status={status}
            onSimulate={handleSimulateCard}
            lang={lang}
          />
        )}
        {method === "cash" && (
          <CashDisplay
            total={total}
            status={status}
            onConfirm={handleCashConfirm}
            lang={lang}
          />
        )}
      </div>

      {/* Receipt Options — show after success */}
      {status === "success" && (
        <ReceiptOptions selected={receipt} onChange={setReceipt} lang={lang} />
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {status === "idle" && method !== "cash" && (
          <>
            <button
              onClick={onCancel}
              className="flex-1 py-3 bg-muted hover:bg-border text-foreground font-semibold rounded-xl transition-standard text-sm"
            >
              {lang === "mn" ? "Буцах" : "Back"}
            </button>
            {method === "card" && (
              <button
                onClick={handleSimulateCard}
                className="flex-1 py-3 bg-primary text-white font-bold rounded-xl transition-standard text-sm flex items-center justify-center gap-2"
              >
                <Icon name="CreditCardIcon" size={16} />
                {lang === "mn" ? "Карт хүлээх" : "Start Card Reader"}
              </button>
            )}
          </>
        )}

        {status === "processing" && (
          <div className="flex-1 py-3 bg-muted rounded-xl flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
            {lang === "mn" ? "Боловсруулж байна..." : "Processing..."}
          </div>
        )}

        {status === "failed" && (
          <>
            <button
              onClick={handleRetry}
              className="flex-1 py-3 bg-primary text-white font-bold rounded-xl transition-standard text-sm"
            >
              {lang === "mn" ? "Дахин оролдох" : "Try Again"}
            </button>
            <button
              onClick={onCancel}
              className="flex-1 py-3 bg-muted text-foreground font-semibold rounded-xl transition-standard text-sm"
            >
              {lang === "mn" ? "Буцах" : "Back"}
            </button>
          </>
        )}

        {status === "success" && (
          <button
            onClick={handleFinish}
            className="flex-1 py-3 bg-success hover:bg-emerald-700 text-white font-bold rounded-xl transition-standard text-sm flex items-center justify-center gap-2"
          >
            <Icon name="CheckIcon" size={16} />
            {lang === "mn" ? "Дуусгах" : "Complete Order"}
          </button>
        )}
      </div>
    </div>
  );
}
