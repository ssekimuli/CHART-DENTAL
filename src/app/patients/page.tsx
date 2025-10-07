
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { patients as allPatients } from "@/lib/data";
import { PatientsTable } from "./components/patients-table";
import { useBranch } from "@/context/branch-context";
import { useMemo } from "react";
import { currentUser } from "@/lib/user";

export default function PatientsPage() {
  const { selectedBranch } = useBranch();

  const patients = useMemo(() => {
    if (currentUser.role === 'Super Admin') {
      return allPatients.filter(p => p.branchId === selectedBranch);
    }
    return allPatients.filter(p => p.branchId === currentUser.branchId);
  }, [selectedBranch]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Patients</CardTitle>
          <CardDescription>
            Manage your patients and view their records.
          </CardDescription>
        </div>
        <Button>
          <PlusCircle className="mr-2" />
          Add Patient
        </Button>
      </CardHeader>
      <CardContent>
        <PatientsTable data={patients} />
      </CardContent>
    </Card>
  );
}
