"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { QuickbooksIntegrationTab } from "../../components/quickbooks-integration-tab";

export default function QuickBooksSettings() {
  const params = useSearchParams();
  const { toast } = useToast();

  // Handle redirect back from Intuit (backend already did the token exchange)
  useEffect(() => {
    const qb = params.get("qb");
    const message = params.get("message");

    if (qb === "success") {
      toast({
        title: "Success!",
        description: "QuickBooks connection established successfully",
      });
    } else if (qb === "error") {
      toast({
        title: "Connection Failed",
        description: message ? decodeURIComponent(message) : "Failed to connect to QuickBooks",
        variant: "destructive",
      });
    }
  }, [params, toast]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">QuickBooks Integration</h1>
        <p className="text-muted-foreground mt-2">
          Manage your QuickBooks Online connection and automatic synchronization settings.
        </p>
      </div>

      <QuickbooksIntegrationTab />
    </div>
  );
}
