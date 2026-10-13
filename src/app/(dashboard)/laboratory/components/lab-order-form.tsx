"use client";
import { useToast } from "@/hooks/use-toast";

import { useState, useEffect, useMemo, useRef } from "react";

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
import { Loader2, PlusCircle, Trash2, Check } from "lucide-react";
import { useBranch } from "@/context/branch-context";
import { getLabServices, getActivePriceForService } from "@/lib/api-lab-prices";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type OrderItem = {
  id: string; // local only, for React key
  lab_service_id: number | null;
  service_name: string;
  item: string;
  tooth: string;
  applied_price: string;
  material: string;
  shade: string;
};

type LabOrderFormProps = {
    clients: Client[];
    doctors?: any[];
    onSave: (data: any) => void;
    onOpenChange: (open: boolean) => void;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const emptyItem = (): OrderItem => ({
  id: crypto.randomUUID(),
  lab_service_id: null,
  service_name: "",
  item: "",
  tooth: "",
  applied_price: "",
  material: "",
  shade: "",
});

// ─── Component ───────────────────────────────────────────────────────────────

export function LabOrderForm({ clients, doctors, onSave, onOpenChange }: LabOrderFormProps) {
  const { toast } = useToast();
  const { selectedBranch, availableBranches } = useBranch();

  const branchCurrency = availableBranches.find(b => String(b.id) === String(selectedBranch))?.currency || 'USD';

  // ── Shared order fields ──
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  const [doctorName, setDoctorName] = useState("");
  const [status, setStatus] = useState<string>("Draft");
  const [instructions, setInstructions] = useState("");

  // ── Items list ──
  const [items, setItems] = useState<OrderItem[]>([emptyItem()]);
  const [activeServiceDropdownId, setActiveServiceDropdownId] = useState<string | null>(null);

  // ── Lab services ──
  const [labServices, setLabServices] = useState<LabService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  // ── Submission ──
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch lab services
  useEffect(() => {
    const fetchServices = async () => {
      if (!selectedBranch) return;
      setServicesLoading(true);
      try {
        const data = await getLabServices(Number(selectedBranch));
        setLabServices(Array.isArray(data) ? data : (data as any)?.data || []);
      } catch (error) {
        console.error("Error fetching lab services:", error);
      } finally {
        setServicesLoading(false);
      }
    };
    fetchServices();
  }, [selectedBranch]);

  // Click outside to close client or service suggestions dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(target)) {
        setIsClientDropdownOpen(false);
      }
      if (!target.closest?.('[data-service-dropdown]')) {
        setActiveServiceDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter clients based on typed clientName
  const filteredClients = useMemo(() => {
    if (!clientName.trim()) return clients;
    const q = clientName.toLowerCase().trim();
    return clients.filter(c => c.name.toLowerCase().includes(q));
  }, [clients, clientName]);

  // ── Item mutators ──

  const updateItem = (id: string, patch: Partial<OrderItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item));
  };

  const addItem = () => setItems(prev => [...prev, emptyItem()]);

  const removeItem = (id: string) => {
    if (items.length === 1) return; // keep at least one row
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleServiceSelect = async (itemId: string, serviceId: number, serviceName?: string) => {
    const sName = serviceName || labServices.find(s => s.id === serviceId)?.service_name || "";
    const cur = items.find(i => i.id === itemId);
    updateItem(itemId, { 
      lab_service_id: serviceId,
      service_name: sName,
      item: cur?.item?.trim() ? cur.item : sName,
    });
    setActiveServiceDropdownId(null);
    try {
      const price = await getActivePriceForService(serviceId, selectedBranch ? Number(selectedBranch) : undefined);
      if (price) {
        updateItem(itemId, { applied_price: String(price.base_price) });
      }
    } catch (error) {
      console.error("Error fetching price:", error);
    }
  };

  // ── Validation ──

  const validate = (): string | null => {
    if (!selectedBranch) return "Please select a branch first.";
    if (!clientName.trim() && !clientId) return "Please enter or select a client name.";
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const desc = it.item.trim() || it.service_name.trim();
      if (!desc) return `Item ${i + 1}: lab service or description is required.`;
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
      const matchedClient = clientId 
        ? clients.find(c => String(c.id) === clientId) 
        : clients.find(c => c.name.toLowerCase().trim() === clientName.toLowerCase().trim());
      const finalClientId = matchedClient ? String(matchedClient.id) : undefined;
      const finalClientName = clientName.trim();

      const sharedData = {
        clientId: finalClientId,
        clientName: finalClientName,
        doctorName: doctorName || undefined,
        status,
        instructions: instructions || undefined,
        branchId: selectedBranch,
      };

      const orderItems = items.map(it => {
        const serviceName = it.service_name.trim();
        const itemName = it.item.trim() || serviceName;
        return {
          item: itemName,
          service_name: serviceName || undefined,
          serviceName: serviceName || undefined,
          tooth: it.tooth ? parseInt(it.tooth) : undefined,
          lab_service_id: it.lab_service_id ?? undefined,
          labServiceId: it.lab_service_id ?? undefined,
          applied_price: it.applied_price ? parseFloat(it.applied_price) : undefined,
          appliedPrice: it.applied_price ? parseFloat(it.applied_price) : undefined,
          branch_id: selectedBranch,
          branchId: selectedBranch,
          material: it.material || undefined,
          shade: it.shade || undefined,
        };
      });

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

                    {/* Client: single input with suggestions, no add button */}
                    <div className="flex flex-col gap-1.5" ref={clientDropdownRef}>
                        <Label>Client *</Label>
                        <div className="relative">
                            <Input
                                placeholder="Enter or select client name..."
                                value={clientName}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setClientName(val);
                                    setIsClientDropdownOpen(true);
                                    const match = clients.find(c => c.name.toLowerCase().trim() === val.toLowerCase().trim());
                                    if (match) {
                                        setClientId(String(match.id));
                                    } else {
                                        setClientId("");
                                    }
                                }}
                                onFocus={() => setIsClientDropdownOpen(true)}
                            />

                            {/* Dropdown suggestions of existing clients */}
                            {isClientDropdownOpen && filteredClients.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover text-popover-foreground rounded-md border shadow-md max-h-56 overflow-y-auto p-1">
                                    {filteredClients.map(c => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => {
                                                setClientId(String(c.id));
                                                setClientName(c.name);
                                                setIsClientDropdownOpen(false);
                                                if (!doctorName) {
                                                    setDoctorName(c.name);
                                                }
                                            }}
                                            className={cn(
                                                "w-full text-left px-2.5 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground flex items-center justify-between",
                                                String(clientId) === String(c.id) && "bg-accent/50 font-medium"
                                            )}
                                        >
                                            <span>{c.name}</span>
                                            {String(clientId) === String(c.id) && (
                                                <Check className="h-4 w-4 text-primary ml-2 shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
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

                                    {/* Lab Service: single input with suggestions, exactly like Client */}
                                    <div className="flex flex-col gap-1.5" data-service-dropdown={item.id}>
                                        <Label className="text-xs">Lab Service *</Label>
                                        <div className="relative">
                                            <Input
                                                className="h-9 text-sm"
                                                placeholder="Enter or select lab service..."
                                                value={item.service_name}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const match = labServices.find(s => s.service_name.toLowerCase().trim() === val.toLowerCase().trim());
                                                    updateItem(item.id, {
                                                        service_name: val,
                                                        lab_service_id: match ? match.id : null,
                                                        item: item.item ? item.item : val,
                                                    });
                                                    if (match) {
                                                        handleServiceSelect(item.id, match.id, val);
                                                    }
                                                    setActiveServiceDropdownId(item.id);
                                                }}
                                                onFocus={() => setActiveServiceDropdownId(item.id)}
                                            />

                                            {/* Dropdown suggestions of existing lab services */}
                                            {activeServiceDropdownId === item.id && (() => {
                                                const query = (item.service_name || "").toLowerCase().trim();
                                                const filtered = query
                                                    ? labServices.filter(s => 
                                                        s.service_name.toLowerCase().includes(query) || 
                                                        (s.category && s.category.toLowerCase().includes(query))
                                                      )
                                                    : labServices;
                                                
                                                if (filtered.length === 0) return null;

                                                return (
                                                    <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover text-popover-foreground rounded-md border shadow-md max-h-56 overflow-y-auto p-1">
                                                        {filtered.map(service => {
                                                            const isSelected = item.lab_service_id === service.id;
                                                            return (
                                                                <button
                                                                    key={service.id}
                                                                    type="button"
                                                                    onClick={() => handleServiceSelect(item.id, service.id, service.service_name)}
                                                                    className={cn(
                                                                        "w-full text-left px-2.5 py-1.5 text-xs rounded-sm hover:bg-accent hover:text-accent-foreground flex items-center justify-between",
                                                                        isSelected && "bg-accent/50 font-medium"
                                                                    )}
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium">{service.service_name}</span>
                                                                        {service.category && (
                                                                            <span className="text-[10px] text-muted-foreground">{service.category}</span>
                                                                        )}
                                                                    </div>
                                                                    {isSelected && (
                                                                        <Check className="h-3.5 w-3.5 text-primary ml-2 shrink-0" />
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })()}
                                        </div>
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
