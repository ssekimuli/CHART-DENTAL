
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import type { RolePermissions, Permission, EmployeeRole, SystemTreatment } from "@/lib/types";
import { getRoles, updateRole, updateBranch, getProfileData, updateEmployee, getTreatments, getCurrencies } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { hasPermission, getCurrentUser } from "@/lib/user";
import { useRouter } from "next/navigation";
import { useCurrency } from "@/hooks/use-currency";
import { CURRENCIES } from "@/lib/currency";
import { useBranch } from "@/context/branch-context";
import { DataImporter } from "@/components/dashboard/data-importer";
import { TreatmentsCatalog } from "./components/treatments-catalog";

const permissionGroups = {
    Dashboard: ['dashboard:read'],
    Queue: ['queue:read'],
    Patients: ['patients:read', 'patients:create', 'patients:update', 'patients:delete'],
    Charting: ['charting:read', 'charting:update'],
    Appointments: ['appointments:read', 'appointments:create', 'appointments:update', 'appointments:delete'],
    Billing: ['billing:read', 'billing:create', 'billing:update', 'billing:delete'],
    Accounting: ['accounting:read', 'accounting:create'],
    Inventory: ['inventory:read', 'inventory:create', 'inventory:update'],
    Laboratory: ['laboratory:read', 'laboratory:create', 'laboratory:update'],
    HRM: ['hrm:read', 'hrm:create', 'hrm:update', 'hrm:delete'],
    Branches: ['branches:read', 'branches:create'],
    Reports: ['reports:read'],
    Settings: ['settings:manage'],
    Profile: ['profile:read', 'profile:update'],
} as const;


export default function SettingsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [roles, setRoles] = useState<RolePermissions[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRole, setSelectedRole] = useState<RolePermissions | null>(null);
    const { currencyCode, setCurrency } = useCurrency();
    const { selectedBranch, availableBranches } = useBranch();
    const [currencies, setCurrencies] = useState<any[]>(CURRENCIES);

    // Bound state variables
    const [profile, setProfile] = useState<any>(null);
    const [profileName, setProfileName] = useState("");
    const [profileEmail, setProfileEmail] = useState("");
    const [practiceName, setPracticeName] = useState("");
    const [practiceAddress, setPracticeAddress] = useState("");
    const [treatments, setTreatments] = useState<SystemTreatment[]>([]);

    const refreshTreatments = async () => {
        const treatmentsData = await getTreatments();
        setTreatments(treatmentsData);
    };

    useEffect(() => {
        if (!hasPermission("settings:manage")) {
            router.replace("/dashboard");
            return;
        }
        const fetchRolesAndProfile = async () => {
            setIsLoading(true);
            try {
                const [rolesData, profileData, treatmentsData, currenciesData] = await Promise.all([
                    getRoles(),
                    getProfileData(),
                    getTreatments(),
                    getCurrencies()
                ]);
                setRoles(rolesData);
                setSelectedRole(rolesData[0] || null);
                setTreatments(treatmentsData);
                if (currenciesData && currenciesData.length > 0) {
                    setCurrencies(currenciesData);
                }
                if (profileData) {
                    setProfile(profileData);
                    setProfileName(profileData.employee.name);
                    setProfileEmail(profileData.employee.email);
                }
            } catch (err) {
                console.error("Failed to load settings data:", err);
            }
            setIsLoading(false);
        }
        fetchRolesAndProfile();
    }, [router]);

    useEffect(() => {
        if (selectedBranch && availableBranches.length > 0) {
            const activeBranch = availableBranches.find(b => String(b.id) === String(selectedBranch));
            if (activeBranch) {
                setPracticeName(activeBranch.name);
                setPracticeAddress(activeBranch.address);
            }
        }
    }, [selectedBranch, availableBranches]);

    const handleSaveProfile = async () => {
        if (!profile) return;
        try {
            const updated = await updateEmployee(profile.employee.id, {
                name: profileName,
                email: profileEmail,
            });
            if (updated) {
                const localUser = getCurrentUser();
                if (localUser) {
                    localUser.name = profileName;
                    localUser.email = profileEmail;
                    localStorage.setItem('currentUser', JSON.stringify(localUser));
                    window.dispatchEvent(new Event("currentUserChange"));
                }
                toast({
                    title: "Profile Saved",
                    description: "Your profile changes have been successfully saved.",
                });
            }
        } catch (error) {
            toast({
                title: "Save Failed",
                description: "Failed to update profile settings.",
                variant: "destructive",
            });
        }
    };

    const handleSavePractice = async () => {
        const activeBranch = availableBranches.find(b => String(b.id) === String(selectedBranch));
        if (activeBranch) {
            try {
                await updateBranch(activeBranch.id, {
                    name: practiceName,
                    address: practiceAddress,
                    currency: currencyCode,
                });
                toast({
                    title: "Practice Details Saved",
                    description: "Your practice settings have been successfully updated.",
                });
            } catch (error) {
                toast({
                    title: "Save Failed",
                    description: "Failed to update practice settings in database.",
                    variant: "destructive",
                });
            }
        }
    };

    const handlePermissionChange = (permission: Permission, checked: boolean) => {
        if (!selectedRole) return;

        let newPermissions: Permission[];
        if (checked) {
            newPermissions = [...selectedRole.permissions, permission];
        } else {
            newPermissions = selectedRole.permissions.filter(p => p !== permission);
        }
        const updatedRole = { ...selectedRole, permissions: newPermissions };
        setSelectedRole(updatedRole);
    }
    
    const handleGroupPermissionChange = (groupPermissions: readonly Permission[], checked: boolean) => {
        if (!selectedRole) return;

        let newPermissions = [...selectedRole.permissions];
        if (checked) {
            groupPermissions.forEach(p => {
                if (!newPermissions.includes(p)) {
                    newPermissions.push(p);
                }
            });
        } else {
            newPermissions = newPermissions.filter(p => !groupPermissions.includes(p));
        }

        const updatedRole = { ...selectedRole, permissions: newPermissions };
        setSelectedRole(updatedRole);
    }

    const handleSaveChanges = async () => {
        if (selectedRole) {
            const updated = await updateRole(selectedRole.id, selectedRole.permissions);
            if (updated) {
                setRoles(roles.map(r => r.id === updated.id ? updated : r));
                toast({
                    title: 'Permissions Updated',
                    description: `Permissions for ${selectedRole.name} have been saved.`,
                });
            }
        }
    }


  return (
    <Tabs defaultValue="profile">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="practice">Practice</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="roles">Roles &amp; Permissions</TabsTrigger>
        <TabsTrigger value="treatments">Treatments</TabsTrigger>
      </TabsList>
      
      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Manage your personal account settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveProfile}>Save Changes</Button>
          </CardFooter>
        </Card>
      </TabsContent>
      
      <TabsContent value="practice">
        <Card>
          <CardHeader>
            <CardTitle>Practice</CardTitle>
            <CardDescription>
              Update your dental practice's information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 border">
                    <AvatarImage src="https://picsum.photos/seed/logo/200/200" alt="Practice Logo" data-ai-hint="logo company" />
                    <AvatarFallback>PPD</AvatarFallback>
                </Avatar>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="logo">Practice Logo</Label>
                    <Input id="logo" type="file" />
                    <p className="text-xs text-muted-foreground">Recommended size: 200x200px</p>
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="practice-name">Practice Name</Label>
              <Input id="practice-name" value={practiceName} onChange={(e) => setPracticeName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="practice-address">Address</Label>
              <Input id="practice-address" value={practiceAddress} onChange={(e) => setPracticeAddress(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency-select">System Currency</Label>
              <select
                id="currency-select"
                value={currencyCode}
                onChange={async (e) => {
                  const newCurrency = e.target.value;
                  const activeBranch = availableBranches.find(b => String(b.id) === String(selectedBranch));
                  
                  if (activeBranch) {
                    try {
                      await updateBranch(activeBranch.id, {
                        name: activeBranch.name,
                        address: activeBranch.address,
                        currency: newCurrency,
                      });
                      
                      setCurrency(newCurrency);
                      toast({
                        title: "Currency Updated",
                        description: `System currency preference saved in backend for ${activeBranch.name} as ${newCurrency}.`,
                      });
                    } catch (err) {
                      toast({
                        title: "Update Failed",
                        description: "Failed to save currency setting to backend database.",
                        variant: "destructive",
                      });
                    }
                  } else {
                    setCurrency(newCurrency);
                    toast({
                      title: "Currency Updated (Local Only)",
                      description: `System currency preference set to ${newCurrency}.`,
                    });
                  }
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSavePractice}>Save Changes</Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="notifications">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Manage how you receive notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications" className="text-base">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications about appointments and billing via email.</p>
              </div>
              <Switch id="email-notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications" className="text-base">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Get real-time alerts on your device.</p>
              </div>
              <Switch id="push-notifications" />
            </div>
          </CardContent>
           <CardFooter>
            <Button onClick={() => {
                 toast({
                     title: "Preferences Saved",
                     description: "Your notification preferences have been saved locally.",
                 });
             }}>Save Preferences</Button>
          </CardFooter>
        </Card>
      </TabsContent>
      <TabsContent value="roles">
        <Card>
            <CardHeader>
            <CardTitle>Roles & Permissions</CardTitle>
            <CardDescription>
              Define roles and manage permissions for different users.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <div className="md:col-span-1">
                <h4 className="font-semibold mb-2">Roles</h4>
                {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-9 w-full" />
                        <Skeleton className="h-9 w-full" />
                        <Skeleton className="h-9 w-full" />
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        {roles.map(role => (
                             <Button
                                key={role.name}
                                variant={selectedRole?.id === role.id ? "secondary" : "ghost"}
                                className="w-full justify-start"
                                onClick={() => setSelectedRole(role)}
                            >
                                {role.name}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
            <div className="md:col-span-3">
                 <h4 className="font-semibold mb-2">Permissions for {selectedRole?.name}</h4>
                 {isLoading || !selectedRole ? (
                     <div className="space-y-4 rounded-lg border p-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-16 w-full" />
                     </div>
                 ) : (
                    <div className="rounded-lg border">
                         <Accordion type="multiple" defaultValue={Object.keys(permissionGroups)} className="w-full">
                            {Object.entries(permissionGroups).map(([groupName, permissions]) => {
                                const groupPermissions = permissions as readonly Permission[];
                                const isAllChecked = groupPermissions.every(p => selectedRole.permissions.includes(p));
                                const isIndeterminate = groupPermissions.some(p => selectedRole.permissions.includes(p)) && !isAllChecked;

                                return (
                                    <AccordionItem key={groupName} value={groupName}>
                                        <AccordionTrigger className="px-4 py-2 hover:bg-muted/50">
                                            <div className="flex items-center gap-3">
                                                 <Checkbox
                                                    id={`group-${groupName}`}
                                                    checked={isAllChecked}
                                                    aria-checked={isIndeterminate ? "mixed" : isAllChecked}
                                                    onCheckedChange={(checked) => handleGroupPermissionChange(groupPermissions, !!checked)}
                                                    onClick={(e) => e.stopPropagation()} // prevent trigger from firing
                                                />
                                                <span className="font-medium">{groupName}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-4 pb-4">
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 pl-8">
                                                {groupPermissions.map(permission => (
                                                     <div key={permission} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={permission}
                                                            checked={selectedRole.permissions.includes(permission)}
                                                            onCheckedChange={(checked) => handlePermissionChange(permission, !!checked)}
                                                        />
                                                        <label htmlFor={permission} className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize">
                                                            {permission.split(':')[1]}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}
                        </Accordion>
                    </div>
                 )}
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={handleSaveChanges} disabled={isLoading || !selectedRole}>Save Changes</Button>
          </CardFooter>
        </Card>
      </TabsContent>
      <TabsContent value="treatments">
        <Card>
          <CardHeader>
            <CardTitle>Treatments &amp; Procedures Catalog</CardTitle>
            <CardDescription>
              Import and manage the procedures and treatments available in your practice.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-border/40 bg-muted/30 p-4">
                <h4 className="text-sm font-semibold mb-1 text-foreground">Import Catalog</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Upload a CSV file containing your practice's treatment codes, procedure names, standard pricing, and categories to bulk load them.
                </p>
                <DataImporter 
                    type="treatments" 
                    triggerText="Import Treatment Catalog" 
                    onImportSuccess={() => {
                        toast({
                            title: "Catalog Updated",
                            description: "The procedures catalog has been successfully updated.",
                        });
                        refreshTreatments();
                    }} 
                />
            </div>
            
            <div className="mt-6">
                <TreatmentsCatalog currencyCode={currencyCode} />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
