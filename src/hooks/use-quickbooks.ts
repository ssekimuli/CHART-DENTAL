"use client";

import { useState, useCallback } from "react";
import { qb } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function useQuickbooks() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncInvoice = useCallback(
    async (invoiceId: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await qb.syncInvoice(invoiceId);
        toast({
          title: "Sync Queued",
          description: "Invoice sync has been queued",
        });
        return result;
      } catch (err: any) {
        const errorMsg = err?.response?.data?.error || "Failed to sync invoice";
        setError(errorMsg);
        toast({
          title: "Sync Failed",
          description: errorMsg,
          variant: "destructive",
        });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const syncPatient = useCallback(
    async (patientId: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await qb.syncPatient(patientId);
        toast({
          title: "Sync Queued",
          description: "Patient sync has been queued",
        });
        return result;
      } catch (err: any) {
        const errorMsg = err?.response?.data?.error || "Failed to sync patient";
        setError(errorMsg);
        toast({
          title: "Sync Failed",
          description: errorMsg,
          variant: "destructive",
        });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const syncPayment = useCallback(
    async (paymentId: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await qb.syncPayment(paymentId);
        toast({
          title: "Sync Queued",
          description: "Payment sync has been queued",
        });
        return result;
      } catch (err: any) {
        const errorMsg = err?.response?.data?.error || "Failed to sync payment";
        setError(errorMsg);
        toast({
          title: "Sync Failed",
          description: errorMsg,
          variant: "destructive",
        });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  return {
    isLoading,
    error,
    syncInvoice,
    syncPatient,
    syncPayment,
  };
}
