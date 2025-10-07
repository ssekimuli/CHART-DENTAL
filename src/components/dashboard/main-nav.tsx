"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
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
} from "lucide-react";
import type { EmployeeRole } from "@/lib/types";

const allLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ['Super Admin', 'Account', 'HR', 'Dentist', 'Hygienist', 'Receptionist', 'Assistant'] as EmployeeRole[] },
  { href: "/patients", label: "Patients", icon: Users, roles: ['Super Admin', 'Dentist', 'Hygienist', 'Receptionist', 'Assistant'] as EmployeeRole[] },
  { href: "/appointments", label: "Appointments", icon: Calendar, roles: ['Super Admin', 'Dentist', 'Hygienist', 'Receptionist', 'Assistant'] as EmployeeRole[] },
  { href: "/billing", label: "Billing", icon: CreditCard, roles: ['Super Admin', 'Account', 'Receptionist'] as EmployeeRole[] },
  { href: "/employees", label: "Employees", icon: Briefcase, roles: ['Super Admin', 'HR'] as EmployeeRole[] },
  { href: "/payroll", label: "Payroll", icon: HandCoins, roles: ['Super Admin', 'HR', 'Account'] as EmployeeRole[] },
  { href: "/branches", label: "Branches", icon: Building, roles: ['Super Admin'] as EmployeeRole[] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ['Super Admin', 'Account', 'HR', 'Dentist', 'Hygienist', 'Receptionist', 'Assistant'] as EmployeeRole[] },
];

// Mock current user - in a real app, this would come from an auth context
const currentUser: { role: EmployeeRole } = {
  role: 'Super Admin',
};


export function MainNav() {
  const pathname = usePathname();

  const accessibleLinks = allLinks.filter(link => link.roles.includes(currentUser.role)).sort((a, b) => {
    if (a.href === '/settings') return 1;
    if (b.href === '/settings') return -1;
    return 0;
  });

  return (
    <div className="flex w-full flex-col gap-2 p-2">
      <SidebarMenu>
        {accessibleLinks.map((link) => (
          <SidebarMenuItem key={link.href}>
            <SidebarMenuButton
              asChild
              isActive={
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href)
              }
              tooltip={link.label}
            >
              <Link href={link.href}>
                <link.icon />
                <span>{link.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </div>
  );
}
