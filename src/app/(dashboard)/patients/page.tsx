
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
import { currentUser, hasPermission } from "@/lib/user";
import type { Patient, BasePatient } from "@/lib/types";
import { PatientForm } from "./components/patient-form";
import { useRouter } from "next/navigation";
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
import { getPatientFullName } from "@/lib/utils";

export default function PatientsPage() {
  const router = useRouter();
  const { selectedBranch } = useBranch();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [patientsData, setPatientsData] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | undefined>(undefined);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Inactive">("all");
  const [genderFilter, setGenderFilter] = useState<"all" | "Male" | "Female" | "Other">("all");

  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);

        // Build filters object
        const filters: any = {};

        // Add branch filter
        if (currentUser.role === 'Super Admin') {
          filters.branchId = selectedBranch;
        } else {
          filters.branchId = currentUser.branchId;
        }

        // Add status filter
        if (statusFilter !== "all") {
          filters.status = statusFilter;
        }

        // Add gender filter
        if (genderFilter !== "all") {
          filters.gender = genderFilter;
        }

        const data = await getPatients(filters);
        setPatientsData(data);
        setIsLoading(false);
    }
    fetchData();
  }, [selectedBranch, statusFilter, genderFilter]);

  const patients = useMemo(() => {
    // If there's a search query, filter on the client side
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return patientsData.filter(p => {
        const fullName = getPatientFullName(p).toLowerCase();
        const email = p.email.toLowerCase();
        const phone = p.phone?.toLowerCase() || '';
        const id = String(p.id).toLowerCase();
        return fullName.includes(query) || email.includes(query) || phone.includes(query) || id.includes(query);
      });
    }

    return patientsData;
  }, [patientsData, searchQuery]);
  
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
            setPatientsData(prev => prev.map(p => p.id === updated.id ? updated : p));
        }
    } else {
        // Create
        const newPatient = await createPatient({ ...data, branchId: selectedBranch });
        if (newPatient) {
            setPatientsData(prev => [...prev, newPatient]);
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
        await deletePatient(selectedPatient.id);
        setPatientsData(prev => prev.filter(p => p.id !== selectedPatient.id));
    }
    setIsDeleteAlertOpen(false);
    setSelectedPatient(undefined);
  };
  
  const handleViewPatient = (patientId: string) => {
    router.push(`/patients/${patientId}`);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setGenderFilter("all");
  };

  const hasActiveFilters = searchQuery || statusFilter !== "all" || genderFilter !== "all";

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Patients</CardTitle>
          <CardDescription>
            Manage your patients and view their records.
          </CardDescription>
        </div>
        {hasPermission('patients:create') && (
          <Button onClick={() => handleOpenForm()}>
            <PlusCircle className="mr-2" />
            Add Patient
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="w-full md:w-[180px]">
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-[180px]">
            <label className="text-sm font-medium mb-2 block">Gender</label>
            <Select value={genderFilter} onValueChange={(value: any) => setGenderFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Genders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {hasActiveFilters && (
            <Button variant="outline" onClick={handleClearFilters} className="w-full md:w-auto">
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          {searchQuery ? (
            <>Showing {patients.length} of {patientsData.length} patients</>
          ) : (
            <>Showing {patients.length} patients</>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
             <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
             </div>
        ) : (
            <PatientsTable 
                data={patients} 
                onEdit={handleOpenForm}
                onDelete={openDeleteDialog}
                onView={handleViewPatient}
            />
        )}
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
