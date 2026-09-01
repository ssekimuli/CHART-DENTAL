"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { GustoIntegrationTab } from "../../components/gusto-integration-tab";

export default function GustoSettings() {
  const params = useSearchParams();
  const { toast } = useToast();

  // Handle redirect back from Gusto (backend already did the token exchange)
  useEffect(() => {
    const gusto = params.get("gusto");
    const message = params.get("message");

    if (gusto === "success") {
      toast({
        title: "Success!",
        description: "Gusto connection established successfully",
      });
    } else if (gusto === "error") {
      toast({
        title: "Connection Failed",
        description: message ? decodeURIComponent(message) : "Failed to connect to Gusto",
        variant: "destructive",
      });
    }
  }, [params, toast]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gusto Integration</h1>
        <p className="text-muted-foreground mt-2">
          Manage your Gusto HRM connection and automatic synchronization settings.
        </p>
      </div>

      <GustoIntegrationTab />
    </div>
  );
}
