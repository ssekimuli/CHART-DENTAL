
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreHorizontal, Pencil, PlusCircle, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OrthodonticRecordForm } from "./orthodontic-record-form";
import type { OrthodonticRecord } from "@/lib/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { hasPermission } from "@/lib/user";

type OrthodonticChartProps = {
  initialRecords: OrthodonticRecord[];
  onSave: (record: Omit<OrthodonticRecord, 'id'>) => void;
  onUpdate: (record: OrthodonticRecord) => void;
  onDelete: (recordId: string | number) => void;
};

export function OrthodonticChart({ initialRecords, onSave, onUpdate, onDelete }: OrthodonticChartProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<OrthodonticRecord | undefined>(undefined);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | number | undefined>(undefined);
  const canUpdateChart = hasPermission('charting:update');


  const handleOpenForm = (record?: OrthodonticRecord) => {
    setSelectedRecord(record);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setSelectedRecord(undefined);
    setIsFormOpen(false);
  };

  const handleSave = (data: Omit<OrthodonticRecord, 'id'>) => {
    if (selectedRecord) {
        onUpdate({ ...selectedRecord, ...data });
    } else {
        onSave(data);
    }
    handleCloseForm();
  }

  const openDeleteDialog = (recordId: string | number) => {
    setRecordToDelete(recordId);
    setIsDeleteAlertOpen(true);
  }

  const handleDelete = () => {
    if (recordToDelete) {
        onDelete(recordToDelete);
    }
    setRecordToDelete(undefined);
    setIsDeleteAlertOpen(false);
  }


  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Orthodontic Chart</CardTitle>
            <CardDescription>
            Track braces, tooth movement, and alignment progress.
            </CardDescription>
        </div>
        {canUpdateChart && (
            <Button size="sm" onClick={() => handleOpenForm()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Record
            </Button>
        )}
      </CardHeader>
      <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Appliance</TableHead>
                    <TableHead>Wire Size</TableHead>
                    <TableHead>Notes</TableHead>
                    {canUpdateChart && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                {initialRecords.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">No orthodontic records found.</TableCell>
                    </TableRow>
                )}
                {initialRecords.map(record => (
                    <TableRow key={record.id}>
                        <TableCell>{record.date}</TableCell>
                        <TableCell>{record.appliance}</TableCell>
                        <TableCell>{record.wireSize || 'N/A'}</TableCell>
                        <TableCell className="max-w-xs truncate">{record.notes}</TableCell>
                        {canUpdateChart && (
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleOpenForm(record)}>
                                            <Pencil className="mr-2 h-4 w-4" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600" onClick={() => openDeleteDialog(record.id)}>
                                            <Trash className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        )}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </CardContent>
    </Card>

    {isFormOpen && (
        <OrthodonticRecordForm
            record={selectedRecord}
            onSave={handleSave}
            onOpenChange={handleCloseForm}
        />
    )}

    <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this orthodontic record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRecordToDelete(undefined)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
