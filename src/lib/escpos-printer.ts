// ESC/POS Thermal Printer utility
// Converts receipt data to ESC/POS commands for 58mm and 80mm thermal printers

export type PrinterSize = '58mm' | '80mm';

interface ReceiptItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface ReceiptData {
  title?: string;
  printerSize: PrinterSize;
  businessName?: string;
  businessPhone?: string;
  businessAddress?: string;
  invoiceNumber: string;
  date: string;
  time?: string;
  patientName: string;
  doctorName?: string;
  items: ReceiptItem[];
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  paymentMethod?: string;
  notes?: string;
  footer?: string;
}

// ESC/POS Commands
const ESC = '\x1B';
const GS = '\x1D';
const NUL = '\x00';

// Character widths for text alignment
const CHAR_WIDTH_58MM = 32; // 58mm printer character width
const CHAR_WIDTH_80MM = 48; // 80mm printer character width

class ESCPOSPrinter {
  private printerSize: PrinterSize;
  private charWidth: number;
  private buffer: Uint8Array[] = [];

  constructor(printerSize: PrinterSize = '58mm') {
    this.printerSize = printerSize;
    this.charWidth = printerSize === '58mm' ? CHAR_WIDTH_58MM : CHAR_WIDTH_80MM;
  }

  private addBytes(data: string | Uint8Array): void {
    if (typeof data === 'string') {
      this.buffer.push(new TextEncoder().encode(data));
    } else {
      this.buffer.push(data);
    }
  }

  private addLine(text: string = ''): void {
    this.addBytes(text + '\n');
  }

  private addCenter(text: string): void {
    const padding = Math.max(0, Math.floor((this.charWidth - text.length) / 2));
    this.addLine(' '.repeat(padding) + text);
  }

  private addLeft(text: string): void {
    this.addLine(text);
  }

  private addRight(text: string): void {
    const padding = Math.max(0, this.charWidth - text.length);
    this.addLine(' '.repeat(padding) + text);
  }

  // Format: label on left, value on right
  private addLabelValue(label: string, value: string): void {
    const padding = this.charWidth - label.length - value.length;
    if (padding > 0) {
      this.addLine(label + ' '.repeat(padding) + value);
    } else {
      this.addLine(label + ' ' + value);
    }
  }

  initialize(): void {
    // Reset printer
    this.addBytes(ESC + '@');
    // Set character code table to UTF-8
    this.addBytes(ESC + 't\x00');
    // Set print density
    this.addBytes(GS + '!' + '\x01');
  }

  setStyle(bold: boolean = false, underline: boolean = false, doubleHeight: boolean = false): void {
    let mode = 0;
    if (bold) mode |= 0x08;
    if (underline) mode |= 0x80;
    if (doubleHeight) mode |= 0x10;
    this.addBytes(ESC + '!' + String.fromCharCode(mode));
  }

  resetStyle(): void {
    this.addBytes(ESC + '!' + '\x00');
  }

  bold(enable: boolean = true): void {
    if (enable) {
      this.addBytes(ESC + 'E\x01');
    } else {
      this.addBytes(ESC + 'E\x00');
    }
  }

  underline(enable: boolean = true): void {
    if (enable) {
      this.addBytes(ESC + '-\x01');
    } else {
      this.addBytes(ESC + '-\x00');
    }
  }

  setTextSize(width: number = 1, height: number = 1): void {
    // Width and height multipliers (1-4)
    const size = ((width - 1) << 4) | (height - 1);
    this.addBytes(GS + '!' + String.fromCharCode(Math.max(1, Math.min(4, size))));
  }

  resetTextSize(): void {
    this.addBytes(GS + '!' + '\x00');
  }

  printDivider(char: string = '-'): void {
    this.addLine(char.repeat(this.charWidth));
  }

  generateReceipt(data: ReceiptData): void {
    this.initialize();

    // Header
    if (data.businessName) {
      this.bold(true);
      this.addCenter(data.businessName);
      this.bold(false);
    }

    if (data.businessAddress) {
      this.addCenter(data.businessAddress);
    }

    if (data.businessPhone) {
      this.addCenter(data.businessPhone);
    }

    this.addLine();
    this.printDivider();

    // Receipt info
    this.addLine();
    this.addLabelValue('Invoice #:', data.invoiceNumber);
    this.addLabelValue('Date:', data.date);
    if (data.time) {
      this.addLabelValue('Time:', data.time);
    }

    // Patient info
    this.addLine();
    this.addLabelValue('Patient:', data.patientName);
    if (data.doctorName) {
      this.addLabelValue('Doctor:', data.doctorName);
    }

    this.addLine();
    this.printDivider();

    // Items header
    this.addLine();
    const descriptionWidth = this.charWidth - 15;
    this.addLine(
      'Item'.padEnd(descriptionWidth) +
      'Qty'.padStart(4) +
      'Price'.padStart(7)
    );
    this.printDivider();

    // Items
    data.items.forEach(item => {
      const qtyStr = item.quantity.toString();
      const totalStr = this.formatCurrency(item.total);
      const desc = item.description.substring(0, descriptionWidth).padEnd(descriptionWidth);
      this.addLine(
        desc +
        qtyStr.padStart(4) +
        totalStr.padStart(7)
      );
    });

    // Totals
    this.addLine();
    this.printDivider();

    this.addLabelValue(
      'Subtotal:',
      this.formatCurrency(data.subtotal)
    );

    if (data.tax && data.tax > 0) {
      this.addLabelValue(
        'Tax:',
        this.formatCurrency(data.tax)
      );
    }

    if (data.discount && data.discount > 0) {
      this.addLabelValue(
        'Discount:',
        this.formatCurrency(data.discount)
      );
    }

    // Total
    this.addLine();
    this.bold(true);
    this.setTextSize(2, 2);
    this.addCenter(this.formatCurrency(data.total));
    this.resetTextSize();
    this.bold(false);
    this.addLine();

    // Payment method
    if (data.paymentMethod) {
      this.addLabelValue('Payment:', data.paymentMethod);
    }

    // Notes
    if (data.notes) {
      this.addLine();
      this.printDivider();
      this.addCenter('NOTES');
      this.addLine();
      // Wrap notes text
      this.wrapText(data.notes);
    }

    // Footer
    this.addLine();
    this.printDivider();
    if (data.footer) {
      this.addCenter(data.footer);
    } else {
      this.addCenter('Thank you for your business!');
    }

    this.addLine();
    this.addLine();

    // Cut paper
    this.cut();
  }

  private wrapText(text: string): void {
    const words = text.split(' ');
    let line = '';

    words.forEach(word => {
      if ((line + word).length > this.charWidth) {
        if (line) this.addLine(line);
        line = word;
      } else {
        line += (line ? ' ' : '') + word;
      }
    });

    if (line) this.addLine(line);
  }

  private formatCurrency(value: number): string {
    return value.toFixed(2);
  }

  cut(): void {
    // Full cut (GS V m)
    this.addBytes(GS + 'V\x41\x00');
  }

  lineFeed(lines: number = 1): void {
    for (let i = 0; i < lines; i++) {
      this.addLine();
    }
  }

  getBytes(): Uint8Array {
    const totalLength = this.buffer.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    this.buffer.forEach(arr => {
      result.set(arr, offset);
      offset += arr.length;
    });

    return result;
  }

  clear(): void {
    this.buffer = [];
  }
}

export function generateReceiptBytes(data: ReceiptData): Uint8Array {
  const printer = new ESCPOSPrinter(data.printerSize);
  printer.generateReceipt(data);
  return printer.getBytes();
}

export default ESCPOSPrinter;
