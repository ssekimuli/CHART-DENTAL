
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import type { Branch } from "@/lib/types";
import { BranchForm } from "./components/flossx-form";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
import { createBranch, getBranches } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function FlossxPage() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const branchesData = await getBranches();
            setBranches(branchesData);
            setIsLoading(false);
        };
        fetchData();
    }, []);

    const handleSaveBranch = async (data: Omit<Branch, 'id'>) => {
        const newBranch = await createBranch(data);
        if (newBranch) {
            setBranches(prev => [...prev, newBranch]);
        }
        setIsFormOpen(false);
    }

  return (
    <>
        <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
            <CardTitle>Flossx</CardTitle>
            <CardDescription>
                Manage your practice's locations.
            </CardDescription>
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2" />
            Add Flossx
            </Button>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                 <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : (
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Flossx Name</TableHead>
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
            )}
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
