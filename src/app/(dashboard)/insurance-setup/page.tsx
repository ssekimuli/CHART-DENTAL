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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { insuranceApi } from "@/services/api/insurance";
import { hasRole } from "@/lib/user";
import { useRouter } from "next/navigation";

export default function InsuranceSetupPage() {
    const router = useRouter();
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: "", code: "", email: "", phone: "" });

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

    const handleAddCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await insuranceApi.addCompany(formData);
            await fetchCompanies();
            setIsAddModalOpen(false);
            setFormData({ name: "", code: "", email: "", phone: "" });
        } catch (error) {
            console.error("Failed to add company", error);
            alert("Failed to add company. Code might be duplicate or missing fields.");
        }
        setIsSubmitting(false);
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
                            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                                <DialogTrigger asChild>
                                    <Button>+ Add Company</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <form onSubmit={handleAddCompany}>
                                        <DialogHeader>
                                            <DialogTitle>Add Insurance Company</DialogTitle>
                                            <DialogDescription>Create a new insurance provider for patient billing.</DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="name" className="text-right">Name *</Label>
                                                <Input id="name" required className="col-span-3" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Aetna" />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="code" className="text-right">Code *</Label>
                                                <Input id="code" required className="col-span-3" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="e.g. AET-01" />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="email" className="text-right">Email</Label>
                                                <Input id="email" type="email" className="col-span-3" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="billing@aetna.com" />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="phone" className="text-right">Phone</Label>
                                                <Input id="phone" className="col-span-3" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+1 800 123 4567" />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={isSubmitting}>
                                                {isSubmitting ? "Saving..." : "Save Company"}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
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
