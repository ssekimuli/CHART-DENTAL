"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { LabServicePrice, LabService } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface LabPricesTableProps {
  prices: LabServicePrice[];
  services: Map<number, LabService>;
  onEdit: (price: LabServicePrice) => void;
  onDelete: (id: number) => void;
  isLoading?: boolean;
}

export function LabPricesTable({
  prices,
  services,
  onEdit,
  onDelete,
  isLoading = false,
}: LabPricesTableProps) {
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleDeleteConfirm = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lab Name</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Base Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No lab prices found
                </TableCell>
              </TableRow>
            ) : (
              prices.map((price) => {
                const service = services.get(price.lab_service_id);
                return (
                  <TableRow key={price.id}>
                    <TableCell className="font-medium">{price.lab}</TableCell>
                    <TableCell>
                      {service ? (
                        <div>
                          <div className="font-medium">{service.service_name}</div>
                          {service.category && (
                            <div className="text-xs text-muted-foreground">{service.category}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Service not found</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-lg">${parseFloat(String(price.base_price)).toFixed(2)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {price.is_active && (
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        )}
                        <Badge variant={price.is_active ? "default" : "secondary"}>
                          {price.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(price)}
                        disabled={isLoading}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(price.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lab Price</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this price? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
