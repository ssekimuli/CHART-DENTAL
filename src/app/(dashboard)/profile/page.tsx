

"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCurrentUser, setCurrentUser } from "@/lib/user";
import type { CurrentUser, Employee, Payroll, Appointment, LeaveRequest, ProfileData } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createLeaveRequest, getProfileData } from "@/lib/api";
import { DollarSign, UserCheck, CalendarDays, UserPlus, Loader2, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LeaveRequestForm } from "../hrm/components/leave-request-form";
import { PayrollTable } from "../payroll/components/payroll-table";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const { toast } = useToast();
    const router = useRouter();
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLeaveFormOpen, setIsLeaveFormOpen] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);


    useEffect(() => {
        const currentUser = getCurrentUser();
        setUser(currentUser);

        if (!currentUser) {
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            const data = await getProfileData();
            setProfileData(data);
            setIsLoading(false);
        }
        fetchData();
    }, []);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user) return;
        
        if (e.target.type === 'file') {
            const file = e.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setAvatarPreview(reader.result as string);
                };
                reader.readAsDataURL(file);
            }
        } else {
            const { id, value } = e.target;
            setUser({ ...user, [id]: value });
        }
    }

    const handleSaveChanges = () => {
        if (user) {
            const updatedUser = { ...user };
            if (avatarPreview) {
                // In a real app, upload the file and get a new URL
                // For this prototype, we'll just use the local preview or a new placeholder
                 updatedUser.avatar = `https://picsum.photos/seed/newAvatar${Date.now()}/200/200`;
            }

            setCurrentUser(updatedUser, localStorage.getItem('authToken') || '');
            setUser(updatedUser);
            setAvatarPreview(null);
            
            toast({
                title: "Profile Updated",
                description: "Your changes have been saved successfully.",
            });
        }
    }
    
    const handleSaveLeaveRequest = async (data: Omit<LeaveRequest, 'id' | 'employeeName' | 'status'>) => {
        const newRequest = await createLeaveRequest(data);
        if (newRequest) {
            toast({
                title: "Leave Request Submitted",
                description: "Your request has been submitted for approval.",
            });
        }
        setIsLeaveFormOpen(false);
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!user || !profileData || !profileData.employee) {
        return <div>Could not load user profile.</div>;
    }
    
    const { employee, stats } = profileData;

    return (
    <>
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center gap-6">
                     <Avatar className="h-24 w-24 border">
                        <AvatarImage src={avatarPreview || user.avatar} alt={user.name} data-ai-hint="person face" />
                        <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <CardTitle className="text-3xl">{user.name}</CardTitle>
                        <CardDescription className="text-base text-muted-foreground">{user.email}</CardDescription>
                         <div className="mt-2 flex items-center gap-2">
                            <Badge variant="outline">{employee.role}</Badge>
                            <Badge
                                variant={employee.status === "Active" ? "secondary" : "outline"}
                                className={employee.status === 'Active' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' : ''}
                                >
                                {employee.status}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <Tabs defaultValue="overview">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">My Dashboard</TabsTrigger>
                    <TabsTrigger value="payroll">Payroll</TabsTrigger>
                    <TabsTrigger value="leave">Leave Request</TabsTrigger>
                    <TabsTrigger value="account">My Account</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                    <div className="flex flex-col gap-6">
                         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">${stats.totalPaid.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground">Total net salary paid to date</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Attendance</CardTitle>
                                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.presentDays} <span className="text-base font-normal"> Days</span></div>
                                    <p className="text-xs text-muted-foreground">{stats.absentDays} Absent, {stats.onLeaveDays} On Leave</p>
                                </CardContent>
                            </Card>
                            { (user.role === 'Dentist' || user.role === 'Hygienist') &&
                            <>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.totalAppointments}</div>
                                     <p className="text-xs text-muted-foreground">Total appointments assigned</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Patients Treated</CardTitle>
                                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.uniquePatients}</div>
                                    <p className="text-xs text-muted-foreground">Unique patients seen</p>
                                </CardContent>
                            </Card>
                            </>
                            }
                        </div>
                         <Card>
                            <CardHeader>
                                <CardTitle>Recent Appointments</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Patient</TableHead>
                                            <TableHead>Treatment</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stats.recentAppointments.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-24 text-center">
                                                    No recent appointments found.
                                                </TableCell>
                                            </TableRow>
                                        ) : stats.recentAppointments.map((app: any) => (
                                            <TableRow key={app.id}>
                                                <TableCell>{app.date.split('T')[0]}</TableCell>
                                                <TableCell>{app.patient_name}</TableCell>
                                                <TableCell>{app.treatment}</TableCell>
                                                <TableCell><Badge variant="outline">{app.status}</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm" onClick={() => router.push(`/patients/${app.patient_id}/charting`)}>
                                                        <FileText className="mr-2 h-4 w-4" />
                                                        Go to Chart
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                 <TabsContent value="payroll">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payroll History</CardTitle>
                            <CardDescription>Your past salary payments.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <PayrollTable data={profileData.payrolls} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="leave">
                    <Card>
                        <CardHeader>
                            <CardTitle>Request Leave</CardTitle>
                            <CardDescription>Submit a new leave request for approval.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <p className="text-muted-foreground mb-4">Click the button below to open the leave request form.</p>
                           <Button onClick={() => setIsLeaveFormOpen(true)}>Request Leave</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="account">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Account Details</CardTitle>
                                <CardDescription>
                                Manage your personal account settings.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input id="name" value={user.name} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" value={user.email} disabled />
                                </div>
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label htmlFor="avatar-file">Profile Picture</Label>
                                    <Input id="avatar-file" type="file" accept="image/*" onChange={handleInputChange}/>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleSaveChanges}>Save Changes</Button>
                            </CardFooter>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Change Password</CardTitle>
                                <CardDescription>
                                Update your login password.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current-password">Current Password</Label>
                                    <Input id="current-password" type="password" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">New Password</Label>
                                    <Input id="new-password" type="password" />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                                    <Input id="confirm-password" type="password" />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button>Update Password</Button>
                            </CardFooter>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
        {isLeaveFormOpen && (
            <LeaveRequestForm
                employees={[employee]}
                onSave={handleSaveLeaveRequest}
                onOpenChange={setIsLeaveFormOpen}
            />
        )}
    </>
    );
}
