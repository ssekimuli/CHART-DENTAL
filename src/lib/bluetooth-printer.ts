// Bluetooth Thermal Printer Service
// Handles connection and communication with Bluetooth Classic printers via Web Serial API

export interface BluetoothDevice {
  id: string;
  name: string;
}

export type PrinterSize = '58mm' | '80mm';

class BluetoothPrinterService {
  private device: BluetoothDevice | null = null;
  private isConnected: boolean = false;
  private port: any = null;
  private writer: any = null;

  // Check if Web Serial API is available (most reliable for Bluetooth on Windows)
  static isSupported(): boolean {
    return !!(navigator as any).serial;
  }

  async requestPort(): Promise<boolean> {
    try {
      if (!BluetoothPrinterService.isSupported()) {
        throw new Error('Web Serial API is not supported. Please use Chrome, Edge, or Opera browser.');
      }

      // Request port from user - allows both USB and Bluetooth serial devices
      this.port = await (navigator as any).serial.requestPort({
        filters: [
          // Common thermal printer vendors
          { usbVendorId: 0x0483 }, // STMicroelectronics
          { usbVendorId: 0x1a86 }, // QinHeng Electronics
          { usbVendorId: 0x10c4 }, // Silicon Labs
          { usbVendorId: 0x067b }, // Prolific
        ]
      });

      if (!this.port) {
        throw new Error('No port selected');
      }

      // Extract device info
      const info = this.port.getInfo();
      this.device = {
        id: `${info.usbVendorId}-${info.usbProductId}`,
        name: `Thermal Printer (USB: ${info.usbProductId || 'unknown'})`,
      };

      return true;
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        throw new Error('No Bluetooth/USB printer found. Make sure your printer is paired and connected.');
      }
      throw error;
    }
  }

  async connect(): Promise<boolean> {
    try {
      if (!this.port) {
        throw new Error('No port selected. Please request a port first.');
      }

      // Check if already open
      if (this.port.readable && this.port.writable) {
        this.isConnected = true;
        return true;
      }

      // Open the port with standard thermal printer settings
      await this.port.open({
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none'
      });

      this.isConnected = true;
      console.log('✓ Printer connected successfully');

      return true;
    } catch (error: any) {
      console.error('Failed to connect:', error);
      this.isConnected = false;
      throw new Error(`Connection failed: ${error.message}`);
    }
  }

  async sendData(data: Uint8Array): Promise<void> {
    if (!this.isConnected || !this.port) {
      throw new Error('Printer is not connected');
    }

    try {
      if (!this.port.writable) {
        throw new Error('Port is not writable. Please reconnect the printer.');
      }

      // Get a fresh writer for each send operation
      const writer = this.port.writable.getWriter();

      try {
        // Send data in chunks for better stability
        const chunkSize = 128;
        for (let i = 0; i < data.length; i += chunkSize) {
          const chunk = data.slice(i, Math.min(i + chunkSize, data.length));
          await writer.write(chunk);

          // Small delay between chunks to prevent buffer overflow
          await new Promise(resolve => setTimeout(resolve, 20));
        }

        // Don't release writer yet - keep it open for potential follow-up operations
        console.log(`✓ Sent ${data.length} bytes to printer`);
      } finally {
        try {
          writer.releaseLock();
        } catch (e) {
          // Writer might already be released or port closed
        }
      }
    } catch (error: any) {
      console.error('Failed to send data:', error);
      this.isConnected = false;
      throw new Error(`Send failed: ${error.message}`);
    }
  }

  async print(data: Uint8Array): Promise<void> {
    // Ensure we're still connected
    if (!this.isConnected) {
      throw new Error('Printer disconnected. Please reconnect.');
    }

    await this.sendData(data);

    // Give printer time to process the entire receipt
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('✓ Print job complete');
  }

  async disconnect(): Promise<void> {
    try {
      if (this.writer) {
        try {
          this.writer.releaseLock();
        } catch (e) {
          // Already released or disposed
        }
        this.writer = null;
      }

      if (this.port) {
        try {
          await this.port.close();
        } catch (e) {
          // Port might already be closed
        }
      }

      this.isConnected = false;
      this.device = null;
      this.port = null;

      console.log('✓ Printer disconnected');
    } catch (error: any) {
      console.error('Error during disconnect:', error);
    }
  }

  getConnectedDevice(): BluetoothDevice | null {
    return this.isConnected ? this.device : null;
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Global singleton instance to maintain persistent connection
let printerInstance: BluetoothPrinterService | null = null;

export function getPrinterService(): BluetoothPrinterService {
  if (!printerInstance) {
    printerInstance = new BluetoothPrinterService();
  }
  return printerInstance;
}

export default BluetoothPrinterService;
