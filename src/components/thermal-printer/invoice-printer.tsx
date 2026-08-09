"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PrinterSelector } from "./printer-selector";
import { useThermalPrinter } from "@/hooks/use-thermal-printer";
import { Printer, Loader2 } from "lucide-react";
import type { Invoice } from "@/lib/types";
import type { ReceiptData } from "@/lib/escpos-printer";
import { useToast } from "@/hooks/use-toast";

interface InvoicePrinterProps {
  invoice: Invoice;
  businessName?: string;
  businessPhone?: string;
  businessAddress?: string;
}

export function InvoicePrinter({
  invoice,
  businessName = "CHART DENTAL",
  businessPhone = "+256 XXX XXX XXX",
  businessAddress = "Your Address Here",
}: InvoicePrinterProps) {
  const { toast } = useToast();
  const [showPrinterSelector, setShowPrinterSelector] = useState(false);
  const {
    isSupported,
    isConnected,
    isPrinting,
    connectedDevice,
    printerSize,
    print,
    requestAndConnect,
  } = useThermalPrinter();

  const handlePrint = async () => {
    if (!isConnected) {
      setShowPrinterSelector(true);
      return;
    }

    // Convert invoice to receipt data
    const receiptData: ReceiptData = {
      printerSize,
      businessName,
      businessPhone,
      businessAddress,
      invoiceNumber: String(invoice.id),
      date: new Date(invoice.issueDate || Date.now()).toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      patientName: invoice.patientName || "N/A",
      doctorName: (invoice as any).doctorName,
      items: (invoice.treatments || []).map(treatment => ({
        description: treatment.procedure,
        quantity: 1,
        unitPrice: treatment.cost,
        total: treatment.cost,
      })),
      subtotal: (invoice as any).subtotal || 0,
      tax: (invoice as any).tax,
      discount: (invoice as any).discount,
      total: invoice.amount || 0,
      paymentMethod: (invoice as any).paymentMethod,
      footer: `Invoice #${invoice.id} | Thank you for choosing us!`,
    };

    const success = await print(receiptData);
    if (success) {
      toast({
        title: "Success",
        description: "Invoice sent to printer",
      });
    }
  };

  const handlePrinterSelected = async (_device: any, size: any) => {
    await requestAndConnect(size);
  };

  if (!isSupported) {
    return (
      <Button variant="outline" disabled title="Web Serial API not supported">
        <Printer className="mr-2 h-4 w-4" />
        Print (Not Supported)
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={handlePrint}
        disabled={isPrinting}
        variant={isConnected ? "default" : "outline"}
      >
        {isPrinting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Printing...
          </>
        ) : (
          <>
            <Printer className="mr-2 h-4 w-4" />
            {isConnected ? `Print (${connectedDevice?.name || "Printer"})` : "Print Receipt"}
          </>
        )}
      </Button>

      <PrinterSelector
        open={showPrinterSelector}
        onOpenChange={setShowPrinterSelector}
        onPrinterSelected={handlePrinterSelected}
        isSupported={isSupported}
      />
    </>
  );
}
