
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
import type { LaboratoryOrder } from "@/lib/types";

export function LabTable({ data }: { data: LaboratoryOrder[] }) {
    const getStatusVariant = (status: "Sent" | "Received" | "Completed" | "Cancelled") => {
        switch (status) {
          case "Completed":
            return "secondary";
          case "Sent":
          case "Received":
            return "default";
          case "Cancelled":
            return "destructive";
        }
    };
    
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Doctor</TableHead>
            <TableHead>Lab</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sent Date</TableHead>
            <TableHead>Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((order) => (
            <TableRow
              key={order.id}
            >
              <TableCell className="font-medium">{order.patientName}</TableCell>
              <TableCell>{order.doctor?.name || '-'}</TableCell>
              <TableCell>{order.lab}</TableCell>
              <TableCell>{order.item} {order.tooth ? `(#${order.tooth})` : ''}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(order.status)}>
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell>{order.sentDate}</TableCell>
              <TableCell>{order.dueDate}</TableCell>
            </TableRow>
          ))}
           {data.length === 0 && (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                        No lab orders found.
                    </TableCell>
                </TableRow>
            )}
        </TableBody>
      </Table>
    </div>
  );
}
