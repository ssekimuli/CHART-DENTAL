"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { Edit2, Plus, Trash2, Search } from "lucide-react";
import { getTreatments, createSystemTreatment, updateSystemTreatment, deleteSystemTreatment } from "@/lib/api";
import type { SystemTreatment } from "@/lib/types";

export function TreatmentsCatalog({ currencyCode }: { currencyCode: string }) {
    const { toast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();
    const [treatments, setTreatments] = useState<SystemTreatment[]>([]);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [isLoading, setIsLoading] = useState(true);

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [currentTreatment, setCurrentTreatment] = useState<Partial<SystemTreatment>>({});

    const fetchTreatments = async () => {
        setIsLoading(true);
        try {
            const params: any = {};
            if (search) params.search = search;
            if (categoryFilter !== "All") params.category = categoryFilter;
            const data = await getTreatments(params);
            setTreatments(data);
        } catch (error) {
            console.error(error);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchTreatments();
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [search, categoryFilter]);

    const handleAdd = async () => {
        try {
            await createSystemTreatment({
                treatment_code: currentTreatment.treatment_code || "",
                procedure: currentTreatment.procedure || "",
                cost: currentTreatment.cost || 0,
                category: currentTreatment.category || "Other"
            });
            toast({ title: "Success", description: "Treatment added successfully." });
            setIsAddOpen(false);
            setCurrentTreatment({});
            fetchTreatments();
        } catch (e) {
            toast({ title: "Error", description: "Failed to add treatment.", variant: "destructive" });
        }
    };

    const handleEdit = async () => {
        if (!currentTreatment.id) return;
        try {
            await updateSystemTreatment(currentTreatment.id, currentTreatment);
            toast({ title: "Success", description: "Treatment updated successfully." });
            setIsEditOpen(false);
            setCurrentTreatment({});
            fetchTreatments();
        } catch (e) {
            toast({ title: "Error", description: "Failed to update treatment.", variant: "destructive" });
        }
    };

    const executeDelete = async (id: string | number) => {
        try {
            await deleteSystemTreatment(id);
            toast({ title: "Deleted", description: "Treatment removed." });
            fetchTreatments();
        } catch (e) {
            toast({ title: "Error", description: "Failed to delete treatment.", variant: "destructive" });
        }
    };

    const handleDelete = (id: string | number) => {
        confirm({
            description: "Are you sure you want to delete this treatment?",
            onConfirm: () => executeDelete(id)
        });
    };

    const categories = ["Preventive", "Restorative", "Cosmetic", "Surgical", "Other"];

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search procedures..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Categories</SelectItem>
                            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setCurrentTreatment({ cost: 0, category: 'Preventive' })}><Plus className="w-4 h-4 mr-2" /> Add Treatment</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Treatment</DialogTitle>
                            <DialogDescription>Create a new procedure code and pricing.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Treatment Code</Label>
                                <Input value={currentTreatment.treatment_code || ''} onChange={e => setCurrentTreatment({...currentTreatment, treatment_code: e.target.value})} placeholder="e.g. D0120" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Procedure Name</Label>
                                <Input value={currentTreatment.procedure || ''} onChange={e => setCurrentTreatment({...currentTreatment, procedure: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Cost ({currencyCode})</Label>
                                    <Input type="number" min="0" step="0.01" value={currentTreatment.cost || 0} onChange={e => setCurrentTreatment({...currentTreatment, cost: parseFloat(e.target.value)})} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Category</Label>
                                    <Select value={currentTreatment.category || 'Other'} onValueChange={val => setCurrentTreatment({...currentTreatment, category: val})}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                            <Button onClick={handleAdd}>Save Treatment</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Procedure</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Cost</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
                        ) : treatments.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-8">No treatments found.</TableCell></TableRow>
                        ) : (
                            treatments.map((t) => (
                                <TableRow key={t.id}>
                                    <TableCell>{t.treatment_code || '-'}</TableCell>
                                    <TableCell className="font-medium">{t.procedure}</TableCell>
                                    <TableCell>{t.category}</TableCell>
                                    <TableCell className="text-right">{new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(t.cost)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => { setCurrentTreatment(t); setIsEditOpen(true); }}>
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(t.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Treatment</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Treatment Code</Label>
                            <Input value={currentTreatment.treatment_code || ''} onChange={e => setCurrentTreatment({...currentTreatment, treatment_code: e.target.value})} placeholder="e.g. D0120" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Procedure Name</Label>
                            <Input value={currentTreatment.procedure || ''} onChange={e => setCurrentTreatment({...currentTreatment, procedure: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Cost ({currencyCode})</Label>
                                <Input type="number" min="0" step="0.01" value={currentTreatment.cost || 0} onChange={e => setCurrentTreatment({...currentTreatment, cost: parseFloat(e.target.value)})} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Category</Label>
                                <Select value={currentTreatment.category || 'Other'} onValueChange={val => setCurrentTreatment({...currentTreatment, category: val})}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleEdit}>Update</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <ConfirmDialog />
        </div>
    );
}
