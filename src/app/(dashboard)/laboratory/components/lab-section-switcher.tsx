"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LabSectionSwitcherProps {
  activeSection: "orders" | "services" | "prices";
  onSectionChange: (section: "orders" | "services" | "prices") => void;
}

export function LabSectionSwitcher({
  activeSection,
  onSectionChange,
}: LabSectionSwitcherProps) {
  return (
    <Tabs value={activeSection} onValueChange={(value) => onSectionChange(value as "orders" | "services" | "prices")}>
      <TabsList>
        <TabsTrigger value="orders">Lab Orders</TabsTrigger>
        <TabsTrigger value="services">Lab Services</TabsTrigger>
        <TabsTrigger value="prices">Lab Prices</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
