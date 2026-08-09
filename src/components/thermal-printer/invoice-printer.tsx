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

      // Calculate totals for detailed receipt
      const subtotal = treatments.reduce((sum, t) => sum + (typeof t.cost === "number" ? t.cost : 0), 0);
      const balanceDue = (invoice.amount || 0) - (invoice.paidAmount || 0);

      // Generate detailed receipt HTML with full billing information
      const html = generateSimpleReceiptHTML(
        businessName,
        patientName,
        treatmentType,
        amount,
        billNumber,
        date,
        "58mm"
      );

      // For detailed receipt, use generateReceiptHTML with all fields
      const { generateReceiptHTML } = await import("@/lib/receipt-html-generator");
      const detailedHtml = generateReceiptHTML(
        {
          clinicName: businessName,
          clinicPhone: businessPhone,
          clinicAddress: businessAddress,
          patientName: patientName,
          date: date,
          billNumber: billNumber,
          treatments: treatments.map(t => ({
            name: String(t.procedure || "Treatment"),
            amount: typeof t.cost === "number" ? t.cost : 0,
          })),
          subtotal: subtotal,
          totalBill: amount,
          insurancePortion: invoice.insuranceResponsibility,
          patientPortion: invoice.patientResponsibility,
          totalPaid: invoice.paidAmount,
          balanceDue: balanceDue,
          discount: invoice.discount,
          tax: invoice.tax,
        },
        "58mm"
      );

      // Print using Windows printer (shows dialog like /printer-test)
      await printerService.printReceipt(detailedHtml);

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
