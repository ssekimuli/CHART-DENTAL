import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
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
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { UserNav } from "@/components/dashboard/user-nav";
import { MainNav } from "@/components/dashboard/main-nav";
import { ToothIcon } from "@/components/icons/tooth-icon";

export const metadata: Metadata = {
  title: "DentalChart Pro",
  description: "Advanced Dental Charting and Practice Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn("font-body antialiased", "min-h-screen bg-background font-sans")}>
        <SidebarProvider>
          <Sidebar collapsible="icon" className="border-r border-border/20 bg-sidebar text-sidebar-foreground">
            <SidebarContent>
              <SidebarHeader>
                <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                  <ToothIcon className="size-8 text-primary" />
                  <h1 className="text-xl font-bold text-primary-foreground group-data-[collapsible=icon]:hidden">
                    DentalChart Pro
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
                <h1 className="text-lg font-semibold md:text-xl">Dashboard</h1>
              </div>

              <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
                <form className="ml-auto flex-1 sm:flex-initial">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search patients..."
                      className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
                    />
                  </div>
                </form>
                <UserNav />
              </div>
            </header>
            <main className="flex-1 p-4 md:p-6">{children}</main>
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
