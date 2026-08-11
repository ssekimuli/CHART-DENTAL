# Bluetooth Printer Quick Reference

Quick lookup for common printer tasks.

## Browser Support

| Browser | Support | Min Version |
|---------|---------|-------------|
| Chrome | ✅ | v89 |
| Edge | ✅ | v89 |
| Opera | ✅ | v75 |
| Firefox | ❌ | — |
| Safari | ❌ | — |

## React Hook

```typescript
import { useThermalPrinter } from "@/hooks/use-thermal-printer";

const {
  isSupported,      // boolean
  isConnected,      // boolean
  isPrinting,       // boolean
  connectedDevice,  // BluetoothDevice | null
  printerSize,      // "58mm" | "80mm"
  error,            // string | null
  requestAndConnect,
  disconnect,
  print,
  clearError,
} = useThermalPrinter();
```

## Basic Workflow

### 1. Check Support
```typescript
if (!printer.isSupported) {
  // Show error message
  return;
}
```

### 2. Connect
```typescript
const connected = await printer.requestAndConnect("58mm");
// Shows system device selector dialog
```

### 3. Print
```typescript
const success = await printer.print({
  clinicName: "My Clinic",
  patientName: "John Doe",
  treatmentType: "Checkup",
  amount: "100.00",
  date: "2026-08-09",
  billNumber: "BL-001",
});
```

### 4. Disconnect
```typescript
await printer.disconnect();
```

## Utility Functions

| Function | Purpose | Example |
|----------|---------|---------|
| `isPrinterSupported()` | Check browser support | `if (!isPrinterSupported())` |
| `connectToPrinter()` | Connect to printer | `await connectToPrinter("58mm")` |
| `printReceipt()` | Send receipt to printer | `await printReceipt(data)` |
| `disconnectPrinter()` | Close connection | `await disconnectPrinter()` |
| `isPrinterConnected()` | Check connection status | `if (isPrinterConnected())` |
| `printTestPattern()` | Send test print | `await printTestPattern()` |
| `getSavedPrinterConfig()` | Get saved settings | `const {device, size} = getSavedPrinterConfig()` |
| `clearPrinterConfig()` | Clear saved settings | `clearPrinterConfig()` |

```typescript
import * as printerUtils from "@/lib/printer-utils";
```

## Common Patterns

### Pattern 1: Quick Print
```typescript
async function quickPrint(receiptData) {
  try {
    await printerUtils.connectToPrinter("58mm");
    await printerUtils.printReceipt(receiptData);
  } catch (error) {
    console.error(error);
  }
}
```

### Pattern 2: Keep Connected
```typescript
function BillingApp() {
  const printer = useThermalPrinter();

  return (
    <>
      {!printer.isConnected && (
        <button onClick={() => printer.requestAndConnect("58mm")}>
          Connect Printer
        </button>
      )}

      {printer.isConnected && (
        <button onClick={() => printer.print(data)}>
          Print Receipt
        </button>
      )}
    </>
  );
}
```

### Pattern 3: Show Status
```typescript
<div>
  {printer.isConnected ? (
    <span className="text-green-600">Connected</span>
  ) : (
    <span className="text-red-600">Disconnected</span>
  )}
  {printer.isPrinting && <span>Printing...</span>}
  {printer.error && <span className="text-red-600">{printer.error}</span>}
</div>
```

## Receipt Data Structure

```typescript
interface ReceiptData {
  clinicName: string;      // "CHART Dental"
  patientName: string;     // "John Doe"
  treatmentType: string;   // "Root Canal" or comma-separated
  amount: string;          // "500.00"
  date: string;            // "2026-08-09"
  billNumber: string;      // "BL-001"
}
```

## Paper Sizes

| Size | Width | Chars/Line | Use Case |
|------|-------|-----------|----------|
| 58mm | 2.24" | 32 | Mobile/portable printers |
| 80mm | 3.15" | 48 | Standard thermal printers |

```typescript
// Get character width
const chars = printerUtils.getPaperWidthChars("58mm"); // 32
```

## Error Handling

```typescript
try {
  await printer.print(data);
} catch (error) {
  if (error.message.includes("not connected")) {
    // Reconnect
  } else if (error.message.includes("Web Serial")) {
    // Browser doesn't support
  } else if (error.message.includes("timeout")) {
    // Printer offline
  }
}
```

## Keyboard Shortcuts (in /printer-test)

- `Enter` - Connect/Print
- `Esc` - Disconnect/Close

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| "Web Serial API not supported" | Wrong browser | Use Chrome/Edge/Opera |
| "No Bluetooth printer found" | Printer not paired | Pair in system Bluetooth settings |
| "Timeout" | Printer offline | Check power, range, pairing |
| "Garbled output" | Wrong paper size | Change paper width setting |
| "No device selected" | Dialog dismissed | Click "Select Printer" again |

## Testing

```bash
# Navigate to test page
/printer-test

# Steps:
# 1. Click "Select & Connect Printer"
# 2. Choose printer from dialog
# 3. Click "Print Receipt" or "Print Test Pattern"
# 4. Check printer output
```

## Format Helpers

```typescript
// Currency
formatCurrency(1500.50)  // "₹1500.50"

// Receipt header
createReceiptHeader("My Clinic", "2026-08-09", "BL-001")

// Receipt line with alignment
createReceiptLine("Treatment", "500.00", 32)
// "Treatment                    500.00"
```

## localStorage Keys

| Key | Value | Example |
|-----|-------|---------|
| `connected_printer` | Device info (JSON) | `{"id":"123","name":"Printer"}` |
| `printer_size` | Paper width | `"58mm"` |

## Files

| File | Purpose |
|------|---------|
| `src/lib/bluetooth-printer.ts` | Core printer service |
| `src/lib/escpos-printer.ts` | Receipt formatting |
| `src/lib/printer-utils.ts` | Helper functions |
| `src/hooks/use-thermal-printer.ts` | React hook |
| `src/app/(dashboard)/printer-test/page.tsx` | Test interface |
| `BLUETOOTH_PRINTER_GUIDE.md` | Complete guide |
| `PRINTER_USAGE_EXAMPLES.md` | Code examples |

## Page Layout by Printer Size

### 58mm (32 chars)
```
================================
CHART DENTAL CLINIC
2026-08-09 BL-001
================================
Patient: John Doe
Treatment: Checkup
Amount:                    100.00
================================
Thank you!
```

### 80mm (48 chars)
```
================================================
CHART DENTAL CLINIC
2026-08-09                               BL-001
================================================
Patient: John Doe
Treatment: Root Canal
Amount:                               500.00
================================================
Thank you for choosing our clinic!
================================================
```

## API Reference

### `useThermalPrinter()`

**Returns:**
```typescript
{
  isSupported: boolean;
  isConnected: boolean;
  isPrinting: boolean;
  connectedDevice: BluetoothDevice | null;
  printerSize: PrinterSize;
  error: string | null;
  requestAndConnect: (size: PrinterSize) => Promise<boolean>;
  disconnect: () => Promise<void>;
  print: (data: ReceiptData) => Promise<boolean>;
  clearError: () => void;
}
```

### `connectToPrinter(size)`

**Parameters:**
- `size: "58mm" | "80mm"` - Paper width

**Returns:** `Promise<boolean>` - True if connected

**Throws:** `Error` if failed

### `printReceipt(data, size?)`

**Parameters:**
- `data: ReceiptData` - Receipt information
- `size?: PrinterSize` - Optional paper size (uses saved or defaults to 58mm)

**Returns:** `Promise<boolean>` - True if printed

**Throws:** `Error` if not connected or print failed

## Notes

- Connection is automatically saved to localStorage
- Connection persists across page reloads
- Only one printer can be connected at a time
- HTTPS required (except localhost for testing)
- User must approve each new printer connection via system dialog

---

**Last Updated:** August 2026
**Version:** 1.0
