
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
import type { LeaveRequest, LeaveStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Check, MoreHorizontal, X as XIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type LeaveTableProps = {
    data: LeaveRequest[];
    onStatusChange: (id: string, status: LeaveStatus) => void;
};

export function LeaveTable({ data, onStatusChange }: LeaveTableProps) {
    const getStatusVariant = (status: LeaveStatus) => {
        switch (status) {
          case "Approved":
            return "secondary";
          case "Pending":
            return "default";
          case "Rejected":
            return "destructive";
        }
    };
    
    const getStatusClass = (status: LeaveStatus) => {
        switch(status) {
            case 'Approved': return 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
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
            <TableHead>Leave Type</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((request) => (
            <TableRow
              key={request.id}
            >
              <TableCell className="font-medium">{request.employeeName}</TableCell>
              <TableCell>{request.leaveType}</TableCell>
              <TableCell>{request.startDate} to {request.endDate}</TableCell>
              <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(request.status)} className={getStatusClass(request.status)}>
                  {request.status}
                </Badge>
              </TableCell>
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
                    <DropdownMenuItem onClick={() => onStatusChange(request.id, 'Approved')}>
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => onStatusChange(request.id, 'Rejected')}>
                        <XIcon className="mr-2 h-4 w-4" />
                        Reject
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
           {data.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        No leave requests found.
                    </TableCell>
                </TableRow>
            )}
        </TableBody>
      </Table>
    </div>
  );
}
