"use client";
import { useToast } from "@/hooks/use-toast";

import { useState, useEffect } from "react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import type { Client, LabService } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Combobox } from "@/components/ui/combobox";
import { useBranch } from "@/context/branch-context";
import { getLabServices, getActivePriceForService } from "@/lib/api-lab-prices";
import { Label } from "@/components/ui/label";

// ─── Types ───────────────────────────────────────────────────────────────────

type OrderItem = {
  id: string; // local only, for React key
  lab_service_id: number | null;
  item: string;
  tooth: string;
  applied_price: string;
  material: string;
  shade: string;
};

type LabOrderFormProps = {
    clients: Client[];
    onSave: (data: any) => void;
    onOpenChange: (open: boolean) => void;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const emptyItem = (): OrderItem => ({
  id: crypto.randomUUID(),
  lab_service_id: null,
  item: "",
  tooth: "",
  applied_price: "",
  material: "",
  shade: "",
});

// ─── Component ───────────────────────────────────────────────────────────────

export function LabOrderForm({ clients, onSave, onOpenChange }: LabOrderFormProps) {
  const { toast } = useToast();
  const { selectedBranch, availableBranches } = useBranch();

  const branchCurrency = availableBranches.find(b => String(b.id) === String(selectedBranch))?.currency || 'USD';

  // ── Shared order fields ──
  const [clientId, setClientId] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [status, setStatus] = useState<string>("Draft");
  const [sentDate, setSentDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [receivedDate, setReceivedDate] = useState<Date | undefined>(undefined);
  const [instructions, setInstructions] = useState("");

  // ── Items list ──
  const [items, setItems] = useState<OrderItem[]>([emptyItem()]);

  // ── Lab services ──
  const [labServices, setLabServices] = useState<LabService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  // ── Submission ──
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch lab services
  useEffect(() => {
    const fetchServices = async () => {
      setServicesLoading(true);
      try {
        const data = await getLabServices(selectedBranch);
        setLabServices(Array.isArray(data) ? data : (data as any)?.data || []);
      } catch (error) {
        console.error("Error fetching lab services:", error);
      } finally {
        setServicesLoading(false);
      }
    };
    fetchServices();
  }, [selectedBranch]);

  // Auto-fill doctor name when client changes
  useEffect(() => {
    if (clientId) {
      const selectedClient = clients.find(c => String(c.id) === clientId);
      if (selectedClient && !doctorName) {
        setDoctorName(selectedClient.name);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  // ── Item mutators ──

  const updateItem = (id: string, patch: Partial<OrderItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item));
  };

  const addItem = () => setItems(prev => [...prev, emptyItem()]);

  const removeItem = (id: string) => {
    if (items.length === 1) return; // keep at least one row
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleServiceSelect = async (itemId: string, serviceId: number) => {
    updateItem(itemId, { lab_service_id: serviceId });
    try {
      const price = await getActivePriceForService(serviceId, selectedBranch);
      if (price) {
        updateItem(itemId, { applied_price: String(price.base_price) });
      }
    } catch (error) {
      console.error("Error fetching price:", error);
    }
  };

  // ── Validation ──

  const validate = (): string | null => {
    if (!clientId) return "Please select a client.";
    if (!sentDate) return "Sent date is required.";
    if (!dueDate) return "Due date is required.";
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.item.trim()) return `Item ${i + 1}: description is required.`;
      if (it.lab_service_id === null && !it.applied_price) {
        return `Item ${i + 1}: select a lab service or enter a price.`;
      }
    }
    return null;
  };

  // ── Submit ──

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      toast({ title: "Validation Error", description: error, variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const sharedData = {
        clientId,
        doctorName: doctorName || undefined,
        status,
        sentDate: format(sentDate, "yyyy-MM-dd"),
        dueDate: format(dueDate!, "yyyy-MM-dd"),
        receivedDate: receivedDate ? format(receivedDate, "yyyy-MM-dd") : undefined,
        instructions: instructions || undefined,
        branchId: selectedBranch,
      };

      const orderItems = items.map(it => ({
        item: it.item.trim(),
        tooth: it.tooth ? parseInt(it.tooth) : undefined,
        lab_service_id: it.lab_service_id ?? undefined,
        applied_price: it.applied_price ? parseFloat(it.applied_price) : undefined,
        material: it.material || undefined,
        shade: it.shade || undefined,
      }));

      await onSave({ ...sharedData, items: orderItems });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Create Lab Order</DialogTitle>
                <DialogDescription>
                    Fill out the order details, then add one or more items below.
                </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* ── Shared order fields ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* Client */}
                    <div className="flex flex-col gap-1.5">
                        <Label>Client *</Label>
                        <Combobox
                            options={clients.map(c => ({ value: String(c.id), label: c.name }))}
                            value={clientId}
                            onChange={setClientId}
                            placeholder="Select a client"
                            searchPlaceholder="Search clients..."
                            emptyMessage="No client found."
                        />
                    </div>

                    {/* Doctor */}
                    <div className="flex flex-col gap-1.5">
                        <Label>Prescribing Doctor (Optional)</Label>
                        <Input
                            placeholder="Enter doctor name"
                            value={doctorName}
                            onChange={e => setDoctorName(e.target.value)}
                        />
                    </div>

                    {/* Status */}
                    <div className="flex flex-col gap-1.5">
                        <Label>Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Draft">Draft</SelectItem>
                                <SelectItem value="Received">Received</SelectItem>
                                <SelectItem value="In Production">In Production</SelectItem>
                                <SelectItem value="Ready for Delivery">Ready for Delivery</SelectItem>
                                <SelectItem value="Delivered">Delivered</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Sent Date */}
                    <div className="flex flex-col gap-1.5">
                        <Label>Sent Date *</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("pl-3 text-left font-normal w-full", !sentDate && "text-muted-foreground")}>
                                    {sentDate ? format(sentDate, "PPP") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={sentDate} onSelect={(d) => d && setSentDate(d)} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Due Date */}
                    <div className="flex flex-col gap-1.5">
                        <Label>Due Date *</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("pl-3 text-left font-normal w-full", !dueDate && "text-muted-foreground")}>
                                    {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Received Date */}
                    <div className="flex flex-col gap-1.5">
                        <Label>Received Date (Optional)</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("pl-3 text-left font-normal w-full", !receivedDate && "text-muted-foreground")}>
                                    {receivedDate ? format(receivedDate, "PPP") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={receivedDate} onSelect={setReceivedDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Instructions */}
                    <div className="flex flex-col gap-1.5 md:col-span-3">
                        <Label>Instructions (Optional)</Label>
                        <Input
                            placeholder="Special instructions for the lab"
                            value={instructions}
                            onChange={e => setInstructions(e.target.value)}
                        />
                    </div>
                </div>

                {/* ── Items section ── */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">
                            Items ({items.length})
                        </Label>
                        <Button type="button" variant="outline" size="sm" onClick={addItem}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Item
                        </Button>
                    </div>

                    {/* Items list */}
                    <div className="space-y-3">
                        {items.map((item, index) => (
                            <div
                                key={item.id}
                                className="relative border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-900/40"
                            >
                                {/* Row header */}
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                                        Item #{index + 1}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeItem(item.id)}
                                        disabled={items.length === 1}
                                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30"
                                        title="Remove item"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Item fields grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                                    {/* Lab Service */}
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-xs">Lab Service *</Label>
                                        <Select
                                            value={item.lab_service_id?.toString() || ""}
                                            onValueChange={(val) => handleServiceSelect(item.id, parseInt(val))}
                                            disabled={servicesLoading}
                                        >
                                            <SelectTrigger className="h-9 text-sm">
                                                <SelectValue placeholder="Select service…" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {labServices.map(service => (
                                                    <SelectItem key={service.id} value={service.id.toString()}>
                                                        {service.service_name}{service.category && ` (${service.category})`}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Item description */}
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-xs">Item Description *</Label>
                                        <Input
                                            className="h-9 text-sm"
                                            placeholder="e.g., Zirconia Crown"
                                            value={item.item}
                                            onChange={e => updateItem(item.id, { item: e.target.value })}
                                        />
                                    </div>

                                    {/* Tooth */}
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-xs">Tooth # (Optional)</Label>
                                        <Input
                                            className="h-9 text-sm"
                                            type="number"
                                            placeholder="e.g., 14"
                                            value={item.tooth}
                                            onChange={e => updateItem(item.id, { tooth: e.target.value })}
                                        />
                                    </div>

                                    {/* Price */}
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-xs">Price ({branchCurrency})</Label>
                                        <Input
                                            className="h-9 text-sm"
                                            type="number"
                                            step="0.01"
                                            placeholder="Auto-filled or enter manually"
                                            value={item.applied_price}
                                            onChange={e => updateItem(item.id, { applied_price: e.target.value })}
                                        />
                                    </div>

                                    {/* Material */}
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-xs">Material (Optional)</Label>
                                        <Input
                                            className="h-9 text-sm"
                                            placeholder="e.g., Zirconia, PFM"
                                            value={item.material}
                                            onChange={e => updateItem(item.id, { material: e.target.value })}
                                        />
                                    </div>

                                    {/* Shade */}
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-xs">Shade (Optional)</Label>
                                        <Input
                                            className="h-9 text-sm"
                                            placeholder="e.g., A1, B2"
                                            value={item.shade}
                                            onChange={e => updateItem(item.id, { shade: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Order{items.length > 1 ? `s (${items.length})` : ""}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
  );
}
