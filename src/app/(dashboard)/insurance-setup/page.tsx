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
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { insuranceApi } from "@/services/api/insurance";
import { hasRole } from "@/lib/user";
import { useRouter } from "next/navigation";

export default function InsuranceSetupPage() {
    const router = useRouter();
    const [companies, setCompanies] = useState<any[]>([]);
    const [packages, setPackages] = useState<any[]>([]);
    const [policies, setPolicies] = useState<any[]>([]);
    
    const [loading, setLoading] = useState(true);
    
    // Add Company Modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: "", code: "", email: "", phone: "" });

    // Add Package Modal
    const [isAddPackageModalOpen, setIsAddPackageModalOpen] = useState(false);
    const [companyPopoverOpen, setCompanyPopoverOpen] = useState(false);
    const [packageData, setPackageData] = useState({ insurance_company_id: "", name: "", code: "", default_coverage_percentage: "100" });

    // Add Policy Modal
    const [isAddPolicyModalOpen, setIsAddPolicyModalOpen] = useState(false);
    const [policyData, setPolicyData] = useState({ insurance_package_id: "", policy_number: "", policy_type: "corporate", coverage_start_date: "", coverage_end_date: "", total_coverage_limit: "" });

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
            const [compRes, packRes, polRes] = await Promise.all([
                insuranceApi.getCompanies(),
                insuranceApi.getPackages(),
                insuranceApi.getPolicies()
            ]);
            setCompanies(compRes.data?.data || []);
            setPackages(packRes.data?.data || []);
            setPolicies(polRes.data?.data || []);
        } catch (error) {
            console.error("Failed to load insurance data", error);
        }
        setLoading(false);
    };

    const handleAddCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await insuranceApi.addCompany(formData);
            await fetchData();
            setIsAddModalOpen(false);
            setFormData({ name: "", code: "", email: "", phone: "" });
        } catch (error) {
            console.error("Failed to add company", error);
            alert("Failed to add company.");
        }
        setIsSubmitting(false);
    };

    const handleAddPackage = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await insuranceApi.addPackage(packageData);
            await fetchData();
            setIsAddPackageModalOpen(false);
            setPackageData({ insurance_company_id: "", name: "", code: "", default_coverage_percentage: "100" });
        } catch (error) {
            console.error("Failed to add package", error);
            alert("Failed to add package.");
        }
        setIsSubmitting(false);
    };

    const handleAddPolicy = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await insuranceApi.addPolicy(policyData);
            await fetchData();
            setIsAddPolicyModalOpen(false);
            setPolicyData({ insurance_package_id: "", policy_number: "", policy_type: "corporate", coverage_start_date: "", coverage_end_date: "", total_coverage_limit: "" });
        } catch (error) {
            console.error("Failed to add policy", error);
            alert("Failed to add policy.");
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
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center">Loading...</TableCell>
                                        </TableRow>
                                    ) : companies.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground">No companies found.</TableCell>
                                        </TableRow>
                                    ) : (
                                        companies.map((company) => (
                                            <TableRow key={company.id}>
                                                <TableCell className="font-bold">{company.code}</TableCell>
                                                <TableCell>{company.name}</TableCell>
                                                <TableCell>{company.email || 'N/A'}</TableCell>
                                                <TableCell>{company.status}</TableCell>
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
                            <Dialog open={isAddPackageModalOpen} onOpenChange={setIsAddPackageModalOpen}>
                                <DialogTrigger asChild>
                                    <Button>+ Add Package</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <form onSubmit={handleAddPackage}>
                                        <DialogHeader>
                                            <DialogTitle>Add Insurance Package</DialogTitle>
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
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {packages.map((pkg) => (
                                        <TableRow key={pkg.id}>
                                            <TableCell className="font-bold">{pkg.code}</TableCell>
                                            <TableCell>{pkg.name}</TableCell>
                                            <TableCell>{pkg.default_coverage_percentage}%</TableCell>
                                            <TableCell>{pkg.status}</TableCell>
                                        </TableRow>
                                    ))}
                                    {packages.length === 0 && (
                                        <TableRow><TableCell colSpan={4} className="text-center">No packages found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* POLICIES TAB */}
                <TabsContent value="policies">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Master Policies</CardTitle>
                                <CardDescription>Manage master group/corporate policies.</CardDescription>
                            </div>
                            <Dialog open={isAddPolicyModalOpen} onOpenChange={setIsAddPolicyModalOpen}>
                                <DialogTrigger asChild>
                                    <Button>+ Add Policy</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <form onSubmit={handleAddPolicy}>
                                        <DialogHeader>
                                            <DialogTitle>Add Master Policy</DialogTitle>
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
                                                <Label className="text-right">Start Date *</Label>
                                                <Input required type="date" className="col-span-3" value={policyData.coverage_start_date} onChange={e => setPolicyData({...policyData, coverage_start_date: e.target.value})} />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label className="text-right">End Date *</Label>
                                                <Input required type="date" className="col-span-3" value={policyData.coverage_end_date} onChange={e => setPolicyData({...policyData, coverage_end_date: e.target.value})} />
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
                                        <TableHead>Type</TableHead>
                                        <TableHead>Dates</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {policies.map((pol) => (
                                        <TableRow key={pol.id}>
                                            <TableCell className="font-bold">{pol.policy_number}</TableCell>
                                            <TableCell className="capitalize">{pol.policy_type}</TableCell>
                                            <TableCell>{pol.coverage_start_date} to {pol.coverage_end_date}</TableCell>
                                            <TableCell>{pol.status}</TableCell>
                                        </TableRow>
                                    ))}
                                    {policies.length === 0 && (
                                        <TableRow><TableCell colSpan={4} className="text-center">No policies found.</TableCell></TableRow>
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
