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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { insuranceApi } from "@/services/api/insurance";
import { hasRole } from "@/lib/user";
import { useRouter } from "next/navigation";

export default function InsuranceSetupPage() {
    const router = useRouter();
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!hasRole("Super Admin")) {
            router.replace("/dashboard");
            return;
        }
        fetchCompanies();
    }, [router]);

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const res = await insuranceApi.getCompanies();
            setCompanies(res.data?.data || []);
        } catch (error) {
            console.error("Failed to load insurance companies", error);
        }
        setLoading(false);
    };

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Insurance Setup</h2>
            </div>
            
            <Tabs defaultValue="companies">
                <TabsList>
                    <TabsTrigger value="companies">Insurance Companies</TabsTrigger>
                    <TabsTrigger value="packages">Packages & Rules</TabsTrigger>
                </TabsList>
                
                <TabsContent value="companies">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Insurance Companies</CardTitle>
                                <CardDescription>Manage your partnered insurance providers.</CardDescription>
                            </div>
                            <Button>+ Add Company</Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Packages</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                                        </TableRow>
                                    ) : companies.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground">No companies found.</TableCell>
                                        </TableRow>
                                    ) : (
                                        companies.map((company) => (
                                            <TableRow key={company.id}>
                                                <TableCell className="font-bold">{company.code}</TableCell>
                                                <TableCell>{company.name}</TableCell>
                                                <TableCell>{company.email || 'N/A'}</TableCell>
                                                <TableCell>{company.packages_count || 0}</TableCell>
                                                <TableCell>{company.status}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="packages">
                    <Card>
                        <CardHeader>
                            <CardTitle>Insurance Packages</CardTitle>
                            <CardDescription>Select a company to manage its packages and coverage rules.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Future implementation: Here you will select a company, view its packages, and map specific procedures to coverage amounts (e.g. 100% or Fixed Cost).
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
