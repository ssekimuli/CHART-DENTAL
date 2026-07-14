
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getRolesList, createRole } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { hasPermission } from "@/lib/user";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Shield } from "lucide-react";
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
    
    const canCreate = hasPermission("hrm:create");
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
    
    const handleOpenForm = () => {
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
    };

    const handleSaveRole = async (name: string) => {
        // Create
        const newRole = await createRole(name);
        if (newRole) {
            setRoles([...roles, newRole]);
            toast({ title: "Role Created", description: `The role "${newRole.name}" has been created.` });
        }
        handleCloseForm();
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
                                     {canManageSettings && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleManagePermissions(role.id)}>
                                                    <Shield className="mr-2 h-4 w-4" /> Manage Permissions
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                     )}
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
                onSave={handleSaveRole}
                onOpenChange={handleCloseForm}
            />
        )}
      </>
    );
  }
