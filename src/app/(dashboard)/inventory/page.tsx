
"use client";

import { useState, useMemo, useEffect } from "react";
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
import { currentUser } from "@/lib/user";
import { createInventoryItem, getInventory } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function InventoryPage() {
    const { selectedBranch } = useBranch();
    const [allInventory, setAllInventory] = useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const data = await getInventory();
            setAllInventory(data);
            setIsLoading(false);
        };
        fetchData();
    }, []);

    const inventory = useMemo(() => {
        if (currentUser.role === 'Super Admin') {
          return allInventory.filter(i => i.branchId === selectedBranch);
        }
        return allInventory.filter(i => i.branchId === currentUser.branchId);
      }, [selectedBranch, allInventory]);

    const handleSaveItem = async (data: Omit<InventoryItem, 'id' | 'branchId' | 'status'>) => {
        const newItem = await createInventoryItem({ ...data, branchId: selectedBranch });
        if (newItem) {
            setAllInventory(prev => [...prev, newItem]);
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
            <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2" />
            Add Item
            </Button>
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
