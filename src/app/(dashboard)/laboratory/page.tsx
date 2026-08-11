
"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle, Search, X } from "lucide-react";
import { LabTable } from "./components/lab-table";
import type { LaboratoryOrder, Patient, PaginatedArray } from "@/lib/types";
import { LabOrderForm } from "./components/lab-order-form";
import { useBranch } from "@/context/branch-context";
import { createLabOrder, getLabOrders, getClients, getEmployees } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { hasPermission, hasRole , getCurrentUser } from "@/lib/user";
import { useRouter } from "next/navigation";
import { PaginationControl } from "@/components/ui/pagination-control";
import type { Client } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function LaboratoryPage() {
    const router = useRouter();
    const { selectedBranch } = useBranch();
    const [labOrders, setLabOrders] = useState<PaginatedArray<LaboratoryOrder>>([] as unknown as PaginatedArray<LaboratoryOrder>);
    const [clients, setClients] = useState<Client[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [page, setPage] = useState(1);

    // Filter states
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [clientFilter, setClientFilter] = useState("");
    const [doctorFilter, setDoctorFilter] = useState("");
    const [sentDateFrom, setSentDateFrom] = useState("");
    const [sentDateTo, setSentDateTo] = useState("");
    const [dueDateFrom, setDueDateFrom] = useState("");
    const [dueDateTo, setDueDateTo] = useState("");

    useEffect(() => {
        setPage(1);
    }, [selectedBranch]);

    useEffect(() => {
        if (!hasPermission("laboratory:read")) {
            router.replace("/dashboard");
            return;
        }

        const branchToFetch = hasRole('Super Admin') ? selectedBranch : getCurrentUser()?.branchId;
        const fetchData = async () => {
            setIsLoading(true);
            const [orders, clientsData, employeesData] = await Promise.all([
                getLabOrders(branchToFetch, page, 10, {
                    search: search || undefined,
                    status: statusFilter || undefined,
                    client_id: clientFilter || undefined,
                    doctor_id: doctorFilter || undefined,
                    sent_date_from: sentDateFrom || undefined,
                    sent_date_to: sentDateTo || undefined,
                    due_date_from: dueDateFrom || undefined,
                    due_date_to: dueDateTo || undefined,
                }),
                getClients(),
                getEmployees(branchToFetch)
            ]);
            setLabOrders(orders);
            setClients(clientsData);
            setDoctors(employeesData.filter(emp => emp.role === 'Dentist' || emp.role === 'Hygienist' || emp.role === 'Super Admin'));
            setIsLoading(false);
        };
        fetchData();
    }, [selectedBranch, page, search, statusFilter, clientFilter, doctorFilter, sentDateFrom, sentDateTo, dueDateFrom, dueDateTo, router]);

    const handleClearFilters = () => {
        setSearch("");
        setStatusFilter("");
        setClientFilter("");
        setDoctorFilter("");
        setSentDateFrom("");
        setSentDateTo("");
        setDueDateFrom("");
        setDueDateTo("");
        setPage(1);
    };

    const hasActiveFilters = search || statusFilter || clientFilter || doctorFilter || sentDateFrom || sentDateTo || dueDateFrom || dueDateTo;

    const handleSaveOrder = async (data: Omit<LaboratoryOrder, 'id' | 'branchId'>) => {
        const client = clients.find(c => String(c.id) === String(data.clientId));
        if (!client) return;

        const newOrder = await createLabOrder({ ...data, branchId: selectedBranch });
        if(newOrder) {
            setLabOrders(prev => {
                const updatedList = [newOrder, ...prev] as PaginatedArray<LaboratoryOrder>;
                updatedList.meta = prev.meta;
                return updatedList;
            });
        }
        setIsFormOpen(false);
    }

  return (
    <>
        <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
            <CardTitle>Laboratory</CardTitle>
            <CardDescription>
                Track and manage dental lab orders.
            </CardDescription>
            </div>
            {hasPermission('laboratory:create') && (
                <Button onClick={() => setIsFormOpen(true)}>
                <PlusCircle className="mr-2" />
                Add Order
                </Button>
            )}
        </CardHeader>
        <CardContent className="space-y-6">
            {/* Filters Section */}
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Search & Filter</h3>
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearFilters}
                            className="text-xs"
                        >
                            <X className="h-3 w-3 mr-1" />
                            Clear Filters
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search Input */}
                    <div className="space-y-2">
                        <Label htmlFor="search" className="text-xs">Search</Label>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="search"
                                placeholder="Patient, lab, item..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="pl-8 h-9 text-sm"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-2">
                        <Label htmlFor="status" className="text-xs">Status</Label>
                        <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
                            <SelectTrigger id="status" className="h-9 text-sm">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Statuses</SelectItem>
                                <SelectItem value="Draft">Draft</SelectItem>
                                <SelectItem value="Received">Received</SelectItem>
                                <SelectItem value="In Production">In Production</SelectItem>
                                <SelectItem value="Ready for Delivery">Ready for Delivery</SelectItem>
                                <SelectItem value="Delivered">Delivered</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Client Filter */}
                    <div className="space-y-2">
                        <Label htmlFor="client" className="text-xs">Lab Client</Label>
                        <Select value={clientFilter} onValueChange={(val) => { setClientFilter(val); setPage(1); }}>
                            <SelectTrigger id="client" className="h-9 text-sm">
                                <SelectValue placeholder="All Clients" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Clients</SelectItem>
                                {clients.map(client => (
                                    <SelectItem key={client.id} value={String(client.id)}>
                                        {client.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Doctor Filter */}
                    <div className="space-y-2">
                        <Label htmlFor="doctor" className="text-xs">Doctor</Label>
                        <Select value={doctorFilter} onValueChange={(val) => { setDoctorFilter(val); setPage(1); }}>
                            <SelectTrigger id="doctor" className="h-9 text-sm">
                                <SelectValue placeholder="All Doctors" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Doctors</SelectItem>
                                {doctors.map(doctor => (
                                    <SelectItem key={doctor.id} value={String(doctor.id)}>
                                        {doctor.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Sent Date From */}
                    <div className="space-y-2">
                        <Label htmlFor="sent-from" className="text-xs">Sent Date From</Label>
                        <Input
                            id="sent-from"
                            type="date"
                            value={sentDateFrom}
                            onChange={(e) => { setSentDateFrom(e.target.value); setPage(1); }}
                            className="h-9 text-sm"
                        />
                    </div>

                    {/* Sent Date To */}
                    <div className="space-y-2">
                        <Label htmlFor="sent-to" className="text-xs">Sent Date To</Label>
                        <Input
                            id="sent-to"
                            type="date"
                            value={sentDateTo}
                            onChange={(e) => { setSentDateTo(e.target.value); setPage(1); }}
                            className="h-9 text-sm"
                        />
                    </div>

                    {/* Due Date From */}
                    <div className="space-y-2">
                        <Label htmlFor="due-from" className="text-xs">Due Date From</Label>
                        <Input
                            id="due-from"
                            type="date"
                            value={dueDateFrom}
                            onChange={(e) => { setDueDateFrom(e.target.value); setPage(1); }}
                            className="h-9 text-sm"
                        />
                    </div>

                    {/* Due Date To */}
                    <div className="space-y-2">
                        <Label htmlFor="due-to" className="text-xs">Due Date To</Label>
                        <Input
                            id="due-to"
                            type="date"
                            value={dueDateTo}
                            onChange={(e) => { setDueDateTo(e.target.value); setPage(1); }}
                            className="h-9 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Table and Pagination */}
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : (
                <>
                    <LabTable data={labOrders} onDataChange={setLabOrders} />
                    <PaginationControl
                        currentPage={page}
                        lastPage={labOrders.meta?.last_page || 1}
                        onPageChange={setPage}
                    />
                </>
            )}
        </CardContent>
        </Card>
        {isFormOpen && (
            <LabOrderForm 
                clients={clients}
                doctors={doctors}
                onSave={handleSaveOrder}
                onOpenChange={setIsFormOpen}
            />
        )}
    </>
  );
}
