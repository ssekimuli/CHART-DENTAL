
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
import type { Payroll } from "@/lib/types";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Pencil, Trash } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";

type PayrollTableProps = {
    data: Payroll[];
    onView: (employeeId: string | number) => void;
    onEdit: (payroll: Payroll) => void;
    onDelete: (payroll: Payroll) => void;
    canUpdate: boolean;
    canDelete: boolean;
};


export function PayrollTable({ data, onView, onEdit, onDelete, canUpdate, canDelete }: PayrollTableProps) {
    const { formatCurrency } = useCurrency();
    const getStatusVariant = (status: "Paid" | "Pending") => {
        switch (status) {
          case "Paid":
            return "secondary";
          case "Pending":
            return "default";
        }
    };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Pay Period</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Pay Date</TableHead>
            <TableHead className="text-right">Net Pay</TableHead>
            {(canUpdate || canDelete) && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((payroll) => (
            <TableRow
              key={payroll.id}
            >
              <TableCell className="font-medium">{payroll.employeeName}</TableCell>
              <TableCell>{payroll.payPeriod}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(payroll.status)}>
                  {payroll.status}
                </Badge>
              </TableCell>
              <TableCell>{payroll.payDate ? String(payroll.payDate).split('T')[0] : ''}</TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(payroll.netPay)}
              </TableCell>
              {(canUpdate || canDelete) && (
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                             <DropdownMenuItem onClick={() => onView(payroll.employeeId)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Employee
                            </DropdownMenuItem>
                            {canUpdate && (
                                <DropdownMenuItem onClick={() => onEdit(payroll)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </DropdownMenuItem>
                            )}
                            {canDelete && (
                                <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => onDelete(payroll)}>
                                    <Trash className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
           {data.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        No payroll records found.
                    </TableCell>
                </TableRow>
            )}
        </TableBody>
      </Table>
    </div>
  );
}
