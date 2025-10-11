import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { UserNav } from "@/components/dashboard/user-nav";
import { MainNav } from "@/components/dashboard/main-nav";
import { ToothIcon } from "@/components/icons/tooth-icon";
import { BranchProvider } from "@/context/branch-context";
import { BranchSwitcher } from "@/components/dashboard/branch-switcher";
import { PatientSearch } from "@/components/dashboard/patient-search";

export const metadata: Metadata = {
  title: "Dentio",
  description: "Advanced Dental Charting and Practice Management",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
        <BranchProvider>
          <SidebarProvider>
            <Sidebar collapsible="icon" className="border-r border-border/20 bg-sidebar text-sidebar-foreground">
              <SidebarContent>
                <SidebarHeader>
                  <Link href="/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                    <ToothIcon className="size-8 text-primary" />
                    <h1 className="text-xl font-bold text-primary-foreground group-data-[collapsible=icon]:hidden">
                      Dentio
                    </h1>
                  </Link>
                </SidebarHeader>
                <MainNav />
              </SidebarContent>
              <SidebarFooter className="group-data-[collapsible=icon]:hidden">
                {/* Footer content if needed */}
              </SidebarFooter>
            </Sidebar>
            <SidebarInset>
              <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
                <div className="flex items-center gap-2">
                  <SidebarTrigger className="md:hidden" />
                  <BranchSwitcher />
                </div>

                <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
                  <div className="ml-auto flex-1 sm:flex-initial">
                    <PatientSearch />
                  </div>
                  <UserNav />
                </div>
              </header>
              <main className="flex-1 p-4 md:p-6">{children}</main>
            </SidebarInset>
          </SidebarProvider>
        </BranchProvider>
  );
}
