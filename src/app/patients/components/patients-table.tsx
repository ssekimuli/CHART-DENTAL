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
import type { Patient } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

export function PatientsTable({ data }: { data: Patient[] }) {
  const router = useRouter();

  const handleRowClick = (patientId: string) => {
    router.push(`/patients/${patientId}`);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Visit</TableHead>
            <TableHead className="text-right">Date of Birth</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((patient) => (
            <TableRow
              key={patient.id}
              onClick={() => handleRowClick(patient.id)}
              className="cursor-pointer"
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={patient.avatar} alt="Avatar" />
                    <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="font-medium">{patient.name}</div>
                  <div className="text-sm text-muted-foreground">{patient.email}</div>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={patient.status === "Active" ? "secondary" : "outline"}
                  className={patient.status === 'Active' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' : ''}
                >
                  {patient.status}
                </Badge>
              </TableCell>
              <TableCell>{patient.lastVisit}</TableCell>
              <TableCell className="text-right">{patient.dateOfBirth}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
