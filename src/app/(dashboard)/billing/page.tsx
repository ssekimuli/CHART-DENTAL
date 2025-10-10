

"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { FileDown, PlusCircle, MoreHorizontal, Pencil, Trash, Eye, HandCoins } from "lucide-react";
import type { Invoice, Patient, InvoiceTreatment } from "@/lib/types";
import { InvoiceForm } from "./components/invoice-form";
import { useBranch } from "@/context/branch-context";
import { currentUser } from "@/lib/user";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
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
import { createInvoice, deleteInvoice, getInvoices, getPatients, processPayment, updateInvoice, updatePatient } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentForm } from "./components/payment-form";

export default function BillingPage() {
  const router = useRouter();
  const { selectedBranch } = useBranch();
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>(undefined);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [invoicesData, patientsData] = await Promise.all([getInvoices(), getPatients()]);
      setAllInvoices(invoicesData);
      setAllPatients(patientsData);
      setIsLoading(false);
    };
    fetchData();
  }, []);

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
  }, [selectedBranch, allPatients]);

  const invoices = useMemo(() => {
    if (currentUser.role === 'Super Admin') {
      return allInvoices.filter(i => i.branchId === selectedBranch);
    }
    return allInvoices.filter(i => i.branchId === currentUser.branchId);
  }, [selectedBranch, allInvoices]);

  const handleOpenForm = (invoice?: Invoice) => {
    setSelectedInvoice(invoice);
    setIsFormOpen(true);
  }

  const handleCloseForm = () => {
    setSelectedInvoice(undefined);
    setIsFormOpen(false);
  }

  const handleOpenPaymentForm = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPaymentFormOpen(true);
  }

  const handleClosePaymentForm = () => {
    setSelectedInvoice(undefined);
    setIsPaymentFormOpen(false);
  }

  const handleSaveInvoice = async (data: Omit<Invoice, 'id' | 'paidAmount' | 'patientName' | 'branchId' | 'amount' | 'treatmentIds'>, treatments: InvoiceTreatment[]) => {
    const patient = filteredPatients.find(p => p.id === data.patientId);
    if (!patient) return;

    if (selectedInvoice) {
        // Update
        const updated = await updateInvoice(selectedInvoice.id, { ...data, patientName: patient.name });
        if(updated) {
            setAllInvoices(prev => prev.map(i => i.id === updated.id ? updated : i));
        }
    } else {
        // Create
        const newInvoice = await createInvoice({ ...data, patientName: patient.name, branchId: selectedBranch });
        if (newInvoice) {
            setAllInvoices(prev => [newInvoice, ...prev]);
        }
    }
    
    handleCloseForm();
  };

  const handleProcessPayment = async (invoiceId: string, amount: number, method: string) => {
    const updated = await processPayment(invoiceId, amount, method);
    if (updated) {
        setAllInvoices(prev => prev.map(i => i.id === updated.id ? updated : i));
    }
    handleClosePaymentForm();
  }

  const handleDeleteInvoice = async () => {
    if (selectedInvoice) {
        await deleteInvoice(selectedInvoice.id);
        setAllInvoices(prev => prev.filter(i => i.id !== selectedInvoice.id));
    }
    setIsDeleteAlertOpen(false);
    setSelectedInvoice(undefined);
  };

  const openDeleteDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDeleteAlertOpen(true);
  }

  const handleViewInvoice = (invoiceId: string) => {
    router.push(`/billing/${invoiceId}`);
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
            <Button onClick={() => handleOpenForm()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid Amount</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                  <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                  <TableCell>${invoice.paidAmount.toFixed(2)}</TableCell>
                  <TableCell>${(invoice.amount - invoice.paidAmount).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                             <DropdownMenuItem onClick={() => handleViewInvoice(invoice.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenForm(invoice)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleOpenPaymentForm(invoice)} disabled={invoice.status === 'Paid'}>
                                <HandCoins className="mr-2 h-4 w-4" />
                                Pay
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => openDeleteDialog(invoice)}>
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && !isLoading && (
                 <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                        No invoices found for this branch.
                    </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
      {isFormOpen && (
        <InvoiceForm 
            invoice={selectedInvoice}
            patients={filteredPatients}
            onSave={handleSaveInvoice}
            onOpenChange={handleCloseForm}
        />
      )}
      {isPaymentFormOpen && selectedInvoice && (
        <PaymentForm
            invoice={selectedInvoice}
            onSave={handleProcessPayment}
            onOpenChange={handleClosePaymentForm}
        />
      )}
       <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the invoice.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedInvoice(undefined)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInvoice} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
