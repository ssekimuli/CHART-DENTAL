// Thermal Printer Utilities
// Common helper functions for printer operations

import { getPrinterService } from "./bluetooth-printer";
import { generateReceiptBytes, type ReceiptData } from "./escpos-printer";

/**
 * Check if the browser supports Web Serial API for printer connectivity
 */
export function isPrinterSupported(): boolean {
  return !!(navigator as any).serial;
}

/**
 * Get the current printer connection status
 */
export function getPrinterStatus() {
  const printerService = getPrinterService();
  return {
    isConnected: printerService.getConnectionStatus(),
    device: printerService.getConnectedDevice(),
  };
}

/**
 * Connect to a Bluetooth printer
 * @param size - Paper width: "58mm" or "80mm"
 * @returns true if connection successful
 */
export async function connectToPrinter(size: "58mm" | "80mm"): Promise<boolean> {
  try {
    const printerService = getPrinterService();

    // Request port from user
    const portSelected = await printerService.requestPort();
    if (!portSelected) {
      throw new Error("No printer selected");
    }

    // Connect to the selected port
    const connected = await printerService.connect();
    if (!connected) {
      throw new Error("Failed to connect to printer");
    }

    // Save for future use
    try {
      const device = printerService.getConnectedDevice();
      if (device) {
        localStorage.setItem("connected_printer", JSON.stringify(device));
        localStorage.setItem("printer_size", size);
      }
    } catch {
      // Storage error, but connection is still valid
    }

    return true;
  } catch (error) {
    console.error("Printer connection failed:", error);
    throw error;
  }
}

/**
 * Disconnect from current printer
 */
export async function disconnectPrinter(): Promise<void> {
  try {
    const printerService = getPrinterService();
    await printerService.disconnect();

    // Clear saved connection
    try {
      localStorage.removeItem("connected_printer");
      localStorage.removeItem("printer_size");
    } catch {
      // Storage error, but disconnection still happened
    }
  } catch (error) {
    console.error("Failed to disconnect printer:", error);
    throw error;
  }
}

/**
 * Send receipt to printer
 * @param data - Receipt data to print
 * @param size - Paper width (optional, uses saved size or defaults to 58mm)
 */
export async function printReceipt(
  data: ReceiptData,
  size?: "58mm" | "80mm"
): Promise<boolean> {
  try {
    const printerService = getPrinterService();

    if (!printerService.getConnectionStatus()) {
      throw new Error("Printer not connected");
    }

    // Get printer size from parameter or localStorage
    let paperSize = size;
    if (!paperSize) {
      const saved = localStorage.getItem("printer_size");
      paperSize = (saved as any) || "58mm";
    }

    // Generate receipt bytes
    const receiptBytes = generateReceiptBytes({
      ...data,
      printerSize: paperSize,
    });

    // Send to printer
    await printerService.print(receiptBytes);
    return true;
  } catch (error) {
    console.error("Print failed:", error);
    throw error;
  }
}

/**
 * Send raw bytes directly to printer
 * @param data - Raw bytes to send
 */
export async function sendRawBytes(data: Uint8Array): Promise<void> {
  const printerService = getPrinterService();

  if (!printerService.getConnectionStatus()) {
    throw new Error("Printer not connected");
  }

  await printerService.sendData(data);
}

/**
 * Get saved printer configuration
 */
export function getSavedPrinterConfig() {
  try {
    const device = localStorage.getItem("connected_printer");
    const size = localStorage.getItem("printer_size");

    return {
      device: device ? JSON.parse(device) : null,
      size: (size as "58mm" | "80mm") || "58mm",
    };
  } catch {
    return {
      device: null,
      size: "58mm" as const,
    };
  }
}

/**
 * Clear all saved printer data
 */
export function clearPrinterConfig(): void {
  try {
    localStorage.removeItem("connected_printer");
    localStorage.removeItem("printer_size");
  } catch {
    // Ignore storage errors
  }
}

/**
 * Print a simple test pattern
 */
export async function printTestPattern(): Promise<void> {
  const printerService = getPrinterService();

  if (!printerService.getConnectionStatus()) {
    throw new Error("Printer not connected");
  }

  // ESC/POS commands for a simple test pattern
  const testBytes = new Uint8Array([
    0x1b, 0x40, // Initialize
    0x1b, 0x21, 0x08, // Font size
    // "TEST PATTERN"
    0x54, 0x45, 0x53, 0x54, 0x20, 0x50, 0x41, 0x54, 0x54, 0x45, 0x52, 0x4e,
    0x0a, 0x0a, // Newlines
    // Line of dashes
    0x2d, 0x2d, 0x2d, 0x2d, 0x2d, 0x2d, 0x2d, 0x2d, 0x2d, 0x2d,
    0x0a,
    // "Printer connected successfully"
    0x50, 0x72, 0x69, 0x6e, 0x74, 0x65, 0x72, 0x20, 0x63, 0x6f, 0x6e, 0x6e,
    0x65, 0x63, 0x74, 0x65, 0x64, 0x0a,
    // Cut paper
    0x1b, 0x69,
  ]);

  await printerService.print(testBytes);
}

/**
 * Check if printer is currently connected
 */
export function isPrinterConnected(): boolean {
  return getPrinterService().getConnectionStatus();
}

/**
 * Format amount as currency string
 */
export function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

/**
 * Get paper width in characters
 */
export function getPaperWidthChars(size: "58mm" | "80mm"): number {
  return size === "58mm" ? 32 : 48;
}

/**
 * Create a formatted receipt header
 */
export function createReceiptHeader(
  clinicName: string,
  date: string,
  billNumber: string
): string {
  const maxChars = 32;
  const clinicPad = clinicName.padEnd(maxChars).slice(0, maxChars);

  return `${clinicPad}
${date} ${billNumber}
${"-".repeat(maxChars)}`;
}

/**
 * Create a formatted receipt line
 */
export function createReceiptLine(
  label: string,
  value: string,
  width: number = 32
): string {
  const totalLen = width;
  const availLen = totalLen - 2;
  const labelLen = Math.floor(availLen * 0.6);
  const valueLen = availLen - labelLen;

  const paddedLabel = label.slice(0, labelLen).padEnd(labelLen);
  const paddedValue = value.slice(0, valueLen).padStart(valueLen);

  return `${paddedLabel}${paddedValue}`;
}

/**
 * Restore printer connection from saved config
 */
export async function restorePrinterConnection(): Promise<boolean> {
  try {
    const config = getSavedPrinterConfig();
    if (!config.device) {
      return false;
    }

    const printerService = getPrinterService();

    // Try to connect using Web Serial
    // Note: This won't work without user gesture, so it's best effort
    const portSelected = await printerService.requestPort();
    if (!portSelected) {
      return false;
    }

    const connected = await printerService.connect();
    return connected;
  } catch (error) {
    console.error("Failed to restore printer connection:", error);
    return false;
  }
}

/**
 * Type for printer-related errors
 */
export class PrinterError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "PrinterError";
  }
}

/**
 * Ensure printer is connected, throw error if not
 */
export function ensurePrinterConnected(): void {
  if (!isPrinterConnected()) {
    throw new PrinterError(
      "Printer is not connected. Please connect first.",
      "PRINTER_NOT_CONNECTED"
    );
  }
}

export default {
  isPrinterSupported,
  getPrinterStatus,
  connectToPrinter,
  disconnectPrinter,
  printReceipt,
  sendRawBytes,
  getSavedPrinterConfig,
  clearPrinterConfig,
  printTestPattern,
  isPrinterConnected,
  formatCurrency,
  getPaperWidthChars,
  createReceiptHeader,
  createReceiptLine,
  restorePrinterConnection,
  ensurePrinterConnected,
  PrinterError,
};
