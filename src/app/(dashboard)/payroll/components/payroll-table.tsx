
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
import { useCurrency } from "@/hooks/use-currency";

export function PayrollTable({ data }: { data: Payroll[] }) {
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {data && data.map((payroll) => (
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
              <TableCell className="text-right">{formatCurrency(payroll.netPay)}</TableCell>
            </TableRow>
          ))}
           {(!data || data.length === 0) && (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No payroll records found.
                    </TableCell>
                </TableRow>
            )}
        </TableBody>
      </Table>
    </div>
  );
}
