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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { insuranceApi } from "@/services/api/insurance";
import { hasRole } from "@/lib/user";
import { useConfirm } from "@/hooks/use-confirm";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import moment from "moment";

export default function InsuranceSetupPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();
    const [companies, setCompanies] = useState<any[]>([]);
    const [packages, setPackages] = useState<any[]>([]);
    const [policies, setPolicies] = useState<any[]>([]);
    const [procedures, setProcedures] = useState<any[]>([]);
    
    const [loading, setLoading] = useState(true);
    
    // Add Company Modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: "", code: "", email: "", phone: "" });

    // Add Package Modal
    const [isAddPackageModalOpen, setIsAddPackageModalOpen] = useState(false);
    const [editingPackageId, setEditingPackageId] = useState<number | null>(null);
    const [companyPopoverOpen, setCompanyPopoverOpen] = useState(false);
    const [packageData, setPackageData] = useState({ insurance_company_id: "", name: "", code: "", default_coverage_percentage: "100" });

    // Add Policy Modal
    const [isAddPolicyModalOpen, setIsAddPolicyModalOpen] = useState(false);
    const [editingPolicyId, setEditingPolicyId] = useState<number | null>(null);
    const [policyData, setPolicyData] = useState({ insurance_package_id: "", policy_number: "", policy_type: "corporate", employer_or_group_name: "", coverage_start_date: "", coverage_end_date: "", total_coverage_limit: "" });

    // Map Procedures Modal
    const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
    const [procedurePopoverOpen, setProcedurePopoverOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<any>(null);
    const [packageTreatments, setPackageTreatments] = useState<any[]>([]);
    const [mappingData, setMappingData] = useState({ procedure_id: "", coverage_type: "percentage", coverage_value: "100" });

    useEffect(() => {
        if (!hasRole("Super Admin")) {
            router.replace("/dashboard");
            return;
        }
        fetchData();
    }, [router]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [compRes, packRes, polRes, procRes] = await Promise.all([
                insuranceApi.getCompanies(),
                insuranceApi.getPackages(),
                insuranceApi.getPolicies(),
                insuranceApi.getProcedures()
            ]);
            setCompanies(compRes.data?.data || []);
            setPackages(packRes.data?.data || []);
            setPolicies(polRes.data?.data || []);
            setProcedures(Array.isArray(procRes.data) ? procRes.data : (procRes.data?.data || []));
        } catch (error) {
            console.error("Failed to load insurance data", error);
        }
        setLoading(false);
    };

    const handleAddCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingCompanyId) {
                await insuranceApi.updateCompany(editingCompanyId, formData);
            } else {
                await insuranceApi.addCompany(formData);
            }
            await fetchData();
            setIsAddModalOpen(false);
            setEditingCompanyId(null);
            setFormData({ name: "", code: "", email: "", phone: "" });
        } catch (error: any) {
            console.error("Failed to save company", error);
            toast({
                title: "Error",
                description: error?.response?.data?.message || "Failed to save company.",
                variant: "destructive"
            });
        }
        setIsSubmitting(false);
    };

    const executeDeleteCompany = async (id: number) => {
        try {
            await insuranceApi.deleteCompany(id);
            await fetchData();
            toast({ title: "Success", description: "Company deleted successfully." });
        } catch (error: any) {
            toast({ title: "Error", description: error?.response?.data?.message || "Failed to delete.", variant: "destructive" });
        }
    };

    const handleDeleteCompany = (id: number) => {
        confirm({ description: "Are you sure you want to delete this company?", onConfirm: () => executeDeleteCompany(id) });
    };

    const handleAddPackage = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingPackageId) {
                await insuranceApi.updatePackage(editingPackageId, packageData);
            } else {
                await insuranceApi.addPackage(packageData);
            }
            await fetchData();
            setIsAddPackageModalOpen(false);
            setEditingPackageId(null);
            setPackageData({ insurance_company_id: "", name: "", code: "", default_coverage_percentage: "100" });
        } catch (error: any) {
            console.error("Failed to save package", error);
            toast({
                title: "Error",
                description: error?.response?.data?.message || "Failed to save package.",
                variant: "destructive"
            });
        }
        setIsSubmitting(false);
    };

    const executeDeletePackage = async (id: number) => {
        try {
            await insuranceApi.deletePackage(id);
            await fetchData();
            toast({ title: "Success", description: "Package deleted successfully." });
        } catch (error: any) {
            toast({ title: "Error", description: error?.response?.data?.message || "Failed to delete.", variant: "destructive" });
        }
    };

    const handleDeletePackage = (id: number) => {
        confirm({ description: "Are you sure you want to delete this package?", onConfirm: () => executeDeletePackage(id) });
    };

    const handleAddPolicy = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingPolicyId) {
                await insuranceApi.updatePolicy(editingPolicyId, policyData);
            } else {
                await insuranceApi.addPolicy(policyData);
            }
            await fetchData();
            setIsAddPolicyModalOpen(false);
            setEditingPolicyId(null);
            setPolicyData({ insurance_package_id: "", policy_number: "", policy_type: "corporate", employer_or_group_name: "", coverage_start_date: "", coverage_end_date: "", total_coverage_limit: "" });
        } catch (error: any) {
            console.error("Failed to save policy", error);
            toast({
                title: "Error",
                description: error?.response?.data?.message || "Failed to save policy.",
                variant: "destructive"
            });
        }
        setIsSubmitting(false);
    };

    const executeDeletePolicy = async (id: number) => {
        try {
            await insuranceApi.deletePolicy(id);
            await fetchData();
            toast({ title: "Success", description: "Policy deleted successfully." });
        } catch (error: any) {
            toast({ title: "Error", description: error?.response?.data?.message || "Failed to delete.", variant: "destructive" });
        }
    };

    const handleDeletePolicy = (id: number) => {
        confirm({ description: "Are you sure you want to delete this policy?", onConfirm: () => executeDeletePolicy(id) });
    };

    const openMappingModal = async (pkg: any) => {
        setSelectedPackage(pkg);
        setPackageTreatments([]);
        setIsMappingModalOpen(true);
        try {
            const res = await insuranceApi.getPackageTreatments(pkg.id);
            setPackageTreatments(res.data?.data || []);
        } catch (error) {
            console.error("Failed to load package treatments", error);
        }
    };

    const handleAddMapping = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await insuranceApi.addPackageTreatment(selectedPackage.id, mappingData);
            const res = await insuranceApi.getPackageTreatments(selectedPackage.id);
            setPackageTreatments(res.data?.data || []);
            setMappingData({ procedure_id: "", coverage_type: "percentage", coverage_value: "100" });
        } catch (error: any) {
            console.error("Failed to map treatment", error);
            toast({
                title: "Error",
                description: error?.response?.data?.message || "Failed to map treatment.",
                variant: "destructive"
            });
        }
        setIsSubmitting(false);
    };

    const handleRemoveMapping = async (id: number) => {
        try {
            await insuranceApi.removePackageTreatment(selectedPackage.id, id);
            setPackageTreatments(packageTreatments.filter(t => t.id !== id));
        } catch (error: any) {
            console.error("Failed to remove mapping", error);
            toast({
                title: "Error",
                description: error?.response?.data?.message || "Failed to remove mapping.",
                variant: "destructive"
            });
        }
    };

    const handleCompanyStatusChange = async (id: number, status: string) => {
        try {
            await insuranceApi.updateCompanyStatus(id, status);
            setCompanies(companies.map(c => c.id === id ? { ...c, status } : c));
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const handlePackageStatusChange = async (id: number, status: string) => {
        try {
            await insuranceApi.updatePackageStatus(id, status);
            setPackages(packages.map(p => p.id === id ? { ...p, status } : p));
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const handlePolicyStatusChange = async (id: number, status: string) => {
        try {
            await insuranceApi.updatePolicyStatus(id, status);
            setPolicies(policies.map(p => p.id === id ? { ...p, status } : p));
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <ConfirmDialog />
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Insurance Setup</h2>
            </div>
            
            <Tabs defaultValue="companies">
                <TabsList>
                    <TabsTrigger value="companies">Insurance Companies</TabsTrigger>
                    <TabsTrigger value="packages">Packages</TabsTrigger>
                    <TabsTrigger value="policies">Master Policies</TabsTrigger>
                </TabsList>
                
                {/* COMPANIES TAB */}
                <TabsContent value="companies">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Insurance Companies</CardTitle>
                                <CardDescription>Manage your partnered insurance providers.</CardDescription>
                            </div>
                            <Dialog open={isAddModalOpen} onOpenChange={(open) => {
                                setIsAddModalOpen(open);
                                if (!open) setEditingCompanyId(null);
                            }}>
                                <DialogTrigger asChild>
                                    <Button onClick={() => {
                                        setEditingCompanyId(null);
                                        setFormData({ name: "", code: "", email: "", phone: "" });
                                    }}>+ Add Company</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <form onSubmit={handleAddCompany}>
                                        <DialogHeader>
                                            <DialogTitle>{editingCompanyId ? "Edit Company" : "Add Insurance Company"}</DialogTitle>
                                            <DialogDescription>{editingCompanyId ? "Update insurance provider details." : "Create a new insurance provider for patient billing."}</DialogDescription>
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
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
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
                                                <TableCell>
                                                    <Select value={company.status} onValueChange={(v) => handleCompanyStatusChange(company.id, v)}>
                                                        <SelectTrigger className="w-[120px] h-8 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="active">Active</SelectItem>
                                                            <SelectItem value="inactive">Inactive</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button variant="ghost" size="sm" onClick={() => {
                                                        setEditingCompanyId(company.id);
                                                        setFormData({ name: company.name, code: company.code, email: company.email || "", phone: company.phone || "" });
                                                        setIsAddModalOpen(true);
                                                    }}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteCompany(company.id)} className="text-destructive hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                {/* PACKAGES TAB */}
                <TabsContent value="packages">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Insurance Packages</CardTitle>
                                <CardDescription>Manage packages (e.g. Gold, Silver) for each company.</CardDescription>
                            </div>
                            <Dialog open={isAddPackageModalOpen} onOpenChange={(open) => {
                                setIsAddPackageModalOpen(open);
                                if (!open) setEditingPackageId(null);
                            }}>
                                <DialogTrigger asChild>
                                    <Button onClick={() => {
                                        setEditingPackageId(null);
                                        setPackageData({ insurance_company_id: "", name: "", code: "", default_coverage_percentage: "100" });
                                    }}>+ Add Package</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <form onSubmit={handleAddPackage}>
                                        <DialogHeader>
                                            <DialogTitle>{editingPackageId ? "Edit Package" : "Add Insurance Package"}</DialogTitle>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label className="text-right">Company *</Label>
                                                <div className="col-span-3 flex flex-col">
                                                    <Popover open={companyPopoverOpen} onOpenChange={setCompanyPopoverOpen}>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                aria-expanded={companyPopoverOpen}
                                                                className="w-full justify-between"
                                                            >
                                                                {packageData.insurance_company_id
                                                                    ? companies.find((c) => String(c.id) === packageData.insurance_company_id)?.name
                                                                    : "Search company..."}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[300px] p-0" style={{ zIndex: 9999 }}>
                                                            <Command>
                                                                <CommandInput placeholder="Search company..." />
                                                                <CommandEmpty>No company found.</CommandEmpty>
                                                                <CommandList>
                                                                    <CommandGroup>
                                                                        {companies.map((company) => (
                                                                            <CommandItem
                                                                                key={company.id}
                                                                                value={company.name}
                                                                                onSelect={() => {
                                                                                    setPackageData({ ...packageData, insurance_company_id: String(company.id) });
                                                                                    setCompanyPopoverOpen(false);
                                                                                }}
                                                                            >
                                                                                <Check
                                                                                    className={cn(
                                                                                        "mr-2 h-4 w-4",
                                                                                        packageData.insurance_company_id === String(company.id) ? "opacity-100" : "opacity-0"
                                                                                    )}
                                                                                />
                                                                                {company.name}
                                                                            </CommandItem>
                                                                        ))}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label className="text-right">Name *</Label>
                                                <Input required className="col-span-3" value={packageData.name} onChange={e => setPackageData({...packageData, name: e.target.value})} placeholder="e.g. Gold Plan" />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label className="text-right">Code *</Label>
                                                <Input required className="col-span-3" value={packageData.code} onChange={e => setPackageData({...packageData, code: e.target.value})} placeholder="e.g. GLD-01" />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label className="text-right">Coverage %</Label>
                                                <Input type="number" max="100" className="col-span-3" value={packageData.default_coverage_percentage} onChange={e => setPackageData({...packageData, default_coverage_percentage: e.target.value})} />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={isSubmitting}>
                                                {isSubmitting ? "Saving..." : "Save Package"}
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
                                        <TableHead>Coverage %</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {packages.map((pkg) => (
                                        <TableRow key={pkg.id}>
                                            <TableCell className="font-bold">{pkg.code}</TableCell>
                                            <TableCell>{pkg.name}</TableCell>
                                            <TableCell>{pkg.default_coverage_percentage}%</TableCell>
                                            <TableCell>
                                                <Select value={pkg.status} onValueChange={(v) => handlePackageStatusChange(pkg.id, v)}>
                                                    <SelectTrigger className="w-[120px] h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="active">Active</SelectItem>
                                                        <SelectItem value="inactive">Inactive</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2 flex justify-end">
                                                <Button variant="ghost" size="sm" onClick={() => openMappingModal(pkg)}>
                                                    Map Coverages
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => {
                                                    setEditingPackageId(pkg.id);
                                                    setPackageData({ insurance_company_id: String(pkg.insurance_company_id), name: pkg.name, code: pkg.code, default_coverage_percentage: pkg.default_coverage_percentage });
                                                    setIsAddPackageModalOpen(true);
                                                }}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeletePackage(pkg.id)} className="text-destructive hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {packages.length === 0 && (
                                        <TableRow><TableCell colSpan={5} className="text-center">No packages found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Mapping Modal */}
                    <Dialog open={isMappingModalOpen} onOpenChange={setIsMappingModalOpen}>
                        <DialogContent className="max-w-3xl">
                            <DialogHeader>
                                <DialogTitle>Map Procedures for {selectedPackage?.name}</DialogTitle>
                                <DialogDescription>Override default package coverage for specific procedures.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <form onSubmit={handleAddMapping} className="flex gap-4 items-end bg-muted/50 p-4 rounded-lg">
                                    <div className="grid gap-2 flex-1">
                                        <Label>Procedure</Label>
                                        <Popover open={procedurePopoverOpen} onOpenChange={setProcedurePopoverOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={procedurePopoverOpen}
                                                    className="w-full justify-between"
                                                >
                                                    {mappingData.procedure_id
                                                        ? (() => {
                                                            const p = procedures.find((c) => String(c.id) === mappingData.procedure_id);
                                                            return p ? `${p.procedure} (${p.treatment_code || 'N/A'})` : "Search procedure...";
                                                        })()
                                                        : "Search procedure..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] p-0" style={{ zIndex: 9999 }}>
                                                <Command>
                                                    <CommandInput placeholder="Search procedure..." />
                                                    <CommandEmpty>No procedure found.</CommandEmpty>
                                                    <CommandList>
                                                        <CommandGroup>
                                                            {procedures.map((p) => (
                                                                <CommandItem
                                                                    key={p.id}
                                                                    value={`${p.procedure} ${p.treatment_code || ''} ${p.id}`}
                                                                    onSelect={() => {
                                                                        setMappingData({ ...mappingData, procedure_id: String(p.id) });
                                                                        setProcedurePopoverOpen(false);
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            mappingData.procedure_id === String(p.id) ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {p.procedure} ({p.treatment_code || 'N/A'})
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="grid gap-2 w-32">
                                        <Label>Type</Label>
                                        <Select onValueChange={(v) => setMappingData({...mappingData, coverage_type: v})} value={mappingData.coverage_type}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="percentage">Percentage</SelectItem>
                                                <SelectItem value="fixed_amount">Fixed Amt</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2 w-24">
                                        <Label>Value</Label>
                                        <Input type="number" required value={mappingData.coverage_value} onChange={e => setMappingData({...mappingData, coverage_value: e.target.value})} />
                                    </div>
                                    <Button type="submit" disabled={isSubmitting}>Add</Button>
                                </form>

                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Procedure</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Value</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {packageTreatments.map((pt) => (
                                            <TableRow key={pt.id}>
                                                <TableCell>{pt.procedure?.procedure || pt.procedure?.name}</TableCell>
                                                <TableCell className="capitalize">{pt.coverage_type.replace('_', ' ')}</TableCell>
                                                <TableCell>
                                                    {pt.coverage_type === 'percentage' ? `${pt.coverage_value}%` : `$${pt.coverage_value}`}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => handleRemoveMapping(pt.id)} className="text-destructive">Remove</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {packageTreatments.length === 0 && (
                                            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No specific coverages mapped.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </DialogContent>
                    </Dialog>
                </TabsContent>

                {/* POLICIES TAB */}
                <TabsContent value="policies">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Master Policies</CardTitle>
                                <CardDescription>Manage master group/corporate policies.</CardDescription>
                            </div>
                            <Dialog open={isAddPolicyModalOpen} onOpenChange={(open) => {
                                setIsAddPolicyModalOpen(open);
                                if (!open) setEditingPolicyId(null);
                            }}>
                                <DialogTrigger asChild>
                                    <Button onClick={() => {
                                        setEditingPolicyId(null);
                                        setPolicyData({ insurance_package_id: "", policy_number: "", policy_type: "corporate", employer_or_group_name: "", coverage_start_date: "", coverage_end_date: "", total_coverage_limit: "" });
                                    }}>+ Add Policy</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <form onSubmit={handleAddPolicy}>
                                        <DialogHeader>
                                            <DialogTitle>{editingPolicyId ? "Edit Policy" : "Add Master Policy"}</DialogTitle>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label className="text-right">Package *</Label>
                                                <div className="col-span-3">
                                                    <Select onValueChange={(v) => setPolicyData({...policyData, insurance_package_id: v})} required>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select Package" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {packages.map(p => (
                                                                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label className="text-right">Policy # *</Label>
                                                <Input required className="col-span-3" value={policyData.policy_number} onChange={e => setPolicyData({...policyData, policy_number: e.target.value})} placeholder="e.g. POL-999" />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label className="text-right">Type</Label>
                                                <div className="col-span-3">
                                                    <Select onValueChange={(v) => setPolicyData({...policyData, policy_type: v})} value={policyData.policy_type}>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="individual">Individual</SelectItem>
                                                            <SelectItem value="family">Family</SelectItem>
                                                            <SelectItem value="corporate">Corporate</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            {policyData.policy_type === 'corporate' && (
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label className="text-right">Employer Name</Label>
                                                    <Input className="col-span-3" value={policyData.employer_or_group_name} onChange={e => setPolicyData({...policyData, employer_or_group_name: e.target.value})} placeholder="e.g. TechCorp Inc." />
                                                </div>
                                            )}
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label className="text-right">Start Date *</Label>
                                                <Input required type="date" className="col-span-3" value={policyData.coverage_start_date} onChange={e => setPolicyData({...policyData, coverage_start_date: e.target.value})} />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label className="text-right">End Date *</Label>
                                                <Input required type="date" className="col-span-3" value={policyData.coverage_end_date} onChange={e => setPolicyData({...policyData, coverage_end_date: e.target.value})} />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label className="text-right">Overall Limit</Label>
                                                <Input type="number" className="col-span-3" value={policyData.total_coverage_limit} onChange={e => setPolicyData({...policyData, total_coverage_limit: e.target.value})} placeholder="Optional Limit (e.g. 50000)" />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={isSubmitting}>
                                                {isSubmitting ? "Saving..." : "Save Policy"}
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
                                        <TableHead>Policy #</TableHead>
                                        <TableHead>Employer / Group</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Limit</TableHead>
                                        <TableHead>Dates</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {policies.map((pol) => (
                                        <TableRow key={pol.id}>
                                            <TableCell className="font-bold">{pol.policy_number}</TableCell>
                                            <TableCell>{pol.employer_or_group_name || 'N/A'}</TableCell>
                                            <TableCell className="capitalize">{pol.policy_type}</TableCell>
                                            <TableCell>{pol.total_coverage_limit ? `UGX ${Number(pol.total_coverage_limit).toLocaleString()}` : 'No Limit'}</TableCell>
                                            <TableCell>{moment(pol.coverage_start_date).format('MMM DD, YYYY')} to {moment(pol.coverage_end_date).format('MMM DD, YYYY')}</TableCell>
                                            <TableCell>
                                                <Select value={pol.status} onValueChange={(v) => handlePolicyStatusChange(pol.id, v)}>
                                                    <SelectTrigger className="w-[120px] h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pending">Pending</SelectItem>
                                                        <SelectItem value="active">Active</SelectItem>
                                                        <SelectItem value="suspended">Suspended</SelectItem>
                                                        <SelectItem value="expired">Expired</SelectItem>
                                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="ghost" size="icon" onClick={() => {
                                                    setEditingPolicyId(pol.id);
                                                    setPolicyData({ insurance_package_id: String(pol.insurance_package_id), policy_number: pol.policy_number, policy_type: pol.policy_type, employer_or_group_name: pol.employer_or_group_name || "", coverage_start_date: pol.coverage_start_date, coverage_end_date: pol.coverage_end_date, total_coverage_limit: pol.total_coverage_limit || "" });
                                                    setIsAddPolicyModalOpen(true);
                                                }}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeletePolicy(pol.id)} className="text-destructive hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {policies.length === 0 && (
                                        <TableRow><TableCell colSpan={7} className="text-center">No policies found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}
