"use client";

import { useEffect, useState } from "react";
import { qb, type QbSyncLog } from "@/lib/api";

export function useQbSyncStatus(entityId?: number, entityType?: string, pollInterval = 3000) {
  const [syncLogs, setSyncLogs] = useState<QbSyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSyncLogs = async () => {
    if (!entityId || !entityType) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await qb.getSyncLogs({
        entity_type: entityType,
        page: 1,
      });
      setSyncLogs(data.data || []);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch sync logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!entityId || !entityType) return;

    // Fetch immediately
    fetchSyncLogs();

    // Poll for updates
    const interval = setInterval(fetchSyncLogs, pollInterval);

    return () => clearInterval(interval);
  }, [entityId, entityType, pollInterval]);

  // Get latest sync for this entity
  const latestSync = syncLogs.find((log) => log.entity_id === entityId);

  return {
    syncLogs,
    latestSync,
    isLoading,
    error,
    refresh: fetchSyncLogs,
  };
}
