"use client";

import { useEffect, useState } from "react";
import { Printer, Keyboard } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_PRINTER_SETTINGS,
  type PrinterPaperWidth,
  type PrinterSettings,
  loadPrinterSettings,
  savePrinterSettings
} from "@/lib/printer-settings";

const PAPER_OPTIONS: Array<{ value: PrinterPaperWidth; label: string; desc: string }> = [
  { value: 58, label: "58mm", desc: "Compact POS receipt roll" },
  { value: 76, label: "76mm", desc: "Mid-size thermal roll" },
  { value: 80, label: "80mm", desc: "Standard restaurant thermal roll" }
];

export default function PrinterSetupPage() {
  const [settings, setSettings] = useState<PrinterSettings>(DEFAULT_PRINTER_SETTINGS);

  useEffect(() => {
    setSettings(loadPrinterSettings());
  }, []);

  const onSave = () => {
    savePrinterSettings(settings);
    toast.success("Printer тохиргоо хадгалагдлаа");
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <Printer className="w-6 h-6 text-primary" />
          Printer Setup
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Баримтын цаасны хэмжээ болон keyboard shortcut тохиргоо
        </p>
      </div>

      <div className="glass-card rounded-xl p-5 space-y-5 max-w-3xl">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Paper Width</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PAPER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSettings((prev) => ({ ...prev, paperWidthMm: option.value }))}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  settings.paperWidthMm === option.value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-semibold text-foreground">{option.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{option.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-foreground">Printer Name (optional)</span>
            <Input
              value={settings.printerName}
              onChange={(event) => setSettings((prev) => ({ ...prev, printerName: event.target.value }))}
              placeholder="EPSON-TM-T20III"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-foreground">Receipt Copies</span>
            <Input
              type="number"
              min={1}
              max={5}
              value={settings.copies}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  copies: Math.max(1, Math.min(5, Number(event.target.value) || 1))
                }))
              }
            />
          </label>
        </div>

        <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-2">
              <Keyboard className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Keyboard Hotkeys</p>
                <p className="text-xs text-muted-foreground">F1: QPay, F2: Card, F12: Print eBarimt</p>
              </div>
            </div>
            <Switch
              checked={settings.enableHotkeys}
              onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, enableHotkeys: checked }))}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onSave}
            className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
