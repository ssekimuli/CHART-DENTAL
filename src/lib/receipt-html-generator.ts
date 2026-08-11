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
  // Additional billing details
  subtotal?: number;
  totalBill?: number;
  insurancePortion?: number;
  patientPortion?: number;
  totalPaid?: number;
  balanceDue?: number;
  discount?: number;
  tax?: number;
  // Payment and branch information
  paymentMethod?: string;
  branchName?: string;
  // Lab order details
  labOrderDetails?: {
    item: string;
    client_name?: string;
    patient_name?: string;
    tooth?: string | number;
    material?: string;
    shade?: string;
    status?: string;
  };
  // Medicines/Prescriptions
  medicines?: Array<{
    name: string;
    unit?: string;
    quantity: number;
    price: number;
  }>;
}

export function generateReceiptHTML(info: ReceiptInfo, paperWidth: "58mm" | "80mm" = "58mm"): string {
  const charsPerLine = paperWidth === "58mm" ? 32 : 48;

  // Validate and sanitize input
  if (!info || typeof info !== "object") {
    throw new Error("Invalid receipt information");
  }

  const treatments = Array.isArray(info.treatments) ? info.treatments : [];
  const hasLabOrder = info.labOrderDetails && Object.keys(info.labOrderDetails).length > 0;
  const medicines = Array.isArray(info.medicines) ? info.medicines : [];

  if (treatments.length === 0 && !hasLabOrder && medicines.length === 0) {
    throw new Error("Receipt must have at least one treatment, lab order, or medicine");
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

  // Branch and payment method
  if (info.branchName) {
    html += line(`Branch: ${info.branchName}`);
  }
  if (info.paymentMethod) {
    html += line(`Payment: ${info.paymentMethod}`);
  }

  html += line();
  html += line(dashes);

  // Treatments, Lab Order, or Medicines
  if (treatments.length > 0) {
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
  } else if (hasLabOrder) {
    html += line("LAB ORDER");
    html += line("-".repeat(Math.floor(charsPerLine * 0.8)));

    const lab = info.labOrderDetails!;
    if (lab.client_name) {
      html += line(`Lab: ${String(lab.client_name).slice(0, Math.floor(charsPerLine * 0.8))}`);
    }
    if (lab.item) {
      html += line(`Item: ${String(lab.item).slice(0, Math.floor(charsPerLine * 0.8))}`);
    }
    if (lab.tooth) {
      html += line(`Tooth: #${lab.tooth}`);
    }
    if (lab.material) {
      html += line(`Material: ${String(lab.material).slice(0, Math.floor(charsPerLine * 0.8))}`);
    }
    if (lab.shade) {
      html += line(`Shade: ${String(lab.shade).slice(0, Math.floor(charsPerLine * 0.8))}`);
    }
    if (lab.status) {
      html += line(`Status: ${String(lab.status).slice(0, Math.floor(charsPerLine * 0.8))}`);
    }
  } else if (medicines.length > 0) {
    html += line("MEDICINES/PRESCRIPTIONS");
    html += line("-".repeat(Math.floor(charsPerLine * 0.8)));

    for (const medicine of medicines) {
      if (!medicine || !medicine.name) continue;

      const medicineName = String(medicine.name).slice(0, Math.floor(charsPerLine * 0.5));
      const qty = medicine.quantity || 0;
      const price = typeof medicine.price === "number" ? medicine.price : 0;
      const total = qty * price;
      const amount = formatAmount(total);
      const line2 = rightAlign(`${medicineName} x${qty}`, amount);
      html += line(line2);
    }
  }

  html += line();
  html += line(dashes);

  // Summary section with detailed billing info
  html += line("SUMMARY");
  html += line("-".repeat(Math.floor(charsPerLine * 0.8)));

  // Treatments Subtotal
  const subtotal = info.subtotal ?? totalAmount;
  html += line(rightAlign("Subtotal:", formatAmount(subtotal)));

  // Discount (if applicable)
  if (info.discount && info.discount > 0) {
    const discountAmount = subtotal * (info.discount / 100);
    html += line(rightAlign(`Discount (${info.discount}%)`, `-${formatAmount(discountAmount)}`));
  }

  // Tax (if applicable)
  if (info.tax && info.tax > 0) {
    let taxBase = subtotal;
    if (info.discount) {
      taxBase = subtotal * (1 - info.discount / 100);
    }
    const taxAmount = taxBase * (info.tax / 100);
    html += line(rightAlign(`Tax (${info.tax}%)`, formatAmount(taxAmount)));
  }

  // Total Bill
  const totalBill = info.totalBill ?? totalAmount;
  html += line(rightAlign("TOTAL BILL:", formatAmount(totalBill)));

  html += line();

  // Insurance & Patient portions
  if (info.insurancePortion !== undefined && info.insurancePortion > 0) {
    html += line(rightAlign("Insurance Portion:", formatAmount(info.insurancePortion)));
  }

  if (info.patientPortion !== undefined && info.patientPortion > 0) {
    html += line(rightAlign("Patient Portion:", formatAmount(info.patientPortion)));
  }

  html += line();

  // Payment information
  if (info.totalPaid !== undefined && info.totalPaid > 0) {
    html += line(rightAlign("Total Paid:", `-${formatAmount(info.totalPaid)}`));
  }

  if (info.balanceDue !== undefined) {
    const balanceColor = info.balanceDue > 0 ? "DUE" : "PAID";
    html += line(rightAlign(`Balance ${balanceColor}:`, formatAmount(Math.abs(info.balanceDue))));
  }

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
