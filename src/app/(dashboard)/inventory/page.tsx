
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { InventoryTable } from "./components/inventory-table";
import type { InventoryItem } from "@/lib/types";
import { ItemForm } from "./components/item-form";
import { useBranch } from "@/context/branch-context";
import { createInventoryItem, getInventory } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { hasPermission } from "@/lib/user";
import { useRouter } from "next/navigation";

export default function InventoryPage() {
    const router = useRouter();
    const { selectedBranch } = useBranch();
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    useEffect(() => {
        if (!hasPermission("inventory:read")) {
            router.replace("/dashboard");
            return;
        }
        const fetchData = async () => {
            setIsLoading(true);
            const data = await getInventory(selectedBranch);
            setInventory(data);
            setIsLoading(false);
        };
        fetchData();
    }, [selectedBranch, router]);

    const handleSaveItem = async (data: Omit<InventoryItem, 'id' | 'branchId' | 'status'>) => {
        const newItem = await createInventoryItem({ ...data, branchId: selectedBranch });
        if (newItem) {
            setInventory(prev => [newItem, ...prev]);
        }
        setIsFormOpen(false);
    }

  return (
    <>
        <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
            <CardTitle>Inventory</CardTitle>
            <CardDescription>
                Manage your dental supplies and stock levels.
            </CardDescription>
            </div>
            {hasPermission('inventory:create') && (
                <Button onClick={() => setIsFormOpen(true)}>
                <PlusCircle className="mr-2" />
                Add Item
                </Button>
            )}
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : (
                <InventoryTable data={inventory} />
            )}
        </CardContent>
        </Card>
        {isFormOpen && (
            <ItemForm 
                onSave={handleSaveItem}
                onOpenChange={setIsFormOpen}
            />
        )}
    </>
  );
}
