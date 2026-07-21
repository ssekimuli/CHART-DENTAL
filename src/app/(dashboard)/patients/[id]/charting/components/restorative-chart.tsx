"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RestorativeRecord } from "@/lib/types";
import { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { hasPermission } from "@/lib/user";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { RestorativeRecordForm } from "./restorative-record-form";
import { ToothModel3D } from "./tooth-model-3d";

type RestorativeChartProps = {
  initialRecords: RestorativeRecord[];
  onSave: (record: Omit<RestorativeRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate: (record: RestorativeRecord) => void;
  onDelete: (id: string | number) => void;
};

export function RestorativeChart({ initialRecords, onSave, onUpdate, onDelete }: RestorativeChartProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RestorativeRecord | undefined>(undefined);
  const canUpdateChart = hasPermission('charting:update');

  const handleEdit = (record: RestorativeRecord) => {
    setSelectedRecord(record);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedRecord(undefined);
    setIsFormOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
              <CardTitle>Restorative Chart</CardTitle>
              <CardDescription>
                  Record restorative procedures, surfaces, and materials.
              </CardDescription>
          </div>
          {canUpdateChart && (
             <Button size="sm" onClick={handleAddNew}>
                <Plus className="mr-2 h-4 w-4" /> Add Record
             </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <ToothModel3D />
            </div>
            <div className="md:col-span-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Tooth</TableHead>
                    <TableHead>Surface</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialRecords.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No restorative records found.
                        </TableCell>
                    </TableRow>
                  ) : (
                    initialRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.createdAt ? format(new Date(record.createdAt), 'MMM d, yyyy') : 'N/A'}</TableCell>
                        <TableCell className="font-medium">#{record.toothId}</TableCell>
                        <TableCell>{record.surface}</TableCell>
                        <TableCell>{record.material}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{record.notes}</TableCell>
                        <TableCell className="text-right">
                           {canUpdateChart && (
                             <div className="flex justify-end gap-2">
                                 <Button variant="ghost" size="icon" onClick={() => handleEdit(record)}>
                                     <Pencil className="h-4 w-4" />
                                     <span className="sr-only">Edit</span>
                                 </Button>
                                 <Button variant="ghost" size="icon" className="text-destructive" onClick={() => record.id && onDelete(record.id)}>
                                     <Trash2 className="h-4 w-4" />
                                     <span className="sr-only">Delete</span>
                                 </Button>
                             </div>
                           )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <RestorativeRecordForm
         open={isFormOpen}
         onOpenChange={setIsFormOpen}
         initialData={selectedRecord}
         onSave={onSave}
         onUpdate={onUpdate}
      />
    </>
  );
}
