
"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { invoices as initialInvoices, patients as allPatients } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { FileDown, PlusCircle } from "lucide-react";
import type { Invoice } from "@/lib/types";
import { InvoiceForm } from "./components/invoice-form";
import { useBranch } from "@/context/branch-context";
import { currentUser } from "@/lib/user";

export default function BillingPage() {
  const { selectedBranch } = useBranch();
  const [allInvoices, setAllInvoices] = useState<Invoice[]>(initialInvoices);
  const [isFormOpen, setIsFormOpen] = useState(false);

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
  
  const filteredPatients = useMemo(() => {
     if (currentUser.role === 'Super Admin') {
      return allPatients.filter(p => p.branchId === selectedBranch);
    }
    return allPatients.filter(p => p.branchId === currentUser.branchId);
  }, [selectedBranch]);

  const invoices = useMemo(() => {
    if (currentUser.role === 'Super Admin') {
      return allInvoices.filter(i => i.branchId === selectedBranch);
    }
    return allInvoices.filter(i => i.branchId === currentUser.branchId);
  }, [selectedBranch, allInvoices]);

  const handleSaveInvoice = (data: Omit<Invoice, 'id' | 'patientName' | 'branchId'>) => {
    const patient = filteredPatients.find(p => p.id === data.patientId);
    if (!patient) return;

    const newInvoice: Invoice = {
      ...data,
      id: `inv${allInvoices.length + 1}`,
      patientName: patient.name,
      branchId: selectedBranch,
    };
    setAllInvoices(prev => [...prev, newInvoice]);
    setIsFormOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Billing</CardTitle>
            <CardDescription>
              Manage invoices and patient billing.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={() => setIsFormOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.patientName}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{invoice.issueDate}</TableCell>
                  <TableCell>{invoice.dueDate}</TableCell>
                  <TableCell className="text-right">
                    ${invoice.amount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        No invoices found for this branch.
                    </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {isFormOpen && (
        <InvoiceForm 
            patients={filteredPatients}
            onSave={handleSaveInvoice}
            onOpenChange={setIsFormOpen}
        />
      )}
    </>
  );
}
