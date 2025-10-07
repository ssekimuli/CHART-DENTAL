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
} from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/appointments", label: "Appointments", icon: Calendar },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <div className="flex w-full flex-col gap-2 p-2">
      <SidebarMenu>
        {links.map((link) => (
          <SidebarMenuItem key={link.href}>
            <Link href={link.href} legacyBehavior passHref>
              <SidebarMenuButton
                asChild
                isActive={
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href)
                }
                tooltip={link.label}
              >
                <a>
                  <link.icon />
                  <span>{link.label}</span>
                </a>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </div>
  );
}
