
"use client";

import { useState, useTransition } from "react";
import { generateTreatmentPlan } from "@/ai/flows/generate-treatment-plan";
import type { DentalRecord } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Wand2, Loader2 } from "lucide-react";

type AITreatmentPlanProps = {
  patientHistory: string;
  dentalRecords: DentalRecord[];
};

export function AITreatmentPlan({
  patientHistory,
  dentalRecords,
}: AITreatmentPlanProps) {
  const [isPending, startTransition] = useTransition();
  const [symptoms, setSymptoms] = useState("");
  const [plan, setPlan] = useState<{
    treatmentPlan: string;
    rationale: string;
  } | null>(null);

  const handleSubmit = () => {
    startTransition(async () => {
      const dentalConditions = dentalRecords
        .map((r) => `Tooth #${r.toothId}: ${r.condition}. Notes: ${r.notes}`)
        .join("\n");

      const result = await generateTreatmentPlan({
        symptoms,
        dentalConditions: dentalConditions || "No specific conditions logged.",
        patientHistory,
      });
      setPlan(result);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-Powered Treatment Plan</CardTitle>
        <CardDescription>
          Generate a preliminary treatment plan using AI.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="symptoms">Patient-Reported Symptoms</Label>
          <Textarea
            id="symptoms"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="e.g., sensitivity to cold, pain in upper right quadrant..."
          />
        </div>
        {plan && (
          <div className="space-y-4 rounded-lg border bg-secondary/50 p-4">
            <div>
              <h4 className="font-semibold">Suggested Plan</h4>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {plan.treatmentPlan}
              </p>
            </div>
            <div>
              <h4 className="font-semibold">Rationale</h4>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {plan.rationale}
              </p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          Generate Plan
        </Button>
      </CardFooter>
    </Card>
  );
}
