
"use client";

import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getRolesList, createRole, updateRoleName, deleteRole } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { hasPermission } from "@/lib/user";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Shield, Trash } from "lucide-react";
import { RoleForm } from "../components/role-form";
import { useToast } from "@/hooks/use-toast";

type Role = {
    id: string | number;
    name: string;
};

export default function StaffPositionPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | undefined>(undefined);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    
    const canCreate = hasPermission("hrm:create");
    const canDelete = hasPermission("hrm:delete");
    const canManageSettings = hasPermission("settings:manage");


    useEffect(() => {
        if (!hasPermission("hrm:read")) {
            router.replace("/dashboard");
            return;
        }

        const fetchRoles = async () => {
            setIsLoading(true);
            const rolesData = await getRolesList();
            setRoles(rolesData);
            setIsLoading(false);
        };
        fetchRoles();
    }, [router]);
    
    const handleOpenForm = (role?: Role) => {
        setSelectedRole(role);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedRole(undefined);
        setIsFormOpen(false);
    };

    const handleSaveRole = async (name: string) => {
        if (selectedRole) {
            // Update
            const updated = await updateRoleName(selectedRole.id, name);
            if (updated) {
                setRoles(roles.map(r => r.id === updated.id ? updated : r));
                toast({ title: "Role Updated", description: `The role "${updated.name}" has been updated.` });
            }
        } else {
            // Create
            const newRole = await createRole(name);
            if (newRole) {
                setRoles([...roles, newRole]);
                toast({ title: "Role Created", description: `The role "${newRole.name}" has been created.` });
            }
        }
        handleCloseForm();
    };

    const openDeleteDialog = (role: Role) => {
        setSelectedRole(role);
        setIsDeleteAlertOpen(true);
    };

    const handleDeleteRole = async () => {
        if (selectedRole) {
            const success = await deleteRole(selectedRole.id);
            if (success) {
                setRoles(roles.filter(r => r.id !== selectedRole.id));
                toast({ title: "Role Deleted", description: `The role "${selectedRole.name}" has been deleted.` });
            } else {
                 toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the role." });
            }
        }
        setIsDeleteAlertOpen(false);
        setSelectedRole(undefined);
    };

    const handleManagePermissions = (roleId: string | number) => {
        // Navigate to the settings page, could be enhanced with query params later
        router.push('/settings');
    };


    return (
      <>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Staff Positions</CardTitle>
                <CardDescription>
                    Manage roles and positions within your practice.
                </CardDescription>
            </div>
            {canCreate && (
                <Button onClick={() => handleOpenForm()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Role
                </Button>
            )}
            </CardHeader>
            <CardContent>
            {isLoading ? (
                <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Position Name</TableHead>
                            <TableHead className="text-right w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {roles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={2} className="h-24 text-center">
                                    No roles found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            roles.map((role) => (
                                <TableRow key={role.id}>
                                    <TableCell className="font-medium">{role.name}</TableCell>
                                    <TableCell className="text-right">
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            {canManageSettings && (
                                                 <DropdownMenuItem onClick={() => handleManagePermissions(role.id)}>
                                                    <Shield className="mr-2 h-4 w-4" /> Manage Permissions
                                                </DropdownMenuItem>
                                            )}
                                            {canDelete && (
                                                <>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-red-600" onClick={() => openDeleteDialog(role)}>
                                                        <Trash className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            )}
            </CardContent>
        </Card>
        {isFormOpen && (
            <RoleForm
                role={selectedRole}
                onSave={handleSaveRole}
                onOpenChange={handleCloseForm}
            />
        )}
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the role "{selectedRole?.name}".
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedRole(undefined)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteRole} className="bg-destructive hover:bg-destructive/90">
                Delete
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
      </AlertDialog>
      </>
    );
  }
