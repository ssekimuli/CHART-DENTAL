"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";
import type { Invoice } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { getWindowsPrinterService } from "@/lib/windows-printer";
import { generateSimpleReceiptHTML } from "@/lib/receipt-html-generator";

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

      // Get first treatment as treatment type
      const treatments = invoice.treatments || [];
      const treatmentType = treatments.length > 0
        ? String(treatments[0].procedure || "Treatment")
        : "Services";

      const amount = invoice.amount || 0;
      const date = invoice.issueDate
        ? new Date(invoice.issueDate).toLocaleDateString()
        : new Date().toLocaleDateString();
      const billNumber = String(invoice.id || "INV-001");
      const patientName = String(invoice.patientName || "Patient");

      // Generate receipt HTML (same way as /printer-test)
      const html = generateSimpleReceiptHTML(
        businessName,
        patientName,
        treatmentType,
        amount,
        billNumber,
        date,
        "58mm"
      );

      // Print using Windows printer (shows dialog like /printer-test)
      await printerService.printReceipt(html);

      toast({
        title: "Success",
        description: "Receipt sent to printer!",
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Print failed";
      console.error("Print error:", errorMsg);
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
