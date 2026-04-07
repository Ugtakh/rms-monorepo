export type PrinterPaperWidth = 58 | 76 | 80;

export interface PrinterSettings {
  paperWidthMm: PrinterPaperWidth;
  copies: number;
  enableHotkeys: boolean;
  printerName: string;
}

const STORAGE_KEY = "rms_printer_settings_v1";

export const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
  paperWidthMm: 80,
  copies: 1,
  enableHotkeys: true,
  printerName: ""
};

function sanitize(raw: unknown): PrinterSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_PRINTER_SETTINGS;

  const source = raw as Record<string, unknown>;
  const paperWidthMm =
    source.paperWidthMm === 58 || source.paperWidthMm === 76 || source.paperWidthMm === 80
      ? source.paperWidthMm
      : DEFAULT_PRINTER_SETTINGS.paperWidthMm;

  const copiesNum = Number(source.copies);
  const copies = Number.isFinite(copiesNum) && copiesNum >= 1 && copiesNum <= 5
    ? Math.floor(copiesNum)
    : DEFAULT_PRINTER_SETTINGS.copies;

  return {
    paperWidthMm,
    copies,
    enableHotkeys: Boolean(source.enableHotkeys ?? DEFAULT_PRINTER_SETTINGS.enableHotkeys),
    printerName: typeof source.printerName === "string" ? source.printerName : ""
  };
}

export function loadPrinterSettings(): PrinterSettings {
  if (typeof window === "undefined") return DEFAULT_PRINTER_SETTINGS;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PRINTER_SETTINGS;
    return sanitize(JSON.parse(raw));
  } catch {
    return DEFAULT_PRINTER_SETTINGS;
  }
}

export function savePrinterSettings(input: PrinterSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitize(input)));
}
