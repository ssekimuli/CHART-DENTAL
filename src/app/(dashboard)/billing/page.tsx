

"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { FileDown, PlusCircle, MoreHorizontal, Pencil, Trash, Eye, HandCoins, Calendar as CalendarIcon } from "lucide-react";
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
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from "@/components/ui/pagination";


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
  
  // Pagination and filtering state
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pageInput, setPageInput] = useState("1");


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

  const filteredInvoices = useMemo(() => {
    let branchInvoices = allInvoices;
    if (currentUser.role !== 'Super Admin') {
      branchInvoices = branchInvoices.filter(i => i.branchId === currentUser.branchId);
    } else {
        branchInvoices = branchInvoices.filter(i => i.branchId === selectedBranch);
    }

    if (dateRange?.from && dateRange?.to) {
        return branchInvoices.filter(invoice => {
            const issueDate = new Date(invoice.issueDate);
            return issueDate >= dateRange.from! && issueDate <= dateRange.to!;
        });
    }
    return branchInvoices;
  }, [selectedBranch, allInvoices, dateRange]);
  
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredInvoices, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
    setPageInput("1");
  }, [itemsPerPage, dateRange, selectedBranch]);

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  }

  const handleGoToPage = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        const pageNumber = parseInt(pageInput, 10);
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    }
  }


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
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Billing</CardTitle>
            <CardDescription>
              Manage invoices and patient billing.
            </CardDescription>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <div className="flex items-center gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                        "w-[300px] justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                        dateRange.to ? (
                            <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                            </>
                        ) : (
                            format(dateRange.from, "LLL dd, y")
                        )
                        ) : (
                        <span>Pick a date range</span>
                        )}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                    />
                    </PopoverContent>
                </Popover>
                 <Button variant="outline" onClick={() => setDateRange(undefined)} disabled={!dateRange}>Clear</Button>
            </div>
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
              {paginatedInvoices.map((invoice) => (
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
              {paginatedInvoices.length === 0 && !isLoading && (
                 <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                        No invoices found for this period.
                    </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
          )}
        </CardContent>
         <CardFooter className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Rows per page</span>
                <Select value={String(itemsPerPage)} onValueChange={(value) => setItemsPerPage(Number(value))}>
                    <SelectTrigger className="w-20">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {[10, 20, 50, 100].map(val => (
                            <SelectItem key={val} value={String(val)}>{val}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious href="#" onClick={(e) => {e.preventDefault(); setCurrentPage(p => Math.max(1, p-1))}} className={cn({ 'pointer-events-none opacity-50': currentPage === 1})}/>
                    </PaginationItem>
                     <PaginationItem className="flex items-center gap-2 text-sm">
                        <span>Page</span>
                         <Input 
                            type="number" 
                            className="h-8 w-14" 
                            value={pageInput}
                            onChange={handlePageInputChange}
                            onKeyDown={handleGoToPage}
                            min="1"
                            max={totalPages}
                        />
                        <span>of {totalPages}</span>
                    </PaginationItem>
                    <PaginationItem>
                        <PaginationNext href="#" onClick={(e) => {e.preventDefault(); setCurrentPage(p => Math.min(totalPages, p+1))}} className={cn({ 'pointer-events-none opacity-50': currentPage === totalPages})}/>
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
         </CardFooter>
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
