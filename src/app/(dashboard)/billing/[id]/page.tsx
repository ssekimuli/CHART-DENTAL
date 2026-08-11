"use client";

import { notFound, useParams } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Invoice, Patient, PaymentMethod, PaymentTransaction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Printer, Download, Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import { getInvoiceById, getPatientById, deleteInvoice } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { hasPermission } from '@/lib/user';
import moment from 'moment';
import { useCurrency } from '@/hooks/use-currency';
import { InvoicePrinter } from '@/components/thermal-printer/invoice-printer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { formatCurrency: baseFormatCurrency } = useCurrency();
  const formatCurrency = (value: any) => baseFormatCurrency(value, invoice?.branch?.currency);

  const [invoice, setInvoice] = useState<Invoice | undefined>(undefined);
  const [patient, setPatient] = useState<Patient | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!hasPermission('billing:read')) {
      router.replace('/dashboard');
      return;
    }
    
    if (typeof id !== 'string') {
      notFound();
      return;
    }
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const invoiceData = await getInvoiceById(id as string);
        if (invoiceData) {
          setInvoice(invoiceData);
          // Check if patientId exists before fetching
          if (invoiceData.patientId) {
            const patientData = await getPatientById(invoiceData.patientId);
            setPatient(patientData);
          }
        } else {
          // If no invoice found, show 404
          notFound();
        }
      } catch (error) {
        console.error('Error fetching invoice:', error);
        notFound();
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, router]);

  const treatments = useMemo(() => {
    if (!invoice) return [];
    return invoice.treatments || [];
  }, [invoice]);

  const subtotal = useMemo(() => {
    return treatments.reduce((sum, t) => {
      // ✅ FIX: Ensure cost is a number
      const cost = typeof t.cost === 'string' ? parseFloat(t.cost) : (t.cost || 0);
      return sum + (isNaN(cost) ? 0 : cost);
    }, 0);
  }, [treatments]);

  const otherChargesTotal = useMemo(() => {
    if (!invoice || !invoice.otherCharges) return 0;
    return invoice.otherCharges.reduce((sum, charge) => {
      // ✅ FIX: Ensure amount is a number
      const amount = typeof charge.amount === 'string' ? parseFloat(charge.amount) : (charge.amount || 0);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  }, [invoice]);

  const getStatusVariant = (status: "Paid" | "Pending" | "Overdue") => {
    switch (status) {
      case "Paid":
        return "secondary";
      case "Pending":
        return "default";
      case "Overdue":
        return "destructive";
      default:
        return "default";
    }
  };



  // ✅ Helper function to safely get number value
  const getNumber = (value: any): number => {
    if (value === undefined || value === null) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
  };

  const getPatientDisplayName = (): string => {
    if (patient) {
        const patientAny = patient as any;
        if (patientAny.first_name || patientAny.last_name) {
             return `${patientAny.first_name || ''} ${patientAny.last_name || ''}`.trim();
        }
    }
    return invoice?.patientName || 'Unknown Patient';
  };

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    return moment(date).format("MMM DD, YYYY");
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
        const html2pdf = (await import('html2pdf.js')).default;
        const element = document.getElementById('invoice-content');
        if (!element) return;
        const opt = {
          margin:       0.5,
          filename:     `invoice_${invoice?.id || 'unknown'}.pdf`,
          image:        { type: 'jpeg' as const, quality: 0.98 },
          html2canvas:  { scale: 2 },
          jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' as const }
        };
        html2pdf().set(opt).from(element).save();
    } catch (e) {
        console.error("PDF generation failed", e);
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;
    setIsDeleting(true);
    try {
      await deleteInvoice(invoice.id);
      router.push('/billing');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            Loading Invoice...
          </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                <div className="h-8 w-1/4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-20 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-40 w-full bg-gray-200 rounded animate-pulse"></div>
            </div>
        </CardContent>
      </Card>
    );
  }

  if (!invoice) {
    notFound();
  }
  
  return (
    <div className="space-y-4">
      <Button 
        variant="outline" 
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card id="invoice-content">
        <CardHeader className="flex flex-row items-center justify-between" data-html2canvas-ignore="true">
          <div>
              <p className="text-sm text-muted-foreground">Invoice #{invoice.id}</p>
              <CardTitle className="text-3xl">Invoice Details</CardTitle>
          </div>
          <div className="flex gap-2">
              {hasPermission('billing:delete') && (
                <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              )}
              {invoice && (
                <InvoicePrinter
                  invoice={invoice}
                  businessName="CHART DENTAL"
                  businessPhone="+256 XXX XXX XXX"
                  businessAddress="Kampala, Uganda"
                />
              )}
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </Button>
          </div>
        </CardHeader>
        <div className="hidden print:block text-2xl font-bold p-6 border-b" data-html2canvas-show="true">
             <div className="flex justify-between items-center">
                 <span>CHART DENTAL</span>
                 <span className="text-xl">Invoice #{invoice.id}</span>
             </div>
        </div>
        <CardContent className="space-y-8 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <h4 className="font-semibold mb-2">Billed To </h4>
                  <p className="font-medium">{getPatientDisplayName()}</p>
                  <p className="text-muted-foreground">{patient?.email || 'No email'}</p>
                  {patient?.phone && (
                    <p className="text-muted-foreground">{patient.phone}</p>
                  )}
              </div>
               <div>
                  <h4 className="font-semibold mb-2">Invoice Details</h4>
                  <div className="space-y-1">
                    <p><span className="font-medium">Issue Date:</span> {formatDate(invoice.issueDate)}</p>
                    <p><span className="font-medium">Due Date:</span> {formatDate(invoice.dueDate)}</p>
                    <p><span className="font-medium">Status:</span> <Badge variant={getStatusVariant(invoice.status)}>{invoice.status}</Badge></p>
                    {invoice.paymentMethod && (
                      <p><span className="font-medium">Payment Method:</span> {invoice.paymentMethod}</p>
                    )}
                    {invoice.branch?.name ? (
                      <p><span className="font-medium">Branch:</span> {invoice.branch.name}</p>
                    ) : invoice.branchId ? (
                      <p><span className="font-medium">Branch ID:</span> {invoice.branchId}</p>
                    ) : null}
                  </div>
              </div>
          </div>

          {invoice.lab_order_details && (
            <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <span className="text-lg">🧪</span> Lab Order Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Lab/Client</p>
                    <p className="font-medium">{invoice.lab_order_details.client_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Patient Name</p>
                    <p className="font-medium">{invoice.lab_order_details.patient_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Item</p>
                    <p className="font-medium">{invoice.lab_order_details.item || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tooth Number</p>
                    <p className="font-medium">{invoice.lab_order_details.tooth ? `#${invoice.lab_order_details.tooth}` : 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Lab Status</p>
                    <Badge className="mt-1">{invoice.lab_order_details.status || 'N/A'}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sent Date</p>
                    <p className="font-medium">{invoice.lab_order_details.sent_date ? formatDate(invoice.lab_order_details.sent_date) : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="font-medium">{invoice.lab_order_details.due_date ? formatDate(invoice.lab_order_details.due_date) : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Received Date</p>
                    <p className="font-medium">{invoice.lab_order_details.received_date ? formatDate(invoice.lab_order_details.received_date) : 'Pending'}</p>
                  </div>
                </div>
              </div>
              {(invoice.lab_order_details.material || invoice.lab_order_details.shade || invoice.lab_order_details.instructions) && (
                <div className="mt-4 pt-4 border-t space-y-2">
                  {invoice.lab_order_details.material && (
                    <div>
                      <p className="text-sm text-muted-foreground">Material</p>
                      <p className="font-medium">{invoice.lab_order_details.material}</p>
                    </div>
                  )}
                  {invoice.lab_order_details.shade && (
                    <div>
                      <p className="text-sm text-muted-foreground">Shade</p>
                      <p className="font-medium">{invoice.lab_order_details.shade}</p>
                    </div>
                  )}
                  {invoice.lab_order_details.instructions && (
                    <div>
                      <p className="text-sm text-muted-foreground">Special Instructions</p>
                      <p className="font-medium">{invoice.lab_order_details.instructions}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
              <h4 className="font-semibold mb-2">Treatments</h4>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Procedure</TableHead>
                          <TableHead className="text-right">Ins. Portion</TableHead>
                          <TableHead className="text-right">Pat. Portion</TableHead>
                          <TableHead className="text-right">Total Cost</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {treatments.map((treatment, index) => (
                          <TableRow key={index}>
                              <TableCell>{treatment.procedure || 'Untitled Treatment'}</TableCell>
                              <TableCell className="text-right text-blue-600">
                                {formatCurrency(treatment.insuranceAmount || 0)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(treatment.patientAmount ?? treatment.cost)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(treatment.cost)}
                              </TableCell>
                          </TableRow>
                      ))}
                      {treatments.length === 0 && (
                          <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground">No treatments on this invoice.</TableCell>
                          </TableRow>
                      )}
                  </TableBody>
              </Table>
          </div>

          {invoice.medicines && invoice.medicines.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Prescribed Medicines</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.medicines.map((med, index) => {
                    const medName = med.medicine?.name || `Medicine ID: ${med.medicine_id}`;
                    const unitName = med.unit?.unit_name || 'Unit';
                    const itemPrice = Number(med.price) || 0;
                    const itemQty = Number(med.quantity) || 0;
                    const itemTotal = itemPrice * itemQty;
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{medName}</TableCell>
                        <TableCell>{unitName}</TableCell>
                        <TableCell className="text-right">{formatCurrency(itemPrice)}</TableCell>
                        <TableCell className="text-right">{itemQty}</TableCell>
                        <TableCell className="text-right">{formatCurrency(itemTotal)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {(invoice.transactions && invoice.transactions.length > 0) && (
            <div>
              <h4 className="font-semibold mb-2">Payment Transactions</h4>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {invoice.transactions.map((transaction, index) => (
                          <TableRow key={transaction.id || index}>
                              <TableCell>{formatDate(transaction.date)}</TableCell>
                              <TableCell>{transaction.method || 'Unknown'}</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(transaction.amount)}
                              </TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-end bg-muted/50 p-6">
          <div className="w-full max-w-sm grid gap-2 text-right">
              <div className="flex justify-between">
                  <span>Treatments Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
              </div>
              {invoice.medicines && invoice.medicines.length > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                      <span>Medicines Subtotal:</span>
                      <span>
                        {formatCurrency(
                          invoice.medicines.reduce((sum, med) => sum + (Number(med.price) * Number(med.quantity)), 0)
                        )}
                      </span>
                  </div>
              )}
              {invoice.otherCharges && invoice.otherCharges.length > 0 && (
                   <>
                      <div className="border-t border-dashed my-1"></div>
                       {invoice.otherCharges.map((charge, index) => (
                           <div key={index} className="flex justify-between text-muted-foreground">
                               <span>{charge.description || 'Other Charge'}:</span>
                               <span>{formatCurrency(charge.amount)}</span>
                           </div>
                       ))}
                       <div className="border-t border-dashed my-1"></div>
                   </>
              )}
              {invoice.discount !== undefined && invoice.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                      <span>Discount ({invoice.discount}%):</span>
                      <span>-{formatCurrency((subtotal + otherChargesTotal + (invoice.medicines?.reduce((s, m) => s + (Number(m.price) * Number(m.quantity)), 0) || 0)) * (invoice.discount / 100))}</span>
                  </div>
               )}
               {invoice.tax !== undefined && invoice.tax > 0 && (
                  <div className="flex justify-between text-red-600">
                      <span>Tax ({invoice.tax}%):</span>
                      <span>+{formatCurrency(((subtotal + otherChargesTotal + (invoice.medicines?.reduce((s, m) => s + (Number(m.price) * Number(m.quantity)), 0) || 0)) * (1 - (invoice.discount || 0) / 100)) * (invoice.tax / 100))}</span>
                  </div>
               )}
               <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2">
                   <span>Total Bill:</span>
                   <span>{formatCurrency(invoice.amount)}</span>
               </div>
               {((invoice.insuranceResponsibility || 0) > 0) && (
                  <>
                      <div className="flex justify-between text-blue-600 text-sm mt-1">
                          <span>Insurance Portion:</span>
                          <span>{formatCurrency(invoice.insuranceResponsibility)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                          <span>Patient Portion:</span>
                          <span>{formatCurrency(invoice.patientResponsibility)}</span>
                      </div>
                  </>
               )}
               <div className="flex justify-between text-muted-foreground mt-2">
                   <span>Total Paid:</span>
                   <span>-{formatCurrency(invoice.paidAmount)}</span>
               </div>
               <div className="flex justify-between font-semibold mt-2 pt-2 border-t text-lg">
                   <span>Balance Due:</span>
                   <span className={getNumber(invoice.amount) - getNumber(invoice.paidAmount) > 0 ? "text-destructive" : ""}>
                     {formatCurrency(getNumber(invoice.amount) - getNumber(invoice.paidAmount))}
                   </span>
               </div>
               {((invoice.insuranceResponsibility || 0) > 0) && (
                  <div className="flex flex-col items-end text-sm text-muted-foreground mt-1">
                      <span>Patient Balance: {formatCurrency(invoice.patientBalance || Math.max(0, invoice.patientResponsibility! - (invoice.patientPaidAmount || 0)))}</span>
                      <span>Insurance Balance: {formatCurrency(invoice.insuranceBalance || Math.max(0, invoice.insuranceResponsibility! - (invoice.insurancePaidAmount || 0)))}</span>
                  </div>
               )}
          </div>
        </CardFooter>
      </Card>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Do you really want to delete this invoice? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>No</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }} 
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}