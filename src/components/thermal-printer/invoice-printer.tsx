"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";
import type { Invoice } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { getWindowsPrinterService } from "@/lib/windows-printer";
import { getClinicName, getClinicAddress, getClinicPhone, getClinicSubtitle, getClinicEmail, getReceiptFooter } from "@/lib/business-details";
import { getFacilityReceiptSettings, FacilityReceiptSettings } from "@/lib/api";
import { generateReceiptHTML } from "@/lib/receipt-html-generator";
import { getPatientById } from "@/lib/api";

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
  const [receiptSettings, setReceiptSettings] = useState<FacilityReceiptSettings | null>(null);

  // Load business details from localStorage on mount
  useEffect(() => {
    setBusinessName(propBusinessName || getClinicName());
    setBusinessPhone(propBusinessPhone || getClinicPhone());
    setBusinessAddress(propBusinessAddress || getClinicAddress());

    const loadReceiptSettings = async () => {
      try {
        const s = await getFacilityReceiptSettings();
        if (s) setReceiptSettings(s);
      } catch (err) {
        console.warn("Could not load receipt settings in InvoicePrinter:", err);
      }
    };
    loadReceiptSettings();
  }, [propBusinessName, propBusinessPhone, propBusinessAddress]);

  const handlePrint = async () => {
    setIsPrinting(true);

    try {
      const printerService = getWindowsPrinterService();

      const treatments = invoice.treatments || [];
      const otherCharges = Array.isArray(invoice.otherCharges) ? invoice.otherCharges : [];
      const amount = invoice.amount || 0;
      const date = invoice.issueDate
        ? new Date(invoice.issueDate).toLocaleDateString()
        : new Date().toLocaleDateString();
      const billNumber = String(invoice.receiptNumber || invoice.id || "INV-001");
      const patientName = String(invoice.patientName || "Walk-in Patient");

      // Calculate totals for detailed receipt
      const treatmentsTotal = treatments.reduce((sum, t) => sum + (typeof t.cost === "number" ? t.cost : (parseFloat(t.cost as any) || 0)), 0);
      const otherChargesTotal = otherCharges.reduce((sum, c) => sum + (typeof c.amount === "number" ? c.amount : (parseFloat(c.amount as any) || 0)), 0);
      const calculatedSubtotal = treatmentsTotal + otherChargesTotal;
      const subtotal = calculatedSubtotal > 0 ? calculatedSubtotal : amount;
      const balanceDue = (invoice.amount || 0) - (invoice.paidAmount || 0);

      const branchName = receiptSettings?.clinic_name || (invoice as any).branch?.name || businessName || getClinicName();
      const branchSubtitle = receiptSettings?.subtitle || getClinicSubtitle();
      const branchPhone = receiptSettings?.phone || (invoice as any).branch?.contactNumber || (invoice as any).branch?.phone || (invoice as any).branch?.contact_number || businessPhone || getClinicPhone();
      const branchEmail = receiptSettings?.email || (invoice as any).branch?.email || getClinicEmail();
      const branchAddress = receiptSettings?.address || (invoice as any).branch?.address || businessAddress || getClinicAddress();
      const footerNote = receiptSettings?.receipt_footer || getReceiptFooter();

      let patientPhone = invoice.patient?.phone || (invoice as any).patient?.contact || (invoice as any).patientPhone || "";
      let patientAddress = invoice.patient?.address || (invoice as any).patientAddress || "";

      if (invoice.patientId && (!patientPhone || !patientAddress)) {
        try {
          const p = await getPatientById(invoice.patientId);
          if (p) {
            patientPhone = patientPhone || p.phone || "";
            patientAddress = patientAddress || p.address || "";
          }
        } catch {}
      }

      // For detailed receipt, generateReceiptHTML with all fields
      const detailedHtml = generateReceiptHTML(
        {
          clinicName: branchName,
          clinicSubtitle: branchSubtitle,
          clinicPhone: branchPhone,
          clinicEmail: branchEmail,
          clinicAddress: branchAddress,
          footerNote: footerNote,
          patientName: patientName,
          patientPhone: patientPhone,
          patientAddress: patientAddress,
          date: date,
          billNumber: billNumber,
          treatments: treatments.map(t => ({
            name: String(t.procedure || "Treatment"),
            amount: typeof t.cost === "number" ? t.cost : (parseFloat(t.cost as any) || 0),
          })),
          otherCharges: otherCharges.map(c => ({
            description: String(c.description || "Service"),
            amount: typeof c.amount === "number" ? c.amount : (parseFloat(c.amount as any) || 0),
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
            price: typeof m.price === "number" ? m.price : (parseFloat(m.price as any) || 0),
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
      if (errorMsg.includes("Loading chunk") || errorMsg.includes("ChunkLoadError")) {
        window.location.reload();
        return;
      }
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
