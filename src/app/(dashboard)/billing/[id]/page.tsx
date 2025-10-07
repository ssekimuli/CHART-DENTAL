
"use client";

import { notFound, useParams } from 'next/navigation';
import { invoices as initialInvoices, patients as initialPatients } from '@/lib/data';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Invoice, Patient, Treatment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';

export default function InvoiceDetailPage() {
  const params = useParams();
  const { id } = params;

  const [invoice, setInvoice] = useState<Invoice | undefined>(initialInvoices.find(i => i.id === id));
  
  const patient = useMemo(() => {
    if (!invoice) return undefined;
    return initialPatients.find(p => p.id === invoice.patientId);
  }, [invoice]);

  const treatments = useMemo(() => {
    if (!patient || !invoice) return [];
    return patient.treatmentPlans.filter(t => invoice.treatmentIds.includes(t.id));
  }, [patient, invoice]);


  if (!invoice || !patient) {
    // We could show a loading state here
    if(!invoice) {
        const foundInvoice = initialInvoices.find(i => i.id === id);
        if (foundInvoice) {
            setInvoice(foundInvoice);
        } else {
            notFound();
        }
    }
    return null;
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
                </TableBody>
            </Table>
        </div>
      </CardContent>
      <CardFooter className="justify-end bg-muted/50 p-6">
        <div className="grid gap-2 text-right">
            <div className="flex justify-end gap-4 font-semibold">
                <span>Total:</span>
                <span>${invoice.amount.toFixed(2)}</span>
            </div>
        </div>
      </CardFooter>
    </Card>
  );
}
