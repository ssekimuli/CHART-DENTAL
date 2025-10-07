"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { branches as initialBranches } from "@/lib/data";
import type { Branch } from "@/lib/types";
import { BranchForm } from "./components/branch-form";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";

export default function BranchesPage() {
    const [branches, setBranches] = useState<Branch[]>(initialBranches);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const handleSaveBranch = (data: Omit<Branch, 'id'>) => {
        const newBranch: Branch = {
            ...data,
            id: `b${branches.length + 1}`
        };
        setBranches(prev => [...prev, newBranch]);
        setIsFormOpen(false);
    }

  return (
    <>
        <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
            <CardTitle>Branches</CardTitle>
            <CardDescription>
                Manage your practice's locations.
            </CardDescription>
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2" />
            Add Branch
            </Button>
        </CardHeader>
        <CardContent>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Branch Name</TableHead>
                        <TableHead>Address</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {branches.map((branch) => (
                        <TableRow key={branch.id}>
                            <TableCell className="font-medium">{branch.name}</TableCell>
                            <TableCell>{branch.address}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
        </Card>
        {isFormOpen && (
            <BranchForm
                onSave={handleSaveBranch}
                onOpenChange={setIsFormOpen}
            />
        )}
    </>
  );
}
