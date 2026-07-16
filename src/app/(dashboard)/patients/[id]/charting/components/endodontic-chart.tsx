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
import { EndodonticRecordForm } from "./endodontic-record-form";
import type { EndodonticRecord } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { hasPermission } from "@/lib/user";

type EndodonticChartProps = {
  initialRecords: EndodonticRecord[];
  onSave: (record: Omit<EndodonticRecord, "id" | "date">) => void;
  onUpdate: (record: EndodonticRecord) => void;
  onDelete: (recordId: string | number) => void;
};

function MiniToothIcon({ toothId, canalsFilled }: { toothId: number; canalsFilled: boolean }) {
  const anteriors = [6, 7, 8, 9, 10, 11, 22, 23, 24, 25, 26, 27];
  const premolars = [4, 5, 12, 13, 20, 21, 28, 29];
  let d = "";
  if (anteriors.includes(toothId)) {
    d = "M 8,15 C 8,5 16,5 16,15 C 16,25 13,36 12,38 C 11,36 8,25 8,15 Z";
  } else if (premolars.includes(toothId)) {
    d = "M 6,12 C 6,5 18,5 18,12 C 18,22 17,28 15,38 C 13,38 12,28 12,24 C 12,28 11,38 9,38 C 7,28 6,22 6,12 Z";
  } else {
    d = "M 5,12 C 5,5 19,5 19,12 C 19,22 18,28 17,38 C 16,38 15,28 14,24 C 13.5,28 12.5,39 12,39 C 11.5,39 10.5,28 10,24 C 9,28 8,38 7,38 C 6,22 5,12 5,12 Z";
  }
  return (
    <svg viewBox="0 0 24 40" className="w-5 h-8 mr-2 drop-shadow-sm inline-block align-middle transition-all duration-300">
      <path d={d} fill={canalsFilled ? "#fda4af" : "#f8fafc"} stroke={canalsFilled ? "#ef4444" : "#cbd5e1"} strokeWidth="1.5" />
    </svg>
  );
}

export function EndodonticChart({
  initialRecords,
  onSave,
  onUpdate,
  onDelete,
}: EndodonticChartProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<EndodonticRecord | undefined>(undefined);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | number | undefined>(undefined);
  const canUpdateChart = hasPermission("charting:update");

  const handleOpenForm = (record?: EndodonticRecord) => {
    setSelectedRecord(record);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setSelectedRecord(undefined);
    setIsFormOpen(false);
  };

  const handleSave = (data: Omit<EndodonticRecord, "id" | "date">) => {
    if (selectedRecord) {
      onUpdate({ ...selectedRecord, ...data });
    } else {
      onSave(data);
    }
    handleCloseForm();
  };

  const openDeleteDialog = (recordId: string | number) => {
    setRecordToDelete(recordId);
    setIsDeleteAlertOpen(true);
  };

  const handleDelete = () => {
    if (recordToDelete) {
      onDelete(recordToDelete);
    }
    setRecordToDelete(undefined);
    setIsDeleteAlertOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Endodontic Chart</CardTitle>
            <CardDescription>
              Track and log root canal therapy (RCT) details, canal lengths, obturation, and diagnoses.
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
                <TableHead>Tooth</TableHead>
                <TableHead>Pulpal Diagnosis</TableHead>
                <TableHead>Periapical Diagnosis</TableHead>
                <TableHead>Canals (WL)</TableHead>
                <TableHead>Obturation</TableHead>
                <TableHead>Post Type</TableHead>
                {canUpdateChart && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialRecords.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No endodontic records found.
                  </TableCell>
                </TableRow>
              )}
              {initialRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.date}</TableCell>
                  <TableCell className="align-middle whitespace-nowrap">
                    <MiniToothIcon toothId={record.toothId} canalsFilled={record.canals?.length > 0} />
                    <Badge variant="outline" className="font-bold bg-primary/5 align-middle">
                      Tooth #{record.toothId}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      {record.pulpalDiagnosis}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{record.periapicalDiagnosis}</span>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    <div className="flex flex-wrap gap-1">
                      {record.canals.map((c, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] py-0 px-1">
                          {c.name}: {c.workingLength ? `${c.workingLength}mm` : "-"}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{record.obturationMaterial || "-"}</TableCell>
                  <TableCell>
                    {record.postType && record.postType !== "None" ? (
                      <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">
                        {record.postType}
                      </Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
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
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => openDeleteDialog(record.id)}
                          >
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
        <EndodonticRecordForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSave={handleSave}
          record={selectedRecord}
        />
      )}

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the endodontic record for this patient.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
