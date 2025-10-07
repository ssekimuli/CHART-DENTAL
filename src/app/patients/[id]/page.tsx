
"use client";

import { notFound } from "next/navigation";
import { patients } from "@/lib/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DentalChart } from "./components/dental-chart";
import { AITreatmentPlan } from "./components/ai-treatment-plan";
import Image from "next/image";
import { summarizePatientHistory } from "@/ai/flows/summarize-patient-history";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import type { Patient, Treatment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { TreatmentPlanForm } from "./components/treatment-plan-form";

export default function PatientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [patient, setPatient] = useState<Patient | undefined>(
    patients.find((p) => p.id === params.id)
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [historySummary, setHistorySummary] = useState<{ summary: string } | null>(null);

  useEffect(() => {
    if (patient) {
      summarizePatientHistory({ patientHistory: patient.history }).then(setHistorySummary);
    }
  }, [patient]);


  if (!patient) {
    return notFound();
  }

  const handleAddTreatment = (newTreatment: Omit<Treatment, 'id' | 'date'>) => {
    setPatient(prevPatient => {
      if (!prevPatient) return prevPatient;
      const newPlan: Treatment = {
        ...newTreatment,
        id: `t${prevPatient.treatmentPlans.length + 1}`,
        date: new Date().toISOString().split('T')[0],
      };
      return {
        ...prevPatient,
        treatmentPlans: [...prevPatient.treatmentPlans, newPlan],
      }
    });
    setIsFormOpen(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-start gap-4">
          <Avatar className="h-20 w-20 border">
            <AvatarImage src={patient.avatar} />
            <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-3xl">{patient.name}</CardTitle>
            <CardDescription className="text-base">
              {patient.email}
            </CardDescription>
            <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
              <span>DOB: {patient.dateOfBirth}</span>
              <span>Last Visit: {patient.lastVisit}</span>
              <Badge variant={patient.status === 'Active' ? 'default' : 'outline'}>{patient.status}</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="chart">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chart">Dental Chart</TabsTrigger>
          <TabsTrigger value="treatment">Treatment Plan</TabsTrigger>
          <TabsTrigger value="imaging">Imaging</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Interactive Dental Chart</CardTitle>
              <CardDescription>
                Click on a tooth to log conditions and notes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DentalChart initialRecords={patient.dentalRecords} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treatment">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AITreatmentPlan
              patientHistory={patient.history}
              dentalRecords={patient.dentalRecords}
            />
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Current Treatment Plan</CardTitle>
                  <CardDescription>
                    List of proposed and ongoing treatments.
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => setIsFormOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Treatment
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Procedure</TableHead>
                      <TableHead>Tooth</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patient.treatmentPlans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">
                          {plan.procedure}
                        </TableCell>
                        <TableCell>{plan.tooth || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{plan.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          ${plan.cost.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                     {patient.treatmentPlans.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          No treatment plans yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="imaging">
          <Card>
            <CardHeader>
              <CardTitle>Patient Imaging</CardTitle>
              <CardDescription>
                X-Rays and other patient images.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {patient.imaging.map((src, index) => (
                  <div key={index} className="overflow-hidden rounded-lg border">
                    <Image
                      src={src}
                      alt={`Patient image ${index + 1}`}
                      width={400}
                      height={300}
                      className="aspect-video h-auto w-full object-cover"
                      data-ai-hint="dental xray"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Patient History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold">AI Summary</h3>
                <p className="mt-1 text-sm text-muted-foreground italic">
                  {historySummary?.summary || "Generating summary..."}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Full History</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {patient.history}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {isFormOpen && (
        <TreatmentPlanForm
            onSave={handleAddTreatment}
            onOpenChange={setIsFormOpen}
        />
      )}
    </div>
  );
}
