
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  Settings,
  Briefcase,
  HandCoins,
  Building,
  Package,
  FlaskConical,
  BarChart3,
  FileText,
  ClipboardList,
  ChevronDown,
  User,
  UserCog,
  CalendarClock,
  NotebookPen,
  Clock,
  DollarSign,
  Landmark,
} from "lucide-react";
import type { EmployeeRole } from "@/lib/types";
import { currentUser } from "@/lib/user";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import React, { useEffect, useState } from "react";

const allLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ['Super Admin', 'Account', 'HR', 'Dentist', 'Hygienist', 'Receptionist', 'Assistant'] as EmployeeRole[] },
  { href: "/queue", label: "Queue", icon: ClipboardList, roles: ['Super Admin', 'Dentist', 'Hygienist', 'Receptionist', 'Assistant'] as EmployeeRole[] },
  { href: "/patients", label: "Patients", icon: Users, roles: ['Super Admin', 'Dentist', 'Hygienist', 'Receptionist', 'Assistant'] as EmployeeRole[] },
  { href: "/charting", label: "Charting", icon: FileText, roles: ['Super Admin', 'Dentist', 'Hygienist'] as EmployeeRole[] },
  { href: "/appointments", label: "Appointments", icon: Calendar, roles: ['Super Admin', 'Dentist', 'Hygienist', 'Receptionist', 'Assistant'] as EmployeeRole[] },
  { href: "/billing", label: "Billing", icon: CreditCard, roles: ['Super Admin', 'Account', 'Receptionist'] as EmployeeRole[] },
  { href: "/accounting", label: "Accounting", icon: Landmark, roles: ['Super Admin', 'Account'] as EmployeeRole[] },
  { href: "/inventory", label: "Inventory", icon: Package, roles: ['Super Admin', 'Receptionist', 'Assistant'] as EmployeeRole[] },
  { href: "/laboratory", label: "Laboratory", icon: FlaskConical, roles: ['Super Admin', 'Dentist', 'Assistant'] as EmployeeRole[] },
  { 
    label: "HRM", 
    icon: Briefcase, 
    roles: ['Super Admin', 'HR', 'Account'] as EmployeeRole[],
    subLinks: [
        { href: "/hrm/staff", label: "Staff", icon: User, roles: ['Super Admin', 'HR'] as EmployeeRole[] },
        { href: "/hrm/staff-position", label: "Staff Position", icon: UserCog, roles: ['Super Admin', 'HR'] as EmployeeRole[] },
        { href: "/hrm/payroll", label: "Payroll", icon: HandCoins, roles: ['Super Admin', 'HR', 'Account'] as EmployeeRole[] },
        { href: "/hrm/staff-salaries", label: "Staff Salaries", icon: DollarSign, roles: ['Super Admin', 'HR', 'Account'] as EmployeeRole[] },
        { href: "/hrm/leave", label: "Leave", icon: CalendarClock, roles: ['Super Admin', 'HR'] as EmployeeRole[] },
        { href: "/hrm/staff-advances", label: "Staff Advances", icon: NotebookPen, roles: ['Super Admin', 'HR', 'Account'] as EmployeeRole[] },
        { href: "/hrm/attendance", label: "Attendance", icon: Clock, roles: ['Super Admin', 'HR'] as EmployeeRole[] },
    ]
  },
  { href: "/branches", label: "Branches", icon: Building, roles: ['Super Admin'] as EmployeeRole[] },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: ['Super Admin', 'Account', 'HR'] as EmployeeRole[] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ['Super Admin', 'Account', 'HR', 'Dentist', 'Hygienist', 'Receptionist', 'Assistant'] as EmployeeRole[] },
];

export function MainNav() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState(currentUser.role);
  
  useEffect(() => {
    // This effect can be used to update the role if it changes during the session
    setUserRole(currentUser.role);
  }, []);

  const isHrmActive = pathname.startsWith('/hrm');

  const accessibleLinks = allLinks.filter(link => {
    if (link.roles.includes(userRole)) {
        if (link.subLinks) {
            link.subLinks = link.subLinks.filter(sublink => sublink.roles.includes(userRole));
            return link.subLinks.length > 0;
        }
        return true;
    }
    return false;
  });

  return (
    <div className="flex w-full flex-col gap-2 p-2">
      <SidebarMenu>
        {accessibleLinks.map((link) => (
          <SidebarMenuItem key={link.href || link.label}>
             {link.subLinks ? (
                 <Collapsible defaultOpen={isHrmActive}>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                            variant="ghost"
                            className="w-full justify-between"
                            isActive={isHrmActive}
                            tooltip={link.label}
                        >
                            <div className="flex items-center gap-2">
                                <link.icon />
                                <span>{link.label}</span>
                            </div>
                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenuSub>
                            {link.subLinks.map(subLink => (
                                <SidebarMenuSubItem key={subLink.href}>
                                    <SidebarMenuSubButton asChild isActive={pathname.startsWith(subLink.href)}>
                                        <Link href={subLink.href}>
                                            <subLink.icon />
                                            <span>{subLink.label}</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            ))}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                 </Collapsible>
             ) : (
                <SidebarMenuButton
                    asChild
                    isActive={
                        link.href === "/dashboard"
                        ? pathname === "/dashboard" || pathname === "/"
                        : pathname.startsWith(link.href!)
                    }
                    tooltip={link.label}
                    >
                    <Link href={link.href!}>
                        <link.icon />
                        <span>{link.label}</span>
                    </Link>
                </SidebarMenuButton>
             )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </div>
  );
}
