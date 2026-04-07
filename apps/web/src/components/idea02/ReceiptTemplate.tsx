"use client";

import { useRef } from "react";
import Icon from "@/components/idea02/AppIcon";

// ── Types ──────────────────────────────────────────────────────────────────────
export interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
  size?: string;
  addons?: string[];
}

export interface ReceiptData {
  orderNumber: string;
  orderType: "dine-in" | "takeaway";
  tableNumber?: string;
  paymentMethod: "qpay" | "card" | "cash";
  receiptType: "print" | "email" | "sms" | "none";
  items: ReceiptItem[];
  subtotal: number;
  tax?: number;
  total: number;
  customerName?: string;
  customerPhone?: string;
  timestamp: Date;
  lang?: "en" | "mn";
}

interface ReceiptTemplateProps {
  data: ReceiptData;
  onClose?: () => void;
  onNewOrder?: () => void;
}

const formatPrice = (p: number) => `₮${p.toLocaleString()}`;

const formatDate = (d: Date) => {
  return d.toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const formatTime = (d: Date) => {
  return d.toLocaleTimeString("mn-MN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const PAYMENT_LABELS: Record<string, { en: string; mn: string }> = {
  qpay: { en: "QPay", mn: "QPay" },
  card: { en: "Bank Card (POS)", mn: "Банкны карт (POS)" },
  cash: { en: "Cash", mn: "Бэлэн мөнгө" },
};

const ORDER_TYPE_LABELS: Record<string, { en: string; mn: string }> = {
  "dine-in": { en: "Dine In", mn: "Ресторанд" },
  takeaway: { en: "Takeaway", mn: "Авч явах" },
};

export default function ReceiptTemplate({
  data,
  onClose,
  onNewOrder,
}: ReceiptTemplateProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const lang = data.lang ?? "en";
  const t = (en: string, mn: string) => (lang === "mn" ? mn : en);

  const tax = data.tax ?? Math.round(data.subtotal * 0.1);
  const total = data.total;

  const handleExportPDF = async () => {
    if (!receiptRef.current) return;

    // Use browser print for PDF export (works without external libraries)
    const printContent = receiptRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=400,height=700");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Receipt - ${data.orderNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 12px;
              color: #1e293b;
              background: white;
              padding: 16px;
              max-width: 320px;
              margin: 0 auto;
            }
            .receipt-header { text-align: center; margin-bottom: 12px; }
            .receipt-logo { font-size: 20px; font-weight: 900; letter-spacing: 2px; }
            .receipt-subtitle { font-size: 10px; color: #64748b; margin-top: 2px; }
            .divider { border: none; border-top: 1px dashed #cbd5e1; margin: 10px 0; }
            .divider-solid { border: none; border-top: 2px solid #1e293b; margin: 10px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .row-label { color: #64748b; font-size: 10px; }
            .row-value { font-weight: 600; font-size: 11px; }
            .item-row { margin-bottom: 6px; }
            .item-name { font-weight: 600; }
            .item-detail { color: #64748b; font-size: 10px; padding-left: 8px; }
            .item-price { text-align: right; font-weight: 700; }
            .total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; margin-top: 4px; }
            .total-amount { color: #0066cc; }
            .footer { text-align: center; margin-top: 12px; font-size: 10px; color: #94a3b8; }
            .badge { display: inline-block; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 10px; }
            .order-number { font-size: 22px; font-weight: 900; text-align: center; letter-spacing: 3px; color: #0066cc; margin: 8px 0; }
            @media print {
              body { padding: 0; }
              @page { margin: 8mm; size: 80mm auto; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-header">
            <div class="receipt-logo">BIQ</div>
            <div class="receipt-subtitle">${t("Restaurant Management System", "Ресторан Удирдлагын Систем")}</div>
            <div class="receipt-subtitle">Ulaanbaatar, Mongolia</div>
          </div>
          <hr class="divider-solid" />
          <div class="row">
            <span class="row-label">${t("Date", "Огноо")}</span>
            <span class="row-value">${formatDate(data.timestamp)}</span>
          </div>
          <div class="row">
            <span class="row-label">${t("Time", "Цаг")}</span>
            <span class="row-value">${formatTime(data.timestamp)}</span>
          </div>
          <div class="row">
            <span class="row-label">${t("Order Type", "Захиалгын төрөл")}</span>
            <span class="row-value">${t(ORDER_TYPE_LABELS[data.orderType].en, ORDER_TYPE_LABELS[data.orderType].mn)}</span>
          </div>
          ${data.tableNumber ? `<div class="row"><span class="row-label">${t("Table", "Ширээ")}</span><span class="row-value">${data.tableNumber}</span></div>` : ""}
          ${data.customerName ? `<div class="row"><span class="row-label">${t("Customer", "Харилцагч")}</span><span class="row-value">${data.customerName}</span></div>` : ""}
          ${data.customerPhone ? `<div class="row"><span class="row-label">${t("Phone", "Утас")}</span><span class="row-value">${data.customerPhone}</span></div>` : ""}
          <div class="order-number">#${data.orderNumber}</div>
          <hr class="divider" />
          <div style="margin-bottom:8px;font-size:10px;font-weight:700;text-transform:uppercase;color:#64748b;">${t("Items Ordered", "Захиалсан зүйлс")}</div>
          ${data.items
            .map(
              (item) => `
            <div class="item-row">
              <div class="row">
                <span class="item-name">${item.qty}× ${item.name}${item.size ? ` (${item.size})` : ""}</span>
                <span class="item-price">${formatPrice(item.price * item.qty)}</span>
              </div>
              ${item.addons && item.addons.length > 0 ? `<div class="item-detail">+ ${item.addons.join(", ")}</div>` : ""}
              <div class="item-detail">${formatPrice(item.price)} ${t("each", "тус бүр")}</div>
            </div>
          `,
            )
            .join("")}
          <hr class="divider" />
          <div class="row">
            <span class="row-label">${t("Subtotal", "Дүн")}</span>
            <span class="row-value">${formatPrice(data.subtotal)}</span>
          </div>
          <div class="row">
            <span class="row-label">${t("VAT (10%)", "НӨАТ (10%)")}</span>
            <span class="row-value">${formatPrice(tax)}</span>
          </div>
          <hr class="divider-solid" />
          <div class="total-row">
            <span>${t("TOTAL", "НИЙТ")}</span>
            <span class="total-amount">${formatPrice(total)}</span>
          </div>
          <hr class="divider" />
          <div class="row">
            <span class="row-label">${t("Payment Method", "Төлбөрийн арга")}</span>
            <span class="row-value">${t(PAYMENT_LABELS[data.paymentMethod].en, PAYMENT_LABELS[data.paymentMethod].mn)}</span>
          </div>
          <div class="row">
            <span class="row-label">${t("Status", "Төлөв")}</span>
            <span class="row-value" style="color:#16a34a;">✓ ${t("PAID", "ТӨЛӨГДСӨН")}</span>
          </div>
          <hr class="divider" />
          <div class="footer">
            <p>${t("Thank you for dining with us!", "Манай ресторанд ирсэнд баярлалаа!")}</p>
            <p style="margin-top:4px;">${t("Please come again", "Дахин ирнэ үү")}</p>
            <p style="margin-top:8px;font-size:9px;">BIQ POS v1.0 · ${t("Powered by BIQ", "BIQ системээр")}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Action Bar */}
        <div className="bg-slate-900 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="DocumentTextIcon" size={18} className="text-white/70" />
            <span className="text-white font-semibold text-sm">
              {t("Receipt", "Баримт")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all"
            >
              <Icon name="ArrowDownTrayIcon" size={14} />
              {t("Export PDF", "PDF татах")}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
              >
                <Icon name="XMarkIcon" size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Receipt Body */}
        <div
          ref={receiptRef}
          className="bg-white p-6 font-mono text-slate-800 text-sm"
        >
          {/* Header */}
          <div className="text-center mb-5">
            <div className="text-2xl font-black tracking-widest text-slate-900">
              BIQ
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {t("Restaurant Management System", "Ресторан Удирдлагын Систем")}
            </div>
            <div className="text-xs text-slate-400">Ulaanbaatar, Mongolia</div>
          </div>

          {/* Double line */}
          <div className="border-t-2 border-b border-slate-800 mb-1" />
          <div className="border-t border-slate-300 mb-4" />

          {/* Order Info */}
          <div className="space-y-1.5 mb-4">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">{t("Date", "Огноо")}</span>
              <span className="font-semibold">
                {formatDate(data.timestamp)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">{t("Time", "Цаг")}</span>
              <span className="font-semibold">
                {formatTime(data.timestamp)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">
                {t("Order Type", "Захиалгын төрөл")}
              </span>
              <span className="font-semibold">
                {t(
                  ORDER_TYPE_LABELS[data.orderType].en,
                  ORDER_TYPE_LABELS[data.orderType].mn,
                )}
              </span>
            </div>
            {data.tableNumber && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">{t("Table", "Ширээ")}</span>
                <span className="font-semibold">{data.tableNumber}</span>
              </div>
            )}
            {data.customerName && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">
                  {t("Customer", "Харилцагч")}
                </span>
                <span className="font-semibold">{data.customerName}</span>
              </div>
            )}
            {data.customerPhone && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">{t("Phone", "Утас")}</span>
                <span className="font-semibold">{data.customerPhone}</span>
              </div>
            )}
          </div>

          {/* Order Number */}
          <div className="text-center my-4">
            <div className="text-xs text-slate-500 mb-1">
              {t("ORDER NUMBER", "ЗАХИАЛГЫН ДУГААР")}
            </div>
            <div className="text-3xl font-black tracking-widest text-blue-700">
              #{data.orderNumber}
            </div>
          </div>

          <div className="border-t border-dashed border-slate-300 my-3" />

          {/* Items */}
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {t("Items Ordered", "Захиалсан зүйлс")}
          </div>
          <div className="space-y-2.5 mb-4">
            {data.items.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-2">
                    <span className="font-bold text-xs text-slate-800">
                      {item.qty}× {item.name}
                      {item.size ? (
                        <span className="font-normal text-slate-500">
                          {" "}
                          ({item.size})
                        </span>
                      ) : null}
                    </span>
                    {item.addons && item.addons.length > 0 && (
                      <div className="text-[10px] text-slate-400 pl-3">
                        + {item.addons.join(", ")}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400 pl-3">
                      {formatPrice(item.price)} {t("each", "тус бүр")}
                    </div>
                  </div>
                  <span className="font-bold text-xs text-slate-800 whitespace-nowrap">
                    {formatPrice(item.price * item.qty)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-slate-300 my-3" />

          {/* Totals */}
          <div className="space-y-1.5 mb-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">{t("Subtotal", "Дүн")}</span>
              <span className="font-semibold">
                {formatPrice(data.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">
                {t("VAT (10%)", "НӨАТ (10%)")}
              </span>
              <span className="font-semibold">{formatPrice(tax)}</span>
            </div>
          </div>

          <div className="border-t-2 border-slate-800 mb-3" />

          <div className="flex justify-between items-center mb-4">
            <span className="text-base font-black uppercase tracking-wide">
              {t("TOTAL", "НИЙТ")}
            </span>
            <span className="text-xl font-black text-blue-700">
              {formatPrice(total)}
            </span>
          </div>

          <div className="border-t border-dashed border-slate-300 my-3" />

          {/* Payment Info */}
          <div className="space-y-1.5 mb-4">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">
                {t("Payment Method", "Төлбөрийн арга")}
              </span>
              <span className="font-semibold">
                {t(
                  PAYMENT_LABELS[data.paymentMethod].en,
                  PAYMENT_LABELS[data.paymentMethod].mn,
                )}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">{t("Status", "Төлөв")}</span>
              <span className="font-bold text-green-600">
                ✓ {t("PAID", "ТӨЛӨГДСӨН")}
              </span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-300 my-3" />

          {/* Footer */}
          <div className="text-center space-y-1">
            <p className="text-xs text-slate-600 font-medium">
              {t(
                "Thank you for dining with us!",
                "Манай ресторанд ирсэнд баярлалаа!",
              )}
            </p>
            <p className="text-xs text-slate-400">
              {t("Please come again", "Дахин ирнэ үү")}
            </p>
            <p className="text-[10px] text-slate-300 mt-2">BIQ POS v1.0</p>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-4 flex gap-3">
          <button
            onClick={handleExportPDF}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all"
          >
            <Icon name="ArrowDownTrayIcon" size={16} />
            {t("Export PDF", "PDF татах")}
          </button>
          {onNewOrder && (
            <button
              onClick={onNewOrder}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-xl transition-all"
            >
              <Icon name="PlusCircleIcon" size={16} />
              {t("New Order", "Шинэ захиалга")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
