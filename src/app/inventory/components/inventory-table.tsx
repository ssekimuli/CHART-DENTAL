
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
import type { InventoryItem } from "@/lib/types";

export function InventoryTable({ data }: { data: InventoryItem[] }) {
    const getStatusVariant = (status: "In Stock" | "Low Stock" | "Out of Stock") => {
        switch (status) {
          case "In Stock":
            return "secondary";
          case "Low Stock":
            return "default";
          case "Out of Stock":
            return "destructive";
        }
    };
    const getStatusClass = (status: "In Stock" | "Low Stock" | "Out of Stock") => {
        switch(status) {
            case 'In Stock': return 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
            case 'Low Stock': return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-500 border-yellow-200 dark:border-yellow-800';
            case 'Out of Stock': return 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
        }
    }


  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item Name</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead className="text-right">Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow
              key={item.id}
            >
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.supplier}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(item.status)} className={getStatusClass(item.status)}>
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell>{item.stock}</TableCell>
              <TableCell className="text-right">
                ${item.price.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
           {data.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No inventory items found.
                    </TableCell>
                </TableRow>
            )}
        </TableBody>
      </Table>
    </div>
  );
}
