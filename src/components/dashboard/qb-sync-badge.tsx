"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle2, AlertCircle, Clock, Loader2 } from "lucide-react";

interface QbSyncBadgeProps {
  qbInvoiceId?: string;
  qbSyncedAt?: string;
  syncStatus?: "synced" | "pending" | "failed";
}

export function QbSyncBadge({ qbInvoiceId, qbSyncedAt, syncStatus }: QbSyncBadgeProps) {
  if (!qbInvoiceId && !syncStatus) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="bg-gray-100">
              <Clock className="w-3 h-3 mr-1" />
              Not Synced
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click "Sync to QB" to sync this invoice</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (syncStatus === "pending") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Syncing...
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sync in progress...</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (syncStatus === "failed") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">
              <AlertCircle className="w-3 h-3 mr-1" />
              Failed
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sync failed. Please try again.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (qbInvoiceId) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Synced
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div>
              <p className="font-semibold">QB Invoice ID: {qbInvoiceId}</p>
              {qbSyncedAt && (
                <p className="text-xs">Synced: {new Date(qbSyncedAt).toLocaleString()}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return null;
}
