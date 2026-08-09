"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";
import type { Invoice } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { getWindowsPrinterService } from "@/lib/windows-printer";
import { generateReceiptHTML } from "@/lib/receipt-html-generator";

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
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    setIsPrinting(true);

    try {
      const printerService = getWindowsPrinterService();

      // Calculate totals
      const treatments = invoice.treatments || [];
      const treatmentItems = treatments.map(t => ({
        name: t.procedure || "Treatment",
        amount: typeof t.cost === "string" ? parseFloat(t.cost) : t.cost || 0,
      }));

      // Generate receipt HTML
      const html = generateReceiptHTML(
        {
          clinicName: businessName,
          clinicPhone: businessPhone,
          clinicAddress: businessAddress,
          patientName: invoice.patientName || "Unknown Patient",
          treatments: treatmentItems,
          billNumber: String(invoice.id || ""),
          date: new Date(invoice.issueDate || Date.now()).toLocaleDateString(),
        },
        "58mm" // Default to 58mm for receipts
      );

      // Send to printer (shows print dialog)
      await printerService.printReceipt(html);

      toast({
        title: "Success",
        description: "Invoice sent to printer. Use the print dialog to select your printer.",
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Print failed";
      toast({
        variant: "destructive",
        title: "Print Failed",
        description: errorMsg,
      });
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Button onClick={handlePrint} disabled={isPrinting} variant="default">
      {isPrinting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Printing...
        </>
      ) : (
        <>
          <Printer className="mr-2 h-4 w-4" />
          Print Receipt
        </>
      )}
    </Button>
  );
}
