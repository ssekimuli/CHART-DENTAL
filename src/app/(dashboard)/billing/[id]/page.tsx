"use client";

import { notFound, useParams } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Invoice, Patient, PaymentMethod, PaymentTransaction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Printer, Download, Loader2, ArrowLeft } from 'lucide-react';
import { getInvoiceById, getPatientById } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { hasPermission } from '@/lib/user';
import moment from 'moment';
import { useCurrency } from '@/hooks/use-currency';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { formatCurrency: baseFormatCurrency } = useCurrency();
  const formatCurrency = (value: any) => baseFormatCurrency(value, invoice?.branch?.currency);

  const [invoice, setInvoice] = useState<Invoice | undefined>(undefined);
  const [patient, setPatient] = useState<Patient | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

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

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Implement PDF download logic here
    // You might want to use a library like html2pdf.js or jsPDF
    console.log('Download PDF');
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
              <p className="text-sm text-muted-foreground">Invoice #{invoice.id}</p>
              <CardTitle className="text-3xl">Invoice Details</CardTitle>
          </div>
          <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
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

          <div>
              <h4 className="font-semibold mb-2">Treatments</h4>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Procedure</TableHead>
                          <TableHead className="text-right">Cost</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {treatments.map((treatment, index) => (
                          <TableRow key={index}>
                              <TableCell>{treatment.procedure || 'Untitled Treatment'}</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(treatment.cost)}
                              </TableCell>
                          </TableRow>
                      ))}
                      {treatments.length === 0 && (
                          <TableRow>
                              <TableCell colSpan={2} className="text-center text-muted-foreground">No treatments on this invoice.</TableCell>
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
              <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.amount)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                  <span>Paid:</span>
                  <span>-{formatCurrency(invoice.paidAmount)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2">
                  <span>Balance Due:</span>
                  <span>{formatCurrency(getNumber(invoice.amount) - getNumber(invoice.paidAmount))}</span>
              </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}