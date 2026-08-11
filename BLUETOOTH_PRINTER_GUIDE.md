# Bluetooth Thermal Printer Integration Guide

Complete guide to using Bluetooth/thermal printers in CHART-DENTAL from your browser.

## Overview

This implementation uses **Web Serial API** (not Web Bluetooth) to communicate with Bluetooth thermal printers. Web Serial API is more reliable for printer communication because:

- Supports both USB-serial and Bluetooth-serial adapters
- Better error handling and recovery
- More consistent across platforms
- Works with common thermal printer protocols (ESC/POS)

## Browser Support

✅ **Supported Browsers:**
- Google Chrome (v89+)
- Microsoft Edge (v89+)
- Opera (v75+)

❌ **Not Supported:**
- Safari (macOS/iOS)
- Firefox
- Internet Explorer

## System Requirements

### Windows
- Windows 10 or later
- Bluetooth adapter (built-in or USB)
- Thermal printer with Bluetooth connectivity

### macOS
- macOS 10.15 or later
- Built-in Bluetooth
- Supported in Chrome/Edge only

### Linux
- Linux with BlueZ Bluetooth stack
- USB adapter may be required for some printers

## Setting Up Your Printer

### Step 1: Pair Your Printer (One-time)

**Windows:**
1. Go to **Settings → Devices → Bluetooth & devices**
2. Click **Add device**
3. Select **Bluetooth**
4. Choose your printer from the list
5. Complete the pairing process

**macOS:**
1. Open **System Preferences → Bluetooth**
2. Put your printer in pairing mode
3. Select it from the device list
4. Click **Connect**

### Step 2: Test Connection in Browser

1. Navigate to `/printer-test` in CHART-DENTAL
2. Click **"Select & Connect Printer"**
3. A system dialog will appear
4. Select your printer from the list
5. Click **"Connect"**

### Step 3: Send Test Print

1. Verify the printer is connected (green "Connected" badge)
2. Fill in the test receipt data (clinic name, patient name, etc.)
3. Click **"Print Receipt"** or **"Print Test Pattern"**
4. Check your printer for output

## API Usage

### Using the Thermal Printer Hook

```typescript
import { useThermalPrinter } from "@/hooks/use-thermal-printer";

export function MyComponent() {
  const printer = useThermalPrinter();

  const handlePrint = async () => {
    const success = await printer.print({
      clinicName: "CHART Dental",
      patientName: "John Doe",
      treatmentType: "Checkup",
      amount: "150.00",
      date: new Date().toLocaleDateString(),
      billNumber: "BL-001",
    });

    if (success) {
      console.log("Print successful!");
    }
  };

  return (
    <div>
      <p>Connected: {printer.isConnected ? "Yes" : "No"}</p>
      <button onClick={() => printer.requestAndConnect("58mm")}>
        Connect Printer
      </button>
      <button onClick={handlePrint} disabled={!printer.isConnected}>
        Print
      </button>
    </div>
  );
}
```

### Printer State

```typescript
interface PrinterState {
  isSupported: boolean;        // Browser supports Web Serial API
  isConnected: boolean;        // Printer is connected
  isPrinting: boolean;         // Currently printing
  connectedDevice: BluetoothDevice | null;
  printerSize: PrinterSize;    // "58mm" or "80mm"
  error: string | null;        // Last error message
}
```

### Available Methods

```typescript
// Request port and connect
await printer.requestAndConnect("58mm" | "80mm")

// Send raw bytes to printer
await printer.print(receiptData)

// Disconnect
await printer.disconnect()

// Clear error message
printer.clearError()
```

## Supported Printers

### Tested & Working

- **Brother VC-500W** (mobile label printer)
- **Zebra ZQ** series (mobile receipt printers)
- **Epson TM** series (thermal printers via USB-to-Bluetooth adapters)
- Generic ESC/POS thermal printers

### Generic Support

Any printer that supports:
- ESC/POS protocol
- Baud rate: 9600, 8 data bits, 1 stop bit
- Bluetooth Classic (not BLE)

## Troubleshooting

### "Web Serial API is not supported"
- **Issue:** Browser doesn't support Web Serial API
- **Solution:** Use Chrome, Edge, or Opera (v89+)

### "No Bluetooth printer found"
- **Issue:** Printer not paired with device
- **Solution:** Pair the printer in system settings first
- **Note:** Pairing only needs to be done once per device

### Printer connects but won't print
- **Issue:** Wrong baud rate or protocol
- **Solution:** Check printer manual for serial settings
- **Common:** Default is 9600, 8N1

### Print job times out
- **Issue:** Printer disconnected mid-print
- **Solution:** 
  - Check physical Bluetooth connection
  - Move closer to printer
  - Restart printer and reconnect
  - Check if printer is in sleep mode

### Data looks garbled/wrong
- **Issue:** Incorrect character encoding or printer width
- **Solution:**
  - Verify printer paper width (58mm vs 80mm)
  - Check that printer supports ESC/POS
  - Try sending test pattern first

## Advanced Usage

### Custom Receipt Format

```typescript
import { generateReceiptBytes } from "@/lib/escpos-printer";

const receiptBytes = generateReceiptBytes({
  clinicName: "My Clinic",
  patientName: "Patient Name",
  treatmentType: "Root Canal",
  amount: "500.00",
  date: "2026-08-09",
  billNumber: "BL-001",
  printerSize: "58mm",
});

await printer.print(receiptBytes);
```

### Direct ESC/POS Commands

```typescript
// Send raw ESC/POS bytes
const initCommand = new Uint8Array([0x1b, 0x40]); // Initialize printer
await printerService.sendData(initCommand);
```

### Connection Persistence

The printer hook automatically:
- Saves connected printer to localStorage
- Restores connection on page reload
- Maintains connection state across navigation

## File Structure

```
src/
├── lib/
│   ├── bluetooth-printer.ts          # Core printer service (Web Serial)
│   ├── bluetooth-device-scanner.ts   # Device discovery utility
│   └── escpos-printer.ts             # ESC/POS receipt generation
├── hooks/
│   └── use-thermal-printer.ts        # React hook for printer state
├── components/thermal-printer/
│   ├── printer-selector.tsx          # Connection UI dialog
│   └── invoice-printer.tsx           # Receipt display component
└── app/(dashboard)/printer-test/
    └── page.tsx                      # Testing interface
```

## Key Classes

### BluetoothPrinterService
Handles low-level communication with printer via Web Serial API.

```typescript
const service = getPrinterService();
await service.requestPort();     // Show device selector
await service.connect();         // Open serial port
await service.sendData(bytes);   // Send raw bytes
await service.print(bytes);      // Send and wait for completion
await service.disconnect();      // Close port
```

### BluetoothDeviceScanner
Discovers nearby Bluetooth devices (if Web Bluetooth API available).

```typescript
const scanner = getDeviceScanner();
const printers = await scanner.scanForPrinters();
```

## Testing Checklist

- [ ] Browser supports Web Serial API
- [ ] Printer is paired with device
- [ ] Printer is turned on and in range
- [ ] Can connect without errors
- [ ] Test pattern prints correctly
- [ ] Receipt data prints correctly
- [ ] Printer disconnects cleanly
- [ ] Connection persists across page reloads

## Performance Notes

- **First connection:** 2-3 seconds (system dialog + handshake)
- **Subsequent connections:** <1 second (from cache)
- **Print time:** 1-3 seconds (depends on receipt size)
- **Paper size:** 58mm (mobile) ~32 chars/line, 80mm (standard) ~48 chars/line

## Security Considerations

- Only HTTPS connections can use Web Serial API (except localhost)
- User must approve each printer connection via browser dialog
- Printer data is sent directly to device (not stored/logged)
- localStorage stores device info locally only (cleared if you clear browser data)

## Development

### Running Tests

```bash
npm run test:printer    # Run printer tests
npm run dev            # Start dev server
# Navigate to /printer-test
```

### Debugging

Enable detailed logging:
```typescript
// In console
localStorage.setItem('DEBUG_PRINTER', 'true');
```

Monitor:
- Browser console for error messages
- Device's bluetooth settings for connection status
- Printer's status indicators (lights, beeps)

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Connection refused | Printer not paired | Pair in system settings |
| Timeout error | Printer turned off/out of range | Check printer power & proximity |
| Garbled output | Wrong baud rate | Check printer manual, usually 9600 |
| No device selection dialog | Browser doesn't support Web Serial | Use Chrome/Edge/Opera |
| Connection lost during print | Bluetooth interference | Move away from wireless interference sources |
| Print job incomplete | Buffer overflow | Reduce print size or add delays |

## Printer Specifications

### Recommended Models

**Mobile (58mm):**
- Zebra ZQ series (ZQ110, ZQ220)
- Brother VC-500W
- Portable thermal receipt printers with 58mm paper

**Desktop (80mm):**
- Epson TM-T88 series
- Zebra GX series
- Standard thermal receipt printers with 80mm paper

## References

- [Web Serial API MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API)
- [ESC/POS Protocol Reference](https://en.wikipedia.org/wiki/ESC/P)
- [Zebra Printer Manual](https://www.zebra.com/)
- [Epson Thermal Printer Guide](https://www.epson.com/)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review printer manual for serial settings
3. Check browser console for error messages
4. Test with `/printer-test` page first
5. Verify system-level Bluetooth connection

---

**Last Updated:** August 2026
