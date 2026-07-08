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
import { PlusCircle, Pencil, Trash } from "lucide-react";
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
import { createBranch, getBranches, updateBranch, deleteBranch } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { hasPermission } from "@/lib/user";
import { useRouter } from "next/navigation";

export default function BranchesPage() {
    const router = useRouter();
    const [branches, setBranches] = useState<Branch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | undefined>(undefined);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [branchToDelete, setBranchToDelete] = useState<Branch | undefined>(undefined);

    useEffect(() => {
      if (!hasPermission("branches:read")) {
        router.replace("/dashboard");
        return;
      }
        const fetchData = async () => {
            setIsLoading(true);
            const branchesData = await getBranches();
            setBranches(branchesData);
            setIsLoading(false);
        };
        fetchData();
    }, [router]);

    const handleSaveBranch = async (data: Omit<Branch, 'id'>) => {
        if (editingBranch) {
            const updated = await updateBranch(editingBranch.id, data);
            if (updated) {
                setBranches(prev => prev.map(b => b.id === editingBranch.id ? updated : b));
            }
        } else {
            const newBranch = await createBranch(data);
            if (newBranch) {
                setBranches(prev => [...prev, newBranch]);
            }
        }
        setIsFormOpen(false);
        setEditingBranch(undefined);
    }

    const handleDeleteBranch = async () => {
        if (!branchToDelete) return;
        const res = await deleteBranch(branchToDelete.id);
        if (res && res.success) {
            setBranches(prev => prev.filter(b => b.id !== branchToDelete.id));
        }
        setIsDeleteAlertOpen(false);
        setBranchToDelete(undefined);
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
            {hasPermission('branches:create') && (
              <Button onClick={() => {
                setEditingBranch(undefined);
                setIsFormOpen(true);
              }}>
                <PlusCircle className="mr-2" />
                Add Branch
              </Button>
            )}
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
                        <TableHead>Branch Name</TableHead>
                        <TableHead>Address</TableHead>
                        {hasPermission('branches:create') && <TableHead className="w-[120px] text-right">Actions</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {branches.map((branch) => (
                        <TableRow key={branch.id}>
                            <TableCell className="font-medium">{branch.name}</TableCell>
                            <TableCell>{branch.address}</TableCell>
                            {hasPermission('branches:create') && (
                              <TableCell className="text-right space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    setEditingBranch(branch);
                                    setIsFormOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => {
                                    setBranchToDelete(branch);
                                    setIsDeleteAlertOpen(true);
                                  }}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
        </CardContent>
        </Card>
        {isFormOpen && (
            <BranchForm
                branch={editingBranch}
                onSave={handleSaveBranch}
                onOpenChange={(open) => {
                    setIsFormOpen(open);
                    if (!open) setEditingBranch(undefined);
                }}
            />
        )}
        {isDeleteAlertOpen && (
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the branch
                            <strong> {branchToDelete?.name}</strong> and remove its record from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setBranchToDelete(undefined)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteBranch} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}
    </>
  );
}
