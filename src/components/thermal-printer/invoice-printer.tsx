"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";
import type { Invoice } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { getWindowsPrinterService } from "@/lib/windows-printer";
import { getClinicName, getClinicAddress, getClinicPhone } from "@/lib/business-details";

interface InvoicePrinterProps {
  invoice: Invoice;
  businessName?: string;
  businessPhone?: string;
  businessAddress?: string;
}

export function InvoicePrinter({
  invoice,
  businessName: propBusinessName,
  businessPhone: propBusinessPhone,
  businessAddress: propBusinessAddress,
}: InvoicePrinterProps) {
  const { toast } = useToast();
  const [isPrinting, setIsPrinting] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");

  // Load business details from localStorage on mount
  useEffect(() => {
    setBusinessName(propBusinessName || getClinicName());
    setBusinessPhone(propBusinessPhone || getClinicPhone());
    setBusinessAddress(propBusinessAddress || getClinicAddress());
  }, [propBusinessName, propBusinessPhone, propBusinessAddress]);

  const handlePrint = async () => {
    setIsPrinting(true);

    try {
      const printerService = getWindowsPrinterService();

      const treatments = invoice.treatments || [];
      const amount = invoice.amount || 0;
      const date = invoice.issueDate
        ? new Date(invoice.issueDate).toLocaleDateString()
        : new Date().toLocaleDateString();
      const billNumber = String(invoice.id || "INV-001");
      const patientName = String(invoice.patientName || "Patient");

      // Calculate totals for detailed receipt
      const subtotal = treatments.reduce((sum, t) => sum + (typeof t.cost === "number" ? t.cost : 0), 0);
      const balanceDue = (invoice.amount || 0) - (invoice.paidAmount || 0);

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
          paymentMethod: invoice.paymentMethod,
          branchName: (invoice as any).branch?.name,
          labOrderDetails: invoice.lab_order_details ? {
            item: invoice.lab_order_details.item,
            client_name: invoice.lab_order_details.client_name,
            patient_name: invoice.lab_order_details.patient_name,
            tooth: invoice.lab_order_details.tooth,
            material: invoice.lab_order_details.material,
            shade: invoice.lab_order_details.shade,
            status: invoice.lab_order_details.status,
          } : undefined,
          medicines: invoice.medicines ? invoice.medicines.map(m => ({
            name: m.medicine?.name || `Medicine ID: ${m.medicine_id}`,
            unit: m.unit?.unit_name,
            quantity: m.quantity || 0,
            price: typeof m.price === "number" ? m.price : 0,
          })) : undefined,
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
