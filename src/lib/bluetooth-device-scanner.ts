// Bluetooth Device Scanner - Helps discover and manage Bluetooth printers

export interface DiscoveredDevice {
  id: string;
  name: string;
  type: "printer" | "serial" | "unknown";
  lastSeen: Date;
  signalStrength?: number;
}

class BluetoothDeviceScanner {
  private discoveredDevices: Map<string, DiscoveredDevice> = new Map();

  async scanForPrinters(): Promise<DiscoveredDevice[]> {
    try {
      const devices = await this.discoverBluetoothDevices();
      return devices.filter(d => this.isProbablyPrinter(d.name));
    } catch (error) {
      console.error("Failed to scan for printers:", error);
      return [];
    }
  }

  private async discoverBluetoothDevices(): Promise<DiscoveredDevice[]> {
    if (!this.isWebBluetoothSupported()) {
      return [];
    }

    try {
      // Request multiple Bluetooth devices (for printers)
      const devices = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { namePrefix: "Printer" },
          { namePrefix: "PRINTER" },
          { namePrefix: "BP" }, // Brother Printer
          { namePrefix: "MP" }, // Mobile Printer
          { namePrefix: "TP" }, // Thermal Printer
          { namePrefix: "Zebra" },
          { namePrefix: "EPSON" },
          { serviceUuids: ["1101"] }, // Serial Port Profile
        ],
        optionalServices: ["battery_service"],
      });

      if (!devices) return [];

      const discovered: DiscoveredDevice[] = [];

      if (Array.isArray(devices)) {
        devices.forEach(device => {
          discovered.push(this.deviceToDiscoveredFormat(device));
        });
      } else {
        discovered.push(this.deviceToDiscoveredFormat(devices));
      }

      return discovered;
    } catch (error: any) {
      if (error.name === "NotFoundError") {
        console.log("No Bluetooth printers found");
      }
      return [];
    }
  }

  private deviceToDiscoveredFormat(device: any): DiscoveredDevice {
    return {
      id: device.id || device.name,
      name: device.name || "Unknown Device",
      type: this.determinePrinterType(device.name),
      lastSeen: new Date(),
      signalStrength: device.rssi,
    };
  }

  private determinePrinterType(name: string): "printer" | "serial" | "unknown" {
    const lowerName = name.toLowerCase();
    if (
      lowerName.includes("printer") ||
      lowerName.includes("bp") ||
      lowerName.includes("mp") ||
      lowerName.includes("tp") ||
      lowerName.includes("zebra") ||
      lowerName.includes("epson")
    ) {
      return "printer";
    }
    if (lowerName.includes("serial") || lowerName.includes("uart")) {
      return "serial";
    }
    return "unknown";
  }

  private isProbablyPrinter(name: string): boolean {
    return this.determinePrinterType(name) !== "unknown";
  }

  private isWebBluetoothSupported(): boolean {
    return !!(navigator as any).bluetooth;
  }

  // Get previously discovered devices
  getDiscoveredDevices(): DiscoveredDevice[] {
    return Array.from(this.discoveredDevices.values());
  }

  // Save device to recent list
  addToRecent(device: DiscoveredDevice): void {
    this.discoveredDevices.set(device.id, {
      ...device,
      lastSeen: new Date(),
    });
  }

  // Clear discovery cache
  clear(): void {
    this.discoveredDevices.clear();
  }

  static isSupported(): boolean {
    return !!(navigator as any).bluetooth;
  }
}

let scannerInstance: BluetoothDeviceScanner | null = null;

export function getDeviceScanner(): BluetoothDeviceScanner {
  if (!scannerInstance) {
    scannerInstance = new BluetoothDeviceScanner();
  }
  return scannerInstance;
}

export default BluetoothDeviceScanner;
