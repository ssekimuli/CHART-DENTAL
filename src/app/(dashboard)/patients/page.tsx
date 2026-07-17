
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle, Search, X } from "lucide-react";
import { PatientsTable } from "./components/patients-table";
import { useBranch } from "@/context/branch-context";
import { useState, useMemo, useEffect } from "react";
import {  hasPermission, hasRole , getCurrentUser } from "@/lib/user";
import type { Patient, BasePatient, PaginatedArray } from "@/lib/types";
import { PatientForm } from "./components/patient-form";
import { useRouter } from "next/navigation";
import { DataImporter } from "@/components/dashboard/data-importer";
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
import { createPatient, deletePatient, getPatients, updatePatient } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPatientFullName } from "@/lib/utils";
import { PaginationControl } from "@/components/ui/pagination-control";

export default function PatientsPage() {
  const router = useRouter();
  const { selectedBranch } = useBranch();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [patientsData, setPatientsData] = useState<PaginatedArray<Patient>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | undefined>(undefined);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Inactive">("all");
  const [genderFilter, setGenderFilter] = useState<"all" | "Male" | "Female" | "Other">("all");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setPage(1);
  }, [selectedBranch, statusFilter, genderFilter, searchQuery]);

  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);

        // Build filters object
        const filters: any = {};

        // Add branch filter
        if (hasRole('Super Admin')) {
          filters.branchId = selectedBranch;
        } else {
          filters.branchId = getCurrentUser()?.branchId;
        }

        // Add status filter
        if (statusFilter !== "all") {
          filters.status = statusFilter;
        }

        // Add gender filter
        if (genderFilter !== "all") {
          filters.gender = genderFilter;
        }

        // Add pagination
        if (searchQuery) {
          filters.perPage = 1000;
        } else {
          filters.page = page;
          filters.perPage = 10;
        }

        const data = await getPatients(filters);
        setPatientsData(data);
        setIsLoading(false);
    }
    fetchData();
  }, [selectedBranch, statusFilter, genderFilter, page, searchQuery, refreshKey]);

  const patients = useMemo(() => {
    // If there's a search query, filter on the client side
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return patientsData.filter(p => {
        const fullName = getPatientFullName(p).toLowerCase();
        const email = p.email.toLowerCase();
        const phone = p.phone?.toLowerCase() || '';
        return fullName.includes(query) || email.includes(query) || phone.includes(query);
      });
    }

    return patientsData;
  }, [patientsData, searchQuery]);
  
  const hasActiveFilters = statusFilter !== "all" || genderFilter !== "all" || searchQuery !== "";

  const handleClearFilters = () => {
    setStatusFilter("all");
    setGenderFilter("all");
    setSearchQuery("");
  };

  const handleOpenForm = (patient?: Patient) => {
    setSelectedPatient(patient);
    setIsFormOpen(true);
  }

  const handleCloseForm = () => {
    setSelectedPatient(undefined);
    setIsFormOpen(false);
  }

  const handleSavePatient = async (data: BasePatient) => {
    if (selectedPatient) {
        // Update
        const updated = await updatePatient(selectedPatient.id, data);
        if (updated) {
            setPatientsData(prev => {
                const updatedList = prev.map(p => p.id === updated.id ? updated : p) as PaginatedArray<Patient>;
                updatedList.meta = prev.meta;
                return updatedList;
            });
        }
    } else {
        // Create
        const newPatient = await createPatient({ ...data, branchId: selectedBranch });
        if (newPatient) {
            setPatientsData(prev => {
                const updatedList = [newPatient, ...prev] as PaginatedArray<Patient>;
                updatedList.meta = prev.meta;
                return updatedList;
            });
        }
    }
    handleCloseForm();
  }
  
  const openDeleteDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDeleteAlertOpen(true);
  }

  const handleDeletePatient = async () => {
    if (selectedPatient) {
        const success = await deletePatient(selectedPatient.id);
        if (success) {
            setPatientsData(prev => {
                const updatedList = prev.filter(p => p.id !== selectedPatient.id) as PaginatedArray<Patient>;
                updatedList.meta = prev.meta;
                return updatedList;
            });
        }
    }
    setIsDeleteAlertOpen(false);
    setSelectedPatient(undefined);
  };
  
  const handleViewPatient = (patientId: string) => {
    router.push(`/patients/${patientId}`);
  };

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Patients</CardTitle>
          <CardDescription>
            View and manage patient records.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission('patients:create') && (
            <>
              <DataImporter 
                type="patients" 
                triggerText="Import Patients" 
                onImportSuccess={() => {
                  setPage(1);
                  setRefreshKey(prev => prev + 1);
                }} 
              />
              <Button onClick={() => handleOpenForm()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Patient
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters bar */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-4">
            <Select value={genderFilter} onValueChange={(value: any) => setGenderFilter(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="outline" onClick={handleClearFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Tabs for Status */}
        <Tabs value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)} className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Patients</TabsTrigger>
            <TabsTrigger value="Active">Active</TabsTrigger>
            <TabsTrigger value="Inactive">Inactive</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {/* Table */}
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <>
                <PatientsTable
                  data={patients}
                  onEdit={handleOpenForm}
                  onDelete={openDeleteDialog}
                  onView={handleViewPatient}
                />
                {!searchQuery && (
                  <PaginationControl
                    currentPage={page}
                    lastPage={patientsData.meta?.last_page || 1}
                    onPageChange={setPage}
                  />
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="Active" className="space-y-4">
            {/* Table */}
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <>
                <PatientsTable
                  data={patients}
                  onEdit={handleOpenForm}
                  onDelete={openDeleteDialog}
                  onView={handleViewPatient}
                />
                {!searchQuery && (
                  <PaginationControl
                    currentPage={page}
                    lastPage={patientsData.meta?.last_page || 1}
                    onPageChange={setPage}
                  />
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="Inactive" className="space-y-4">
            {/* Table */}
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <>
                <PatientsTable
                  data={patients}
                  onEdit={handleOpenForm}
                  onDelete={openDeleteDialog}
                  onView={handleViewPatient}
                />
                {!searchQuery && (
                  <PaginationControl
                    currentPage={page}
                    lastPage={patientsData.meta?.last_page || 1}
                    onPageChange={setPage}
                  />
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
    {isFormOpen && (
      <PatientForm
        patient={selectedPatient}
        onSave={handleSavePatient}
        onOpenChange={handleCloseForm}
      />
    )}
     <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the patient record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedPatient(undefined)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePatient} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
