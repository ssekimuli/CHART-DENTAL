
"use client";

import { notFound, useParams } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Invoice, Patient } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Printer, Download, Loader2 } from 'lucide-react';
import { getInvoiceById, getPatientById } from '@/lib/api';

export default function InvoiceDetailPage() {
  const params = useParams();
  const { id } = params;

  const [invoice, setInvoice] = useState<Invoice | undefined>(undefined);
  const [patient, setPatient] = useState<Patient | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof id !== 'string') return;
    const fetchData = async () => {
      setIsLoading(true);
      const invoiceData = await getInvoiceById(id as string);
      if (invoiceData) {
        setInvoice(invoiceData);
        const patientData = await getPatientById(invoiceData.patientId);
        setPatient(patientData);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [id]);

  const treatments = useMemo(() => {
    if (!patient || !invoice) return [];
    return patient.treatmentPlans.filter(t => invoice.treatmentIds.includes(t.id));
  }, [patient, invoice]);

  const subtotal = useMemo(() => {
    return treatments.reduce((sum, t) => sum + t.cost, 0);
  }, [treatments]);

  const otherChargesTotal = useMemo(() => {
    if (!invoice || !invoice.otherCharges) return 0;
    return invoice.otherCharges.reduce((sum, charge) => sum + charge.amount, 0);
  }, [invoice]);


  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle><Loader2 className="mr-2 h-6 w-6 animate-spin" />Loading Invoice...</CardTitle>
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

  if (!invoice || !patient) {
    notFound();
  }
  
  const getStatusVariant = (status: "Paid" | "Pending" | "Overdue") => {
    switch (status) {
      case "Paid":
        return "secondary";
      case "Pending":
        return "default";
      case "Overdue":
        return "destructive";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <p className="text-sm text-muted-foreground">Invoice #{invoice.id}</p>
            <CardTitle className="text-3xl">Invoice Details</CardTitle>
        </div>
        <div className="flex gap-2">
            <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
            <Button><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
            <div>
                <h4 className="font-semibold">Billed To</h4>
                <p>{patient.name}</p>
                <p>{patient.email}</p>
            </div>
             <div>
                <h4 className="font-semibold">Invoice Details</h4>
                <p><strong>Issue Date:</strong> {invoice.issueDate}</p>
                <p><strong>Due Date:</strong> {invoice.dueDate}</p>
                <p><strong>Status:</strong> <Badge variant={getStatusVariant(invoice.status)}>{invoice.status}</Badge></p>
            </div>
        </div>

        <div>
            <h4 className="font-semibold mb-2">Treatments</h4>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Procedure</TableHead>
                        <TableHead>Tooth</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {treatments.map(treatment => (
                        <TableRow key={treatment.id}>
                            <TableCell>{treatment.procedure}</TableCell>
                            <TableCell>{treatment.tooth || 'N/A'}</TableCell>
                            <TableCell>{treatment.date}</TableCell>
                            <TableCell className="text-right">${treatment.cost.toFixed(2)}</TableCell>
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
      </CardContent>
      <CardFooter className="justify-end bg-muted/50 p-6">
        <div className="w-full max-w-sm grid gap-2 text-right">
            <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
            </div>
            {invoice.otherCharges && invoice.otherCharges.length > 0 && (
                 <>
                    <div className="border-t border-dashed my-1"></div>
                     {invoice.otherCharges.map((charge, index) => (
                         <div key={index} className="flex justify-between text-muted-foreground">
                             <span>{charge.description}:</span>
                             <span>${charge.amount.toFixed(2)}</span>
                         </div>
                     ))}
                     <div className="border-t border-dashed my-1"></div>
                 </>
            )}
            <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2">
                <span>Total:</span>
                <span>${invoice.amount.toFixed(2)}</span>
            </div>
        </div>
      </CardFooter>
    </Card>
  );
}
