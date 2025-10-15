
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
import { getRolesList } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { hasPermission } from "@/lib/user";
import { useRouter } from "next/navigation";

type Role = {
    id: string;
    name: string;
};

export default function StaffPositionPage() {
    const router = useRouter();
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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

    return (
      <Card>
        <CardHeader>
          <CardTitle>Staff Positions</CardTitle>
          <CardDescription>
            A list of all roles and positions within your practice.
          </CardDescription>
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
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>Position Name</TableHead>
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
                                <TableCell className="font-mono">{role.id}</TableCell>
                                <TableCell className="font-medium">{role.name}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    );
  }
