"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { updateNextVisit } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Patient } from "@/lib/types";

type NextVisitButtonProps = {
  patient: Patient;
  onUpdate: (updatedPatient: Patient) => void;
};

export function NextVisitButton({ patient, onUpdate }: NextVisitButtonProps) {
  const [date, setDate] = useState<Date | undefined>(patient.nextVisit ? new Date(patient.nextVisit) : undefined);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!date) return;
    
    setIsSaving(true);
    try {
      const formattedDate = format(date, "yyyy-MM-dd");
      const updated = await updateNextVisit(patient.id, formattedDate);
      if (updated) {
        onUpdate(updated);
        toast({
            title: "Next Visit Updated",
            description: `Next visit set to ${format(date, "PPP")}`,
        });
      }
      setIsOpen(false);
    } catch (error) {
      toast({
          title: "Error",
          description: "Failed to update next visit date.",
          variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {patient.nextVisit ? "Change Next Visit" : "Set Next Visit"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="p-3">
            <h4 className="font-medium text-sm mb-2">Schedule Next Visit</h4>
            <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
            disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
            />
            <div className="mt-3 flex justify-end">
                <Button size="sm" onClick={handleSave} disabled={!date || isSaving}>
                    {isSaving ? "Saving..." : "Save Date"}
                </Button>
            </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
