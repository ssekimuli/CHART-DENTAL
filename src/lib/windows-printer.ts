// Windows Thermal Printer Service
// Uses browser native print API for Windows-installed printers

export interface WindowsPrinterOptions {
  printerName?: string;  // Optional: specify printer name
  paperSize?: "58mm" | "80mm";
  copies?: number;
}

class WindowsPrinterService {
  private printerName: string = "POS58 Printer(2)";
  private paperSize: "58mm" | "80mm" = "58mm";

  static isSupported(): boolean {
    // Windows print API is available in all modern browsers
    return true;
  }

  setPrinterName(name: string): void {
    this.printerName = name;
    try {
      localStorage.setItem("windows_printer_name", name);
    } catch {
      // Storage error
    }
  }

  getPrinterName(): string {
    return this.printerName;
  }

  setPaperSize(size: "58mm" | "80mm"): void {
    this.paperSize = size;
    try {
      localStorage.setItem("windows_printer_size", size);
    } catch {
      // Storage error
    }
  }

  getPaperSize(): "58mm" | "80mm" {
    return this.paperSize;
  }

  /**
   * Restore saved printer configuration
   */
  restoreConfig(): void {
    try {
      const savedName = localStorage.getItem("windows_printer_name");
      const savedSize = localStorage.getItem("windows_printer_size");

      if (savedName) {
        this.printerName = savedName;
      }
      if (savedSize) {
        this.paperSize = savedSize as any;
      }
    } catch {
      // Storage error
    }
  }

  /**
   * Print receipt using Windows print dialog
   * User can select printer and settings
   */
  async printReceipt(html: string, options?: WindowsPrinterOptions): Promise<boolean> {
    try {
      if (options?.printerName) {
        this.printerName = options.printerName;
      }
      if (options?.paperSize) {
        this.paperSize = options.paperSize;
      }

      // Create iframe for printing
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) {
        throw new Error("Failed to create print document");
      }

      // Set print styles based on paper size
      const pageWidth = this.paperSize === "58mm" ? "58mm" : "80mm";
      const styles = `
        <style>
          @page {
            size: ${pageWidth} auto;
            margin: 0;
            padding: 0;
          }
          body {
            margin: 0;
            padding: 4mm;
            font-family: monospace;
            font-size: 12px;
            line-height: 1.4;
          }
          * {
            box-sizing: border-box;
          }
        </style>
      `;

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          ${styles}
        </head>
        <body>${html}</body>
        </html>
      `);
      doc.close();

      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 500));

      // Trigger print dialog
      iframe.contentWindow?.print();

      // Cleanup after print
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);

      return true;
    } catch (error) {
      console.error("Print failed:", error);
      throw error;
    }
  }

  /**
   * Direct print without dialog (auto-prints to default printer)
   */
  async printDirect(html: string): Promise<boolean> {
    try {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) {
        throw new Error("Failed to create print document");
      }

      const pageWidth = this.paperSize === "58mm" ? "58mm" : "80mm";
      const styles = `
        <style>
          @page {
            size: ${pageWidth} auto;
            margin: 0;
            padding: 0;
          }
          body {
            margin: 0;
            padding: 4mm;
            font-family: monospace;
            font-size: 12px;
            line-height: 1.4;
          }
        </style>
      `;

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          ${styles}
        </head>
        <body onload="window.print(); window.close();">${html}</body>
        </html>
      `);
      doc.close();

      return true;
    } catch (error) {
      console.error("Direct print failed:", error);
      throw error;
    }
  }
}

let windowsPrinterInstance: WindowsPrinterService | null = null;

export function getWindowsPrinterService(): WindowsPrinterService {
  if (!windowsPrinterInstance) {
    windowsPrinterInstance = new WindowsPrinterService();
    windowsPrinterInstance.restoreConfig();
  }
  return windowsPrinterInstance;
}

export default WindowsPrinterService;
