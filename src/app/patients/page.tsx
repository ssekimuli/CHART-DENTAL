import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { patients } from "@/lib/data";
import { PatientsTable } from "./components/patients-table";

export default function PatientsPage() {
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
