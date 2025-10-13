
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
import type { EmployeeRole, Permission } from "@/lib/types";
import { currentUser } from "@/lib/user";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import React, { useEffect, useState } from "react";

type NavLink = {
    href?: string;
    label: string;
    icon: React.ElementType;
    permission: Permission;
    subLinks?: Omit<NavLink, 'subLinks'>[];
}

const allLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: 'dashboard:read' },
  { href: "/queue", label: "Queue", icon: ClipboardList, permission: 'queue:read' },
  { href: "/patients", label: "Patients", icon: Users, permission: 'patients:read' },
  { href: "/charting", label: "Charting", icon: FileText, permission: 'charting:read' },
  { href: "/appointments", label: "Appointments", icon: Calendar, permission: 'appointments:read' },
  { href: "/billing", label: "Billing", icon: CreditCard, permission: 'billing:read' },
  { href: "/accounting", label: "Accounting", icon: Landmark, permission: 'accounting:read' },
  { href: "/inventory", label: "Inventory", icon: Package, permission: 'inventory:read' },
  { href: "/laboratory", label: "Laboratory", icon: FlaskConical, permission: 'laboratory:read' },
  { 
    label: "HRM", 
    icon: Briefcase, 
    permission: 'hrm:read',
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
  { href: "/reports", label: "Reports", icon: BarChart3, permission: 'reports:read' },
  { href: "/settings", label: "Settings", icon: Settings, permission: 'settings:manage' },
];

export function MainNav() {
  const pathname = usePathname();
  const [userPermissions, setUserPermissions] = useState<Permission[]>(currentUser.permissions);
  
  useEffect(() => {
    // This effect can be used to update permissions if they change during the session
    setUserPermissions(currentUser.permissions);
  }, []);

  const hasPermission = (permission: Permission) => userPermissions.includes(permission);

  const isHrmActive = pathname.startsWith('/hrm');

  const accessibleLinks = allLinks.filter(link => {
    if (hasPermission(link.permission)) {
        if (link.subLinks) {
            link.subLinks = link.subLinks.filter(sublink => hasPermission(sublink.permission));
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
