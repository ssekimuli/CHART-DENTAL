"use client";

import { formatDuration, intervalToDuration } from "date-fns";

import { useRouter, useParams } from "next/navigation";
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
import { MoreHorizontal, Pencil, PlusCircle, Trash, Receipt } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [selectedRecord, setSelectedRecord] = useState<OrthodonticRecord | undefined>(undefined);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | number | undefined>(undefined);
  const canUpdateChart = hasPermission('charting:update');

  const router = useRouter();
  const params = useParams();

  const handleOpenForm = (record?: OrthodonticRecord) => {
    if (record) {
      router.push(`/patients/${params.id}/charting/orthodontic/${record.id}`);
    } else {
      router.push(`/patients/${params.id}/charting/orthodontic/new`);
    }
  };

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
        {initialRecords.length > 0 && (
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            {(() => {
              const sorted = [...initialRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              const latest = sorted[0];
              const earliest = sorted[sorted.length - 1];
              
              let treatmentTimeStr = "0 Days";
              if (latest && earliest) {
                const start = new Date(earliest.date);
                const end = new Date(latest.date);
                
                // If it's the exact same day, intervalToDuration returns 0 for everything
                if (start.getTime() === end.getTime()) {
                  treatmentTimeStr = "0 Days";
                } else {
                  const duration = intervalToDuration({ start, end });
                  // We only want to show the most significant 2 units (e.g. Years and Months, or Months and Weeks, or Weeks and Days)
                  // filter out zero values and select up to 2 units
                  const formatObj: Record<string, number | undefined> = {
                    years: duration.years,
                    months: duration.months,
                    weeks: duration.days && duration.days >= 7 ? Math.floor(duration.days / 7) : 0,
                    days: duration.days ? duration.days % 7 : 0
                  };
                  
                  // if no weeks exist natively on older date-fns versions, duration.days might be > 7
                  if (duration.years === 0 && duration.months === 0 && duration.days && duration.days < 7) {
                    formatObj.weeks = 0;
                    formatObj.days = duration.days;
                  }

                  treatmentTimeStr = formatDuration(formatObj, { format: ['years', 'months', 'weeks', 'days'] }) || "0 Days";
                }
              }

              return (
                <>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Current Appliance</p>
                    <p className="font-semibold">{latest.appliance} {latest.applianceLocation ? `(${latest.applianceLocation})` : ''}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Current Phase</p>
                    <p className="font-semibold">{latest.treatmentPhase || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Treatment Time</p>
                    <p className="font-semibold capitalize">{treatmentTimeStr}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Next Visit Goal</p>
                    <p className="font-semibold truncate" title={latest.nextVisitGoals || 'N/A'}>{latest.nextVisitGoals || 'N/A'}</p>
                  </div>
                </>
              );
            })()}
          </div>
        )}
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Appliance</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Phase</TableHead>
                    <TableHead>Wire Size</TableHead>
                    <TableHead>Notes</TableHead>
                    {canUpdateChart && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                {initialRecords.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">No orthodontic records found.</TableCell>
                    </TableRow>
                )}
                {initialRecords.map(record => (
                    <TableRow key={record.id}>
                        <TableCell>{record.date}</TableCell>
                        <TableCell>{record.appliance}</TableCell>
                        <TableCell>{record.applianceLocation || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="font-medium text-xs">{record.treatmentPhase || 'N/A'}</div>
                          {record.treatmentPhase?.toLowerCase().includes('initial') && (
                            <div className="flex flex-wrap items-center gap-1 mt-1 text-[10px]">
                              {record.amount && Number(record.amount) > 0 && (
                                <span className="font-mono font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-1 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                                  USh {Number(record.amount).toLocaleString()}
                                </span>
                              )}
                              {record.period && (
                                <span className="text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
                                  ⏱ {record.period}
                                </span>
                              )}
                              {record.invoice_id && (
                                <a
                                  href={`/billing`}
                                  className="text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-0.5"
                                >
                                  Inv #{record.invoice_id}
                                </a>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{record.wireSize || record.wireSizeUpper || record.wireSizeLower ? `${record.wireSizeUpper || ''} / ${record.wireSizeLower || ''}` : 'N/A'}</TableCell>
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
                                        {record.invoice_id && (
                                          <DropdownMenuItem asChild>
                                            <a href="/billing" className="cursor-pointer text-blue-600 dark:text-blue-400">
                                              <Receipt className="mr-2 h-4 w-4" /> View in Billing
                                            </a>
                                          </DropdownMenuItem>
                                        )}
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

    <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the orthodontic record
            and remove the data from our servers.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
        </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    </>
  );
}
