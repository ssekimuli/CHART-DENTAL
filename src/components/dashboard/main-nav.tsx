
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
  Pill,
  Database,
  History,
  Handshake,
} from "lucide-react";
import type { EmployeeRole, Permission } from "@/lib/types";
import { getCurrentUser, hasPermission, hasRole } from "@/lib/user";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import React, { useEffect, useState } from "react";

type NavLink = {
    href?: string;
    label: string;
    icon: React.ElementType;
    permission?: Permission;
    subLinks?: Omit<NavLink, 'subLinks'>[];
}

const allLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/queue", label: "Queue", icon: ClipboardList },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/charting", label: "Charting", icon: FileText },
  { href: "/appointments", label: "Appointments", icon: Calendar },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/insurance", label: "Insurance & Claims", icon: Handshake },
  { href: "/pharmacy", label: "Pharmacy", icon: Pill },
  { href: "/accounting", label: "Accounting", icon: Landmark },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/clients", label: "Clients", icon: Handshake, permission: 'laboratory:read' },
  { href: "/laboratory", label: "Laboratory", icon: FlaskConical, permission: 'laboratory:read' },
  { 
    label: "HRM", 
    icon: Briefcase, 
    subLinks: [
        { href: "/hrm/staff", label: "Staff", icon: User, permission: 'hrm:read' },
        { href: "/hrm/staff-position", label: "Staff Position", icon: UserCog, permission: 'hrm:read' },
        { href: "/hrm/payroll", label: "Payroll", icon: HandCoins, permission: 'hrm:read' },
        { href: "/hrm/staff-salaries", label: "Staff Salaries", icon: DollarSign, permission: 'hrm:read' },
        { href: "/hrm/leave", label: "Leave", icon: CalendarClock, permission: 'hrm:read' },
        { href: "/hrm/staff-advances", label: "Staff Advances", icon: NotebookPen, permission: 'hrm:read' },
        { href: "/hrm/attendance", label: "Attendance", icon: Clock, permission: 'hrm:read' },
    ]
  },
  { href: "/branches", label: "Branches", icon: Building, permission: 'branches:read' },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/activity-logs", label: "Activity Logs", icon: History },
  { href: "/admin/migration", label: "Data Migration", icon: Database },
];

export function MainNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  
  useEffect(() => {
    // On component mount on the client, get the full user object from local storage.
    const user = getCurrentUser();
    setUser(user);
  }, [pathname]); // Re-check on path change if needed, though login state is main driver

  const userPermissions = user?.permissions || [];

  const hasPermission = (permission: Permission) => userPermissions.includes(permission);

  const isHrmActive = pathname.startsWith('/hrm');

  const accessibleLinks = allLinks.map(link => {
    // Make a copy to avoid mutating the original array
    const newLink = { ...link };

    // Special visibility rules based on role using hasRole helper
    if (newLink.href === '/charting' && hasRole(['Account', 'Receptionist'])) {
        return null; // Hide charting for accountants and receptionists
    }
    if ((newLink.href === '/billing' || newLink.href === '/accounting') && !hasRole(['Super Admin', 'Account'])) {
        return null;
    }
    if ((newLink.href === '/inventory' || newLink.label === 'HRM' || newLink.href === '/reports') && !hasRole(['Super Admin', 'HR'])) {
        return null;
    }
    if ((newLink.href === '/settings' || newLink.href === '/activity-logs') && !hasRole('Super Admin')) {
        return null;
    }
    if (newLink.href === '/admin/migration' && !hasRole('Super Admin')) {
        return null;
    }


    // Filter sublinks based on permissions
    if (newLink.subLinks) {
        newLink.subLinks = newLink.subLinks.filter(sublink => !sublink.permission || hasPermission(sublink.permission));
    }

    // Check parent link permission, but only if it has one (some are now public)
    if (newLink.permission && !hasPermission(newLink.permission)) {
        return null;
    }
    
    // If it's a group, check if it has any visible sublinks left
    if (newLink.subLinks && newLink.subLinks.length === 0) {
        return null;
    }

    return newLink;
  }).filter(Boolean) as NavLink[];


  return (
    <div className="flex w-full flex-col gap-2 p-2">
      <SidebarMenu>
        {accessibleLinks.map((link) => (
          <SidebarMenuItem key={link.href || link.label}>
             {link.subLinks ? (
                 <Collapsible defaultOpen={isHrmActive}>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton
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
                                    <SidebarMenuSubButton asChild isActive={pathname.startsWith(subLink.href!)}>
                                        <Link href={subLink.href!}>
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
                        link.href === "/dashboard" ? pathname === "/dashboard" || pathname === "/"
                        : link.href === "/patients" ? pathname.startsWith("/patients")
                        : link.href === "/appointments" ? pathname.startsWith("/appointments")
                        : link.href === "/billing" ? pathname.startsWith("/billing")
                        : link.href === "/charting" ? pathname.startsWith("/charting")
                        : link.href === "/queue" ? pathname.startsWith("/queue")
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
