"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { OrthodonticRecordForm } from "../../components/orthodontic-record-form";
import { saveOrthodonticRecord } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewOrthodonticRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (data: any) => {
    setIsSaving(true);
    try {
      const patient = await saveOrthodonticRecord(resolvedParams.id, data);
      if (patient) {
        toast({
          title: "Record Added",
          description: "Orthodontic record has been successfully added.",
        });
        router.push(`/patients/${resolvedParams.id}/charting?tab=orthodontic`);
      } else {
        throw new Error("Failed to add record");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add orthodontic record. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/patients/${resolvedParams.id}/charting?tab=orthodontic`);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto py-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Back to Charting</h1>
      </div>
      
      <div className="bg-card rounded-xl border shadow-sm p-6">
        <OrthodonticRecordForm 
          onSave={handleSave} 
          onCancel={handleCancel} 
        />
      </div>
    </div>
  );
}
