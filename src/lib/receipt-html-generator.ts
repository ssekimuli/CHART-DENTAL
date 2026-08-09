// Receipt HTML Generator
// Generates formatted HTML for thermal printer receipts

import { getCurrencyConfig } from "./currency";

export interface ReceiptInfo {
  clinicName: string;
  clinicPhone?: string;
  clinicAddress?: string;
  patientName: string;
  patientPhone?: string;
  date: string;
  billNumber: string;
  treatments: Array<{
    name: string;
    amount: number;
  }>;
  notes?: string;
  currencyCode?: string;
}

export function generateReceiptHTML(info: ReceiptInfo, paperWidth: "58mm" | "80mm" = "58mm"): string {
  const charsPerLine = paperWidth === "58mm" ? 32 : 48;

  // Validate and sanitize input
  if (!info || typeof info !== "object") {
    throw new Error("Invalid receipt information");
  }

  const treatments = Array.isArray(info.treatments) ? info.treatments : [];
  if (treatments.length === 0) {
    throw new Error("Receipt must have at least one treatment");
  }

  // Get currency config
  const currencyConfig = getCurrencyConfig();
  const currencySymbol = currencyConfig.symbol;

  // Format amount with currency
  const formatAmount = (amount: number): string => {
    const formattedNum = amount.toLocaleString(currencyConfig.locale, {
      minimumFractionDigits: currencyConfig.digits,
      maximumFractionDigits: currencyConfig.digits,
    });

    if (["UGX", "KES", "TZS", "RWF", "BIF", "CDF", "SOS"].includes(currencyConfig.code)) {
      return `${currencySymbol} ${formattedNum}`;
    }
    return `${currencySymbol}${formattedNum}`;
  };

  // Calculate totals
  const totalAmount = treatments.reduce((sum, t) => {
    const amount = typeof t.amount === "number" ? t.amount : 0;
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  const now = new Date().toLocaleTimeString();

  const line = (text: string = ""): string => {
    return `<div style="white-space: pre; font-family: monospace; font-size: 12px;">${text.padEnd(charsPerLine)}</div>`;
  };

  const centerText = (text: string): string => {
    const padding = Math.max(0, Math.floor((charsPerLine - text.length) / 2));
    return " ".repeat(padding) + text;
  };

  const rightAlign = (label: string, value: string): string => {
    const available = charsPerLine - 2;
    const labelTrim = label.slice(0, Math.floor(available * 0.6));
    const valueTrim = value.slice(0, Math.floor(available * 0.4));
    const spacer = " ".repeat(available - labelTrim.length - valueTrim.length);
    return labelTrim + spacer + valueTrim;
  };

  const dashes = "-".repeat(charsPerLine);

  let html = "";

  // Header
  html += line(centerText(info.clinicName));
  html += line(centerText("═".repeat(Math.min(charsPerLine, info.clinicName.length))));
  html += line();

  if (info.clinicPhone) {
    html += line(centerText(info.clinicPhone));
  }

  if (info.clinicAddress) {
    html += line(centerText(info.clinicAddress));
  }

  html += line();
  html += line(dashes);

  // Bill info
  html += line(`Date: ${info.date}`);
  html += line(`Time: ${now}`);
  html += line(`Bill #: ${info.billNumber}`);

  html += line();
  html += line(dashes);

  // Patient info
  html += line(`Patient: ${info.patientName}`);
  if (info.patientPhone) {
    html += line(`Phone: ${info.patientPhone}`);
  }

  html += line();
  html += line(dashes);

  // Treatments
  html += line("TREATMENTS");
  html += line("-".repeat(Math.floor(charsPerLine * 0.8)));

  for (const treatment of treatments) {
    if (!treatment || !treatment.name) continue;

    const treatmentName = String(treatment.name).slice(0, Math.floor(charsPerLine * 0.6));
    const amount = typeof treatment.amount === "number"
      ? formatAmount(treatment.amount)
      : formatAmount(0);
    const line2 = rightAlign(treatmentName, amount);
    html += line(line2);
  }

  html += line();
  html += line(dashes);

  // Total
  const totalLine = rightAlign("TOTAL", formatAmount(totalAmount));
  html += line(totalLine);

  html += line();
  html += line(dashes);

  // Footer
  html += line();
  html += line(centerText("Thank you for your visit!"));
  html += line();
  html += line(centerText("═".repeat(Math.floor(charsPerLine * 0.8))));
  html += line();

  if (info.notes) {
    html += line(info.notes);
  }

  return html;
}

/**
 * Simple receipt with minimal info
 */
export function generateSimpleReceiptHTML(
  clinicName: string,
  patientName: string,
  treatmentType: string,
  amount: number,
  billNumber: string,
  date: string,
  paperWidth: "58mm" | "80mm" = "58mm"
): string {
  return generateReceiptHTML(
    {
      clinicName,
      patientName,
      treatments: [{ name: treatmentType, amount }],
      billNumber,
      date,
    },
    paperWidth
  );
}

/**
 * Escape HTML special characters
 */
export function escapeHTML(text: string): string {
  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
