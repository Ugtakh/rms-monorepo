"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import type { EbarimtReceiptRecord } from "@/types/rms";
import { DEFAULT_PRINTER_SETTINGS, loadPrinterSettings } from "@/lib/printer-settings";

interface EbarimtReceiptDialogProps {
  open: boolean;
  receipt: EbarimtReceiptRecord | null;
  orderNo?: string;
  onClose: () => void;
}

function formatMoney(value: number): string {
  return `${Math.round(value).toLocaleString("mn-MN")}₮`;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return date.toLocaleString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function buildQrPattern(seed: string, size = 21): boolean[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  const cells: boolean[] = [];
  for (let i = 0; i < size * size; i += 1) {
    const x = i % size;
    const y = Math.floor(i / size);
    const finderZone =
      (x < 7 && y < 7) ||
      (x >= size - 7 && y < 7) ||
      (x < 7 && y >= size - 7);

    if (finderZone) {
      const innerX = x < 7 ? x : x - (size - 7);
      const innerY = y < 7 ? y : y - (size - 7);
      const ring = innerX === 0 || innerY === 0 || innerX === 6 || innerY === 6;
      const center = innerX >= 2 && innerX <= 4 && innerY >= 2 && innerY <= 4;
      cells.push(ring || center);
      continue;
    }

    const v = (hash + x * 97 + y * 37 + i * 17) % 11;
    cells.push(v <= 4);
  }

  return cells;
}

export default function EbarimtReceiptDialog({
  open,
  receipt,
  orderNo,
  onClose
}: EbarimtReceiptDialogProps) {
  const [printerSettings, setPrinterSettings] = useState(DEFAULT_PRINTER_SETTINGS);
  const printButtonRef = useRef<HTMLButtonElement | null>(null);
  const qr = useMemo(() => buildQrPattern(receipt?.qrText ?? ""), [receipt?.qrText]);
  const logoFallback = receipt?.merchant.organizationName?.slice(0, 2).toUpperCase() ?? "RM";
  const logoUrl = receipt?.merchant.logoUrl ?? process.env.NEXT_PUBLIC_ORG_LOGO_URL;

  useEffect(() => {
    if (!open) return;
    setPrinterSettings(loadPrinterSettings());
  }, [open]);

  const handlePrint = useCallback(() => {
    if (!receipt) return;

    const activeReceipt = receipt;
    const paperWidthMm = printerSettings.paperWidthMm;
    const paperCssWidth = `${paperWidthMm}mm`;
    const copyCount = Math.max(1, printerSettings.copies);

    const singleReceiptMarkup = `
        <div class="center">
          <div class="logo">${logoFallback}</div>
          <div class="title">${activeReceipt.merchant.organizationName}</div>
          <div class="small">${activeReceipt.merchant.branchName}</div>
          <div class="small">${activeReceipt.merchant.address ?? ""}</div>
        </div>
        <div class="line"></div>
        <div class="row"><span>Баримт №</span><span>${activeReceipt.receiptNo}</span></div>
        <div class="row"><span>Огноо</span><span>${formatDateTime(activeReceipt.createdAt)}</span></div>
        <div class="row"><span>Захиалга</span><span>${orderNo ?? activeReceipt.order.orderNo}</span></div>
        <div class="row"><span>ДДТД</span><span>${activeReceipt.serialNo}</span></div>
        <div class="row"><span>Сугалааны код</span><span>${activeReceipt.lotteryCode}</span></div>
        <div class="row"><span>Худалдан авагч</span><span>${activeReceipt.customerType === "ORGANIZATION" ? "Байгууллага" : "Хувь хүн"}</span></div>
        ${activeReceipt.customerType === "ORGANIZATION" ? `<div class="row"><span>Нэр</span><span>${activeReceipt.customerName ?? ""}</span></div>` : ""}
        ${activeReceipt.customerType === "ORGANIZATION" ? `<div class="row"><span>РД/ТТД</span><span>${activeReceipt.customerTin ?? ""}</span></div>` : ""}
        <div class="line"></div>
        <table>
          <thead>
            <tr>
              <th>Бараа</th>
              <th class="right">Тоо</th>
              <th class="right">Үнэ</th>
              <th class="right">Дүн</th>
            </tr>
          </thead>
          <tbody>
            ${activeReceipt.items
              .map(
                (item) =>
                  `<tr><td>${item.itemName}</td><td class="right">${item.quantity}</td><td class="right">${Math.round(item.unitPrice).toLocaleString("mn-MN")}</td><td class="right">${Math.round(item.lineTotal).toLocaleString("mn-MN")}</td></tr>`
              )
              .join("")}
          </tbody>
        </table>
        <div class="line"></div>
        <div class="row"><span>НИЙТ ДҮН</span><span>${formatMoney(activeReceipt.summary.subtotal)}</span></div>
        <div class="row"><span>НӨАТ</span><span>${formatMoney(activeReceipt.summary.vatAmount)}</span></div>
        <div class="row"><span>Үйлчилгээ</span><span>${formatMoney(activeReceipt.summary.serviceAmount)}</span></div>
        <div class="row total"><span>ТӨЛӨХ ДҮН</span><span>${formatMoney(activeReceipt.summary.paidAmount)}</span></div>
        <div class="line"></div>
        <div class="center small">ebarimt.mn</div>
        <div class="center qr-note">${activeReceipt.qrText}</div>
      `;

    const allCopies = Array.from({ length: copyCount }, () => singleReceiptMarkup).join(
      '<div style="page-break-after: always;"></div>'
    );

    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>eBarimt ${activeReceipt.receiptNo}</title>
        <style>
          body { font-family: 'Courier New', monospace; width: ${paperCssWidth}; margin: 0 auto; padding: 8px; color: #0f172a; }
          .center { text-align: center; }
          .logo { width: 38px; height: 38px; border-radius: 999px; margin: 0 auto 6px; background: #e2e8f0; display:flex; align-items:center; justify-content:center; font-weight:700; }
          .title { font-size: 18px; font-weight: 800; }
          .small { font-size: 11px; color: #334155; }
          .line { border-top: 1px dashed #94a3b8; margin: 8px 0; }
          .row { display:flex; justify-content: space-between; font-size: 12px; margin: 2px 0; }
          .th { font-weight: 700; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { text-align: left; padding: 3px 0; border-bottom: 1px dotted #cbd5e1; }
          .right { text-align: right; }
          .total { font-size: 15px; font-weight: 800; }
          .qr-note { word-break: break-all; font-size: 10px; color: #475569; margin-top: 6px; }
          @media print { @page { size: ${paperCssWidth} auto; margin: 6mm; } }
        </style>
      </head>
      <body>
        ${allCopies}
      </body>
      </html>
    `;

    const w = window.open("", "_blank", "width=420,height=900");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    window.setTimeout(() => {
      w.print();
      w.close();
    }, 200);
  }, [logoFallback, orderNo, printerSettings.copies, printerSettings.paperWidthMm, receipt]);

  useEffect(() => {
    if (!open || !receipt || !printerSettings.enableHotkeys) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F12") {
        event.preventDefault();
        printButtonRef.current?.click();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, receipt, printerSettings.enableHotkeys]);

  if (!open || !receipt) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-foreground/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Е-Баримт</h3>
          <span className="text-[11px] text-muted-foreground">{printerSettings.paperWidthMm}mm</span>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-md border border-border text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mx-auto" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="text-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={receipt.merchant.organizationName}
                className="w-12 h-12 rounded-full mx-auto object-cover border border-border"
              />
            ) : (
              <div className="w-12 h-12 rounded-full mx-auto bg-muted border border-border flex items-center justify-center text-sm font-semibold text-foreground">
                {logoFallback}
              </div>
            )}
            <p className="mt-2 text-sm font-semibold text-foreground">{receipt.merchant.organizationName}</p>
            <p className="text-xs text-muted-foreground">{receipt.merchant.branchName}</p>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-2.5 space-y-1 text-xs">
            <div className="flex justify-between"><span>Баримт №</span><span>{receipt.receiptNo}</span></div>
            <div className="flex justify-between"><span>Огноо</span><span>{formatDateTime(receipt.createdAt)}</span></div>
            <div className="flex justify-between"><span>Захиалга</span><span>{orderNo ?? receipt.order.orderNo}</span></div>
            <div className="flex justify-between"><span>ДДТД</span><span>{receipt.serialNo}</span></div>
            <div className="flex justify-between"><span>Сугалаа</span><span>{receipt.lotteryCode}</span></div>
            <div className="flex justify-between">
              <span>Төрөл</span>
              <span>{receipt.customerType === "ORGANIZATION" ? "Байгууллага" : "Хувь хүн"}</span>
            </div>
            {receipt.customerType === "ORGANIZATION" ? (
              <>
                <div className="flex justify-between gap-2">
                  <span>Нэр</span>
                  <span className="text-right">{receipt.customerName || "-"}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>РД/ТТД</span>
                  <span className="text-right">{receipt.customerTin || "-"}</span>
                </div>
              </>
            ) : null}
          </div>

          <div className="rounded-lg border border-border p-2.5">
            <div className="grid grid-cols-[1fr_36px_68px] text-[11px] font-semibold text-muted-foreground mb-1">
              <span>Бараа</span>
              <span className="text-right">Тоо</span>
              <span className="text-right">Дүн</span>
            </div>
            <div className="space-y-1.5">
              {receipt.items.map((item, idx) => (
                <div key={`${item.itemName}-${idx}`} className="grid grid-cols-[1fr_36px_68px] text-xs">
                  <span className="truncate">{item.itemName}</span>
                  <span className="text-right">{item.quantity}</span>
                  <span className="text-right">{formatMoney(item.lineTotal)}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-dashed border-border text-xs space-y-1">
              <div className="flex justify-between"><span>НИЙТ ДҮН</span><span>{formatMoney(receipt.summary.subtotal)}</span></div>
              <div className="flex justify-between"><span>НӨАТ</span><span>{formatMoney(receipt.summary.vatAmount)}</span></div>
              <div className="flex justify-between"><span>Үйлчилгээ</span><span>{formatMoney(receipt.summary.serviceAmount)}</span></div>
              <div className="flex justify-between font-semibold text-sm"><span>ТӨЛӨХ ДҮН</span><span>{formatMoney(receipt.summary.paidAmount)}</span></div>
            </div>
          </div>

          <div className="rounded-lg border border-border p-3">
            <div
              className="mx-auto grid gap-0.5 bg-white p-2 border border-border"
              style={{ gridTemplateColumns: "repeat(21, minmax(0, 1fr))", width: 164 }}
            >
              {qr.map((cell, idx) => (
                <span key={idx} className={`w-1.5 h-1.5 ${cell ? "bg-black" : "bg-white"}`} />
              ))}
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground break-all text-center">{receipt.qrText}</p>
          </div>

          <button
            ref={printButtonRef}
            type="button"
            onClick={handlePrint}
            className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
          >
            Баримт хэвлэх (F12)
          </button>
        </div>
      </div>
    </div>
  );
}
