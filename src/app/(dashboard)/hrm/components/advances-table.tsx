
"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { StaffAdvance, StaffAdvanceStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Check, MoreHorizontal, X as XIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrency } from "@/hooks/use-currency";

type AdvancesTableProps = {
    data: StaffAdvance[];
    onStatusChange: (id: string, status: StaffAdvanceStatus) => void;
    canUpdate: boolean;
};

export function AdvancesTable({ data, onStatusChange, canUpdate }: AdvancesTableProps) {
    const { formatCurrency } = useCurrency();
    const getStatusVariant = (status: StaffAdvanceStatus) => {
        switch (status) {
          case "Approved":
          case "Paid":
            return "secondary";
          case "Pending":
            return "default";
          case "Rejected":
            return "destructive";
        }
    };
    
    const getStatusClass = (status: StaffAdvanceStatus) => {
        switch(status) {
            case 'Approved': return 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
            case 'Paid': return 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
            case 'Pending': return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-500 border-yellow-200 dark:border-yellow-800';
            case 'Rejected': return 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
        }
    }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            {canUpdate && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((request) => (
            <TableRow
              key={request.id}
            >
              <TableCell className="font-medium">{request.employeeName}</TableCell>
              <TableCell>{request.date}</TableCell>
              <TableCell>{formatCurrency(request.amount)}</TableCell>
              <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(request.status)} className={getStatusClass(request.status)}>
                  {request.status}
                </Badge>
              </TableCell>
              {canUpdate && (
                <TableCell className="text-right">
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" disabled={request.status !== 'Pending'}>
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onStatusChange(request.id as string, 'Approved')}>
                            <Check className="mr-2 h-4 w-4" />
                            Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => onStatusChange(request.id as string, 'Rejected')}>
                            <XIcon className="mr-2 h-4 w-4" />
                            Reject
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
           {data.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        No staff advances found.
                    </TableCell>
                </TableRow>
            )}
        </TableBody>
      </Table>
    </div>
  );
}
