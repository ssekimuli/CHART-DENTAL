"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import moment from "moment";
import customAxios from "@/lib/axios";
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
import { FileDown, PlusCircle, MoreHorizontal, Pencil, Trash, Eye, HandCoins, Calendar as CalendarIcon, Search, ChevronRight, ChevronDown, Printer, FileText } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";


export default function BillingPage() {
  const router = useRouter();
  const { selectedBranch } = useBranch();
  const { formatCurrency } = useCurrency();
  const [allInvoices, setAllInvoices] = useState<PaginatedArray<Invoice>>([] as unknown as PaginatedArray<Invoice>);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>(undefined);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | number | null>(null);

  // Claim form states
  const [isClaimFormOpen, setIsClaimFormOpen] = useState(false);
  const [selectedInvoiceForClaim, setSelectedInvoiceForClaim] = useState<any>(null);
  const [patientInsurances, setPatientInsurances] = useState<any[]>([]);
  const [claimFormData, setClaimFormData] = useState({
    patient_insurance_id: '',
    claim_number: '',
    total_amount: '',
    claimed_amount: '',
    status: 'pending'
  });
  const { toast } = useToast();

  const toggleExpand = (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    setExpandedInvoiceId(prev => prev === id ? null : id);
  };
  
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

  const handleOpenClaimForm = async (invoice: any) => {
    setSelectedInvoiceForClaim(invoice);
    let policies: any[] = [];
    let defaultPolicyId = '';
    try {
      const res = await customAxios.get('/patient-insurances');
      policies = res.data.filter((ins: any) => String(ins.patient_id) === String(invoice.patientId));
      setPatientInsurances(policies);
      if (policies.length > 0) {
        defaultPolicyId = String(policies[0].id);
      }
    } catch (e) {
      console.error(e);
    }
    
    const balance = Number(invoice.amount) - Number(invoice.paidAmount || 0);
    
    setClaimFormData({
      patient_insurance_id: defaultPolicyId,
      claim_number: `CLM-${Math.floor(1000 + Math.random() * 9000)}`,
      total_amount: invoice.amount,
      claimed_amount: balance.toString(),
      status: 'pending'
    });
    setIsClaimFormOpen(true);
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await customAxios.post('/insurance-claims', {
        ...claimFormData,
        invoice_id: selectedInvoiceForClaim.id
      });
      toast({ title: 'Success', description: 'Claim generated successfully!' });
      setIsClaimFormOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate claim.', variant: 'destructive' });
    }
  };

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
          patientName: patient ? patient.first_name + ' ' + patient.last_name : undefined,
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
          patientName: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown',
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

  const handlePrintReceipt = (invoiceId: string | number) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    iframe.style.left = '-9999px';
    iframe.src = `/receipt/${invoiceId}`;
    document.body.appendChild(iframe);

    // The receipt page will trigger print automatically after loading.
    // Clean up the iframe after a reasonable time.
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 15000);
  };

  // ADD THIS: Function to format date
  const formatDate = (date: string) => {
    return moment(date).format("MMM DD, YYYY");
  };

  if (!isMounted) return null;

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
                <Button onClick={() => router.push('/billing/new')}>
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
                <React.Fragment key={invoice.id}>
                <TableRow onClick={() => handleViewInvoice(invoice.id)} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" className="h-6 w-6 mr-2" onClick={(e) => toggleExpand(e, invoice.id)}>
                        {expandedInvoiceId === invoice.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                        {invoice.id}
                    </div>
                  </TableCell>
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
                            <DropdownMenuItem onClick={() => handlePrintReceipt(invoice.id)}>
                                <Printer className="mr-2 h-4 w-4" />
                                Print Receipt (POS)
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
                            <DropdownMenuItem onClick={() => handleOpenClaimForm(invoice)}>
                                <FileText className="mr-2 h-4 w-4" />
                                File Claim
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
                {expandedInvoiceId === invoice.id && (
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableCell colSpan={8} className="p-0">
                      <div className="p-4 border-b">
                        <h4 className="font-semibold mb-2 text-sm">Payment Transactions</h4>
                        {invoice.transactions && invoice.transactions.length > 0 ? (
                          <div className="rounded-md border bg-background">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="h-8">Date</TableHead>
                                    <TableHead className="h-8">Method</TableHead>
                                    <TableHead className="text-right h-8">Amount</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {invoice.transactions.map((txn: any) => (
                                    <TableRow key={txn.id}>
                                      <TableCell className="py-2">{formatDate(txn.date)}</TableCell>
                                      <TableCell className="py-2">{txn.method}</TableCell>
                                      <TableCell className="text-right py-2">{formatCurrency(txn.amount)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No payment transactions found for this invoice.</p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                </React.Fragment>
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

      <Dialog open={isClaimFormOpen} onOpenChange={setIsClaimFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>File Insurance Claim for Invoice #{selectedInvoiceForClaim?.id}</DialogTitle>
            <DialogDescription>Create a claim linked directly to this invoice.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleClaimSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Patient Insurance Policy</label>
              <Select 
                value={claimFormData.patient_insurance_id}
                onValueChange={(val) => setClaimFormData({...claimFormData, patient_insurance_id: val})}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a policy..." />
                </SelectTrigger>
                <SelectContent>
                  {patientInsurances.map((ins: any) => (
                    <SelectItem key={ins.id} value={String(ins.id)}>
                      {ins.provider_name} ({ins.policy_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Claim Number</label>
              <Input required value={claimFormData.claim_number} onChange={(e) => setClaimFormData({...claimFormData, claim_number: e.target.value})} placeholder="CLM-XXXX" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Total Invoice Amount</label>
                <Input required type="number" step="0.01" value={claimFormData.total_amount} onChange={(e) => setClaimFormData({...claimFormData, total_amount: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Claimed Amount</label>
                <Input required type="number" step="0.01" value={claimFormData.claimed_amount} onChange={(e) => setClaimFormData({...claimFormData, claimed_amount: e.target.value})} />
              </div>
            </div>
            <Button type="submit" className="w-full">Submit Claim</Button>
          </form>
        </DialogContent>
      </Dialog>
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