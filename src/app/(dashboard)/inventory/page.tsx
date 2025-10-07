
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { inventory as initialInventory } from "@/lib/data";
import { InventoryTable } from "./components/inventory-table";
import type { InventoryItem } from "@/lib/types";
import { ItemForm } from "./components/item-form";
import { useBranch } from "@/context/branch-context";
import { currentUser } from "@/lib/user";

export default function InventoryPage() {
    const { selectedBranch } = useBranch();
    const [allInventory, setAllInventory] = useState<InventoryItem[]>(initialInventory);
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    const inventory = useMemo(() => {
        if (currentUser.role === 'Super Admin') {
          return allInventory.filter(i => i.branchId === selectedBranch);
        }
        return allInventory.filter(i => i.branchId === currentUser.branchId);
      }, [selectedBranch, allInventory]);

    const handleSaveItem = (data: Omit<InventoryItem, 'id' | 'branchId' | 'status'>) => {
        const newItem: InventoryItem = {
            ...data,
            id: `item${allInventory.length + 1}`,
            branchId: selectedBranch,
            status: data.stock > data.reorderLevel ? 'In Stock' : data.stock > 0 ? 'Low Stock' : 'Out of Stock'
        };
        setAllInventory(prev => [...prev, newItem]);
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
            <InventoryTable data={inventory} />
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
