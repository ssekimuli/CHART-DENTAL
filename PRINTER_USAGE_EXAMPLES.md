# Thermal Printer Usage Examples

Complete examples showing how to use the Bluetooth thermal printer in different scenarios.

## Table of Contents

1. [React Hook (useThermalPrinter)](#react-hook)
2. [Utility Functions (printer-utils)](#utility-functions)
3. [Direct Service Access](#direct-service-access)
4. [Real-World Integration](#real-world-integration)
5. [Error Handling](#error-handling)

## React Hook

The easiest way to use the printer in React components.

### Basic Usage

```typescript
import { useThermalPrinter } from "@/hooks/use-thermal-printer";

export function MyComponent() {
  const printer = useThermalPrinter();

  return (
    <div>
      <p>Connected: {printer.isConnected ? "Yes" : "No"}</p>
      
      {!printer.isConnected && (
        <button onClick={() => printer.requestAndConnect("58mm")}>
          Connect Printer
        </button>
      )}

      {printer.isConnected && (
        <>
          <button onClick={() => printer.disconnect()}>Disconnect</button>
          <button onClick={() => printer.print({
            clinicName: "My Clinic",
            patientName: "John Doe",
            treatmentType: "Checkup",
            amount: "100.00",
            date: new Date().toLocaleDateString(),
            billNumber: "BL-001",
          })}>
            Print Receipt
          </button>
        </>
      )}
    </div>
  );
}
```

### Complete State Management

```typescript
export function AdvancedPrinterUI() {
  const {
    isSupported,      // Browser supports Web Serial API
    isConnected,      // Currently connected to printer
    isPrinting,       // Currently printing
    connectedDevice,  // { id, name }
    printerSize,      // "58mm" or "80mm"
    error,            // Error message or null
    
    // Methods
    requestAndConnect,
    disconnect,
    print,
    clearError,
  } = useThermalPrinter();

  return (
    <>
      {!isSupported && <div>Printer not supported</div>}
      
      {error && (
        <div role="alert">
          {error}
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}
      
      {isConnected ? (
        <div>
          Connected to: {connectedDevice?.name}
          Size: {printerSize}
          <button onClick={disconnect}>Disconnect</button>
        </div>
      ) : (
        <button 
          onClick={() => requestAndConnect("58mm")}
          disabled={isPrinting}
        >
          Connect
        </button>
      )}

      {isConnected && (
        <button 
          onClick={() => print({
            clinicName: "Test Clinic",
            patientName: "Test Patient",
            treatmentType: "Test",
            amount: "0.00",
            date: new Date().toLocaleDateString(),
            billNumber: "TEST-001",
          })}
          disabled={isPrinting}
        >
          {isPrinting ? "Printing..." : "Print"}
        </button>
      )}
    </>
  );
}
```

## Utility Functions

Pre-built functions for common operations.

### Checking Support

```typescript
import { isPrinterSupported } from "@/lib/printer-utils";

if (!isPrinterSupported()) {
  alert("Your browser doesn't support printer connectivity");
  return;
}
```

### Quick Connect & Print

```typescript
import { 
  connectToPrinter, 
  printReceipt,
  disconnectPrinter 
} from "@/lib/printer-utils";

async function quickPrint() {
  try {
    // Connect
    await connectToPrinter("58mm");
    
    // Print
    await printReceipt({
      clinicName: "CHART Dental",
      patientName: "Alice",
      treatmentType: "Root Canal",
      amount: "500.00",
      date: "2026-08-09",
      billNumber: "BL-001",
    });
    
    // Disconnect
    await disconnectPrinter();
  } catch (error) {
    console.error("Print failed:", error);
  }
}
```

### Managing Saved Configuration

```typescript
import {
  getSavedPrinterConfig,
  clearPrinterConfig,
} from "@/lib/printer-utils";

// Get saved configuration
const config = getSavedPrinterConfig();
console.log("Saved device:", config.device?.name);
console.log("Saved size:", config.size);

// Clear saved configuration
clearPrinterConfig();
```

### Formatting Helpers

```typescript
import {
  formatCurrency,
  getPaperWidthChars,
  createReceiptHeader,
  createReceiptLine,
} from "@/lib/printer-utils";

// Format currency
const price = formatCurrency(1500.50); // "₹1500.50"

// Get paper width
const chars = getPaperWidthChars("58mm"); // 32

// Create formatted header
const header = createReceiptHeader(
  "My Clinic",
  "2026-08-09",
  "BL-001"
);

// Create formatted line
const line = createReceiptLine("Treatment", "500.00", 32);
// Output: "Treatment                    500.00"
```

### Send Raw Bytes

```typescript
import { sendRawBytes } from "@/lib/printer-utils";

// Initialize printer
const initBytes = new Uint8Array([0x1b, 0x40]);
await sendRawBytes(initBytes);

// Print test pattern
const testBytes = new Uint8Array([
  0x54, 0x45, 0x53, 0x54, // "TEST"
  0x0a, // Newline
]);
await sendRawBytes(testBytes);
```

### Test Pattern

```typescript
import { printTestPattern } from "@/lib/printer-utils";

// Print a simple test to verify connection
await printTestPattern();
```

## Direct Service Access

Lower-level access for advanced use cases.

```typescript
import { getPrinterService } from "@/lib/bluetooth-printer";

const service = getPrinterService();

// Check status
console.log(service.getConnectionStatus()); // boolean
console.log(service.getConnectedDevice());  // BluetoothDevice | null

// Request device (shows system dialog)
await service.requestPort();

// Connect
await service.connect();

// Send data
await service.sendData(new Uint8Array([...]));

// Full print cycle
await service.print(receiptBytes);

// Disconnect
await service.disconnect();
```

## Real-World Integration

### In a Billing Page

```typescript
// app/(dashboard)/patients/[id]/billing/page.tsx

import { useThermalPrinter } from "@/hooks/use-thermal-printer";
import { Button } from "@/components/ui/button";

export default function BillingPage({ patientId }) {
  const printer = useThermalPrinter();
  const [billData, setBillData] = useState(null);

  const handleGenerateBill = async (data) => {
    // ... generate bill logic
    setBillData(data);
  };

  const handlePrintBill = async () => {
    if (!printer.isConnected) {
      await printer.requestAndConnect("80mm");
    }

    await printer.print({
      clinicName: "CHART Dental",
      patientName: billData.patientName,
      treatmentType: billData.treatment,
      amount: billData.amount.toString(),
      date: new Date().toLocaleDateString(),
      billNumber: billData.id,
    });
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2">
        {/* Bill display */}
      </div>
      <div>
        <Button 
          onClick={handlePrintBill}
          disabled={!printer.isConnected && printer.isSupported}
        >
          Print Bill
        </Button>
      </div>
    </div>
  );
}
```

### In an Invoice Component

```typescript
// components/invoice/invoice-printer.tsx

import { useThermalPrinter } from "@/hooks/use-thermal-printer";
import { useToast } from "@/hooks/use-toast";

interface InvoiceData {
  clinicName: string;
  patientName: string;
  treatments: Array<{
    name: string;
    amount: number;
  }>;
  total: number;
  date: string;
  billNumber: string;
}

export function InvoicePrinter({ invoice }: { invoice: InvoiceData }) {
  const printer = useThermalPrinter();
  const { toast } = useToast();

  const handlePrint = async () => {
    try {
      // Connect if needed
      if (!printer.isConnected) {
        const connected = await printer.requestAndConnect("80mm");
        if (!connected) return;
      }

      // Calculate total
      const total = invoice.treatments.reduce(
        (sum, t) => sum + t.amount,
        0
      );

      // Print
      const success = await printer.print({
        clinicName: invoice.clinicName,
        patientName: invoice.patientName,
        treatmentType: invoice.treatments
          .map(t => t.name)
          .join(", "),
        amount: total.toFixed(2),
        date: invoice.date,
        billNumber: invoice.billNumber,
      });

      if (success) {
        toast({
          title: "Printed",
          description: "Invoice printed successfully",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Print Failed",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  return (
    <button 
      onClick={handlePrint}
      disabled={printer.isPrinting}
    >
      {printer.isPrinting ? "Printing..." : "Print Invoice"}
    </button>
  );
}
```

### With Error Handling

```typescript
import { 
  printReceipt,
  isPrinterConnected,
  ensurePrinterConnected,
  PrinterError 
} from "@/lib/printer-utils";

async function safelyPrintReceipt(data) {
  try {
    // Check printer support first
    if (!isPrinterConnected()) {
      // Try to connect
      await connectToPrinter("58mm");
    }

    // Ensure connected
    ensurePrinterConnected();

    // Print
    await printReceipt(data);

    return { success: true };
  } catch (error) {
    if (error instanceof PrinterError) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

## Error Handling

### Common Errors

```typescript
import { useThermalPrinter } from "@/hooks/use-thermal-printer";

export function ErrorHandlingExample() {
  const printer = useThermalPrinter();

  const handlePrint = async () => {
    try {
      await printer.print({...});
    } catch (error: any) {
      // Handle specific errors
      if (error.message.includes("not connected")) {
        console.log("Need to connect first");
        await printer.requestAndConnect("58mm");
      } else if (error.message.includes("Web Serial")) {
        console.log("Browser doesn't support printers");
      } else if (error.message.includes("timeout")) {
        console.log("Printer is offline or out of range");
      } else {
        console.log("Unknown error:", error.message);
      }
    }
  };

  // Display error from hook
  if (printer.error) {
    return (
      <div role="alert">
        {printer.error}
        <button onClick={printer.clearError}>Dismiss</button>
      </div>
    );
  }

  return <button onClick={handlePrint}>Print</button>;
}
```

### Error Recovery

```typescript
async function printWithRetry(
  data,
  maxRetries = 3
) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const printer = getPrinterService();
      
      // Ensure connected
      if (!printer.getConnectionStatus()) {
        await printer.requestPort();
        await printer.connect();
      }

      // Try to print
      await printer.print(
        generateReceiptBytes(data)
      );

      return true; // Success
    } catch (error) {
      lastError = error;
      
      // Wait before retrying
      await new Promise(r => setTimeout(r, 1000));
      
      // Disconnect and try again
      try {
        const printer = getPrinterService();
        await printer.disconnect();
      } catch {
        // Ignore disconnect errors
      }
    }
  }

  throw new Error(
    `Print failed after ${maxRetries} attempts: ${lastError}`
  );
}
```

## Browser Compatibility

```typescript
// Check which APIs are available
const canUseWebSerial = !!navigator.serial;
const canUseWebBluetooth = !!navigator.bluetooth;

// Recommend browser
if (!canUseWebSerial) {
  console.warn("Please use Chrome, Edge, or Opera for printer support");
}
```

## Performance Tips

```typescript
// 1. Connect once and keep connected
const printer = useThermalPrinter();

// 2. Reuse receipt data structures
const receiptTemplate = {
  clinicName: "My Clinic",
  treatmentType: "Checkup",
  // ...
};

// 3. Batch print jobs
async function printMultiple(receipts) {
  for (const receipt of receipts) {
    await printer.print(receipt);
    // Small delay between prints
    await new Promise(r => setTimeout(r, 500));
  }
}

// 4. Monitor print progress
const { isPrinting } = useThermalPrinter();
```

## Testing

```typescript
// test/printer.test.ts

import { printReceipt, isPrinterSupported } from "@/lib/printer-utils";

describe("Printer Utils", () => {
  it("should check browser support", () => {
    expect(isPrinterSupported()).toBeDefined();
  });

  it("should handle print with mock service", async () => {
    // Mock getPrinterService() for testing
    const mockService = {
      getConnectionStatus: () => true,
      print: jest.fn(),
    };

    // Test print logic
    await printReceipt({
      clinicName: "Test",
      patientName: "Test",
      treatmentType: "Test",
      amount: "0",
      date: new Date().toLocaleDateString(),
      billNumber: "TEST-001",
    });
  });
});
```

## Troubleshooting

If printing doesn't work:

1. Check browser compatibility (Chrome/Edge/Opera only)
2. Verify printer is paired in system Bluetooth settings
3. Test with printer test page at `/printer-test`
4. Check browser console for error messages
5. Ensure printer is powered on and in range
6. Try with test pattern first

For more detailed troubleshooting, see [BLUETOOTH_PRINTER_GUIDE.md](./BLUETOOTH_PRINTER_GUIDE.md).

---

**Last Updated:** August 2026
