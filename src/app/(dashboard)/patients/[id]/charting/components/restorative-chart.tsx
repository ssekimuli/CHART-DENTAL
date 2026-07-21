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
import dynamic from "next/dynamic";

const ToothModel3D = dynamic(() => import("./tooth-model-3d").then((mod) => mod.ToothModel3D), {
  ssr: false,
});

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
        <CardContent className="space-y-8">
          {/* Teeth Grid */}
          <div className="w-full">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Adult Teeth Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4 overflow-x-auto pb-4">
              {[
                // Upper Right
                18, 17, 16, 15, 14, 13, 12, 11,
                // Upper Left
                21, 22, 23, 24, 25, 26, 27, 28,
                // Lower Right
                48, 47, 46, 45, 44, 43, 42, 41,
                // Lower Left
                31, 32, 33, 34, 35, 36, 37, 38
              ].map((toothId) => (
                <div key={toothId} className="min-w-[200px]">
                  <ToothModel3D toothId={toothId} />
                </div>
              ))}
            </div>
          </div>

          <div className="w-full">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Restorative Records</h3>
            <div className="rounded-md border border-slate-800 bg-slate-950/50">
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
