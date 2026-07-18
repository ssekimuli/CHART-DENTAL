"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { OrthodonticRecordForm } from "../../components/orthodontic-record-form";
import { updateOrthodonticRecord, getOrthodonticRecords } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrthodonticRecord } from "@/lib/types";

export default function EditOrthodonticRecordPage({ params }: { params: Promise<{ id: string, recordId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [record, setRecord] = useState<OrthodonticRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const records = await getOrthodonticRecords(resolvedParams.id);
        const found = records.find(r => String(r.id) === resolvedParams.recordId);
        if (found) {
          setRecord(found);
        } else {
          toast({
            title: "Not Found",
            description: "Orthodontic record not found.",
            variant: "destructive",
          });
          router.push(`/patients/${resolvedParams.id}/charting?tab=orthodontic`);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecord();
  }, [resolvedParams.id, resolvedParams.recordId, router, toast]);

  const handleSave = async (data: any) => {
    setIsSaving(true);
    try {
      if (!record) return;
      const patient = await updateOrthodonticRecord(resolvedParams.id, { ...record, ...data });
      if (patient) {
        toast({
          title: "Record Updated",
          description: "Orthodontic record has been successfully updated.",
        });
        router.push(`/patients/${resolvedParams.id}/charting?tab=orthodontic`);
      } else {
        throw new Error("Failed to update record");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update orthodontic record. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/patients/${resolvedParams.id}/charting?tab=orthodontic`);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading record...</div>;
  }

  if (!record) {
    return null; // Handled by useEffect redirect
  }

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
          record={record}
          onSave={handleSave} 
          onCancel={handleCancel} 
        />
      </div>
    </div>
  );
}
