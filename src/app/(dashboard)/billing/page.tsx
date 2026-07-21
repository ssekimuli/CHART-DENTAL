"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import moment from "moment";
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
import { FileDown, PlusCircle, MoreHorizontal, Pencil, Trash, Eye, HandCoins, Calendar as CalendarIcon, Search } from "lucide-react";
import type { Invoice, Patient, InvoiceTreatment, PaginatedArray } from "@/lib/types";
import { InvoiceForm } from "./components/invoice-form";
import { useBranch } from "@/context/branch-context";
import {  hasPermission, hasRole , getCurrentUser } from "@/lib/user";
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
import { createNewInvoice, deleteInvoice, getInvoices, getPatientList, processPayment, updateInvoice, updatePatient } from "@/lib/api";
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
import { useCurrency } from "@/hooks/use-currency";


export default function BillingPage() {
  const router = useRouter();
  const { selectedBranch } = useBranch();
  const { formatCurrency } = useCurrency();
  const [allInvoices, setAllInvoices] = useState<PaginatedArray<Invoice>>([] as unknown as PaginatedArray<Invoice>);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>(undefined);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  
  // Pagination and filtering state
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pageInput, setPageInput] = useState("1");

  // Memoize date range to prevent unnecessary re-renders
  const dateRangeString = useMemo(() => {
    if (!dateRange?.from) return undefined;
    return JSON.stringify({
      from: dateRange.from.toISOString(),
      to: dateRange.to?.toISOString()
    });
  }, [dateRange]);

  useEffect(() => {
    if (!hasPermission('billing:read')) {
        router.replace('/dashboard');
        return;
    }
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [invoicesData, patientsData] = await Promise.all([
          getInvoices({
            branchId: selectedBranch,
            searchQuery,
            dateRange,
            page: currentPage,
            perPage: itemsPerPage
          }),
          getPatientList()
        ]);
        setAllInvoices(invoicesData);
        // patientsData may be typed as BasePatient[] from the API; cast to Patient[] to satisfy state typing
        setAllPatients(patientsData as unknown as Patient[]);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Optionally show error toast here
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedBranch, searchQuery, dateRange, currentPage, itemsPerPage, router]);

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
    if (hasRole('Super Admin')) {
      return allPatients.filter(p => p.branchId === selectedBranch);
    }
    return allPatients.filter(p => p.branchId === getCurrentUser()?.branchId);
  }, [selectedBranch, allPatients]);

  const filteredInvoices = allInvoices;
  
  const totalPages = allInvoices.meta?.last_page || 1;
  
  const paginatedInvoices = allInvoices;

  useEffect(() => {
    setCurrentPage(1);
    setPageInput("1");
  }, [itemsPerPage, dateRange, selectedBranch, searchQuery]);

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

  const handleSaveInvoice = async (data: Omit<Invoice, 'id' | 'paidAmount' | 'patientName' | 'branchId' | 'amount'>, treatments: InvoiceTreatment[]) => {
    const patient = data.patientId ? filteredPatients.find(p => String(p.id) === String(data.patientId)) : undefined;
    const branchId = selectedBranch || getCurrentUser()?.branchId;
    if (!branchId) {
      console.error('Cannot save invoice: missing branch', { selectedBranch, branchId, data });
      return;
    }

    console.log('Saving invoice', { data, treatments, branchId, selectedInvoice });

    try {
      if (selectedInvoice) {
        // Update existing invoice
        const updated = await updateInvoice(selectedInvoice.id, {
          ...data,
          patientName: patient ? patient.first_name + ' ' + patient.last_name : null,
          treatments,
        });
        if (updated) {
          setAllInvoices(prev => {
            const updatedList = prev.map(i => i.id === updated.id ? updated : i) as PaginatedArray<Invoice>;
            updatedList.meta = prev.meta;
            return updatedList;
          });
        }
      } else {
        // Create new invoice using new API helper
        const newInvoice = await createNewInvoice({
          ...data,
          patientName: patient ? `${patient.first_name} ${patient.last_name}` : null,
          branchId,
          treatments,
        });
        if (newInvoice) {
          setAllInvoices(prev => {
            const updatedList = [newInvoice, ...prev] as PaginatedArray<Invoice>;
            updatedList.meta = prev.meta;
            return updatedList;
          });
        }
      }
      handleCloseForm();
    } catch (error) {
      console.error('Error saving invoice:', error);
      // Optionally show error toast here
    }
  };

  const handleProcessPayment = async (invoiceId: string, amount: number, method: string) => {
    try {
      const updated = await processPayment(invoiceId, amount, method);
      if (updated) {
        setAllInvoices(prev => {
          const updatedList = prev.map(i => i.id === updated.id ? updated : i) as PaginatedArray<Invoice>;
          updatedList.meta = prev.meta;
          return updatedList;
        });
      }
      handleClosePaymentForm();
    } catch (error) {
      console.error('Error processing payment:', error);
      // Optionally show error toast here
    }
  }

  const handleDeleteInvoice = async () => {
    if (selectedInvoice) {
      try {
        await deleteInvoice(selectedInvoice.id);
        setAllInvoices(prev => {
          const updatedList = prev.filter(i => i.id !== selectedInvoice.id) as PaginatedArray<Invoice>;
          updatedList.meta = prev.meta;
          return updatedList;
        });
      } catch (error) {
        console.error('Error deleting invoice:', error);
        // Optionally show error toast here
      }
    }
    setIsDeleteAlertOpen(false);
    setSelectedInvoice(undefined);
  };

  const openDeleteDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDeleteAlertOpen(true);
  }

  const handleViewInvoice = (invoiceId: string | number) => {
    router.push(`/billing/${invoiceId}`);
  };

  // ADD THIS: Function to format date
  const formatDate = (date: string) => {
    return moment(date).format("MMM DD, YYYY");
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
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by patient or ID..."
                    className="pl-8 sm:w-[300px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            {hasPermission('billing:create') && (
                <Button onClick={() => handleOpenForm()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Invoice
                </Button>
            )}
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
                <TableRow key={invoice.id} onClick={() => handleViewInvoice(invoice.id)} className="cursor-pointer">
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.patientName || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDate(invoice.issueDate)}
                  </TableCell>
                  <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                  <TableCell>{formatCurrency(invoice.paidAmount)}</TableCell>
                  <TableCell>{formatCurrency(invoice.amount - invoice.paidAmount)}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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
                            {hasPermission('billing:update') && (
                                <DropdownMenuItem onClick={() => handleOpenForm(invoice)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </DropdownMenuItem>
                            )}
                             <DropdownMenuItem onClick={() => handleOpenPaymentForm(invoice)} disabled={invoice.status === 'Paid'}>
                                <HandCoins className="mr-2 h-4 w-4" />
                                Pay
                            </DropdownMenuItem>
                            {hasPermission('billing:delete') && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600" onClick={() => openDeleteDialog(invoice)}>
                                        <Trash className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedInvoices.length === 0 && !isLoading && (
                 <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                        No invoices found.
                    </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
          )}
        </CardContent>
         <CardFooter className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                    <PopoverContent className="w-auto p-0" align="start">
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
                 <Button variant="outline" size="sm" onClick={() => setDateRange(undefined)} disabled={!dateRange}>Clear</Button>
            </div>
             <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Rows per page</span>
                <Select value={String(itemsPerPage)} onValueChange={(value) => setItemsPerPage(Number(value))}>
                    <SelectTrigger className="w-20 h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {[10, 20, 50, 100].map(val => (
                            <SelectItem key={val} value={String(val)}>{val}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious href="#" onClick={(e) => {e.preventDefault(); setCurrentPage(p => Math.max(1, p-1))}} className={cn('h-9', { 'pointer-events-none opacity-50': currentPage === 1})}/>
                        </PaginationItem>
                        <PaginationItem className="flex items-center gap-2 text-sm">
                            <span>Page</span>
                            <Input 
                                type="number" 
                                className="h-9 w-14" 
                                value={pageInput}
                                onChange={handlePageInputChange}
                                onKeyDown={handleGoToPage}
                                min="1"
                                max={totalPages}
                            />
                            <span>of {totalPages}</span>
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext href="#" onClick={(e) => {e.preventDefault(); setCurrentPage(p => Math.min(totalPages, p+1))}} className={cn('h-9', { 'pointer-events-none opacity-50': currentPage === totalPages})}/>
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
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