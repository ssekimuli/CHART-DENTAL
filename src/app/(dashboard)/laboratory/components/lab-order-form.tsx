"use client";
import { useToast } from "@/hooks/use-toast";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import type { LaboratoryOrder, Client, Employee, LabService } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Combobox } from "@/components/ui/combobox";
import { useBranch } from "@/context/branch-context";
import { getLabServices, getActivePriceForService } from "@/lib/api-lab-prices";


const formSchema = z.object({
  clientId: z.string({ required_error: "Please select a client."}),
  item: z.string().min(2, "Item description must be at least 2 characters."),
  tooth: z.coerce.number().optional(),
  status: z.enum(['Draft', 'Received', 'In Production', 'Ready for Delivery', 'Delivered', 'Cancelled']),
  sentDate: z.date({ required_error: "A sent date is required." }),
  dueDate: z.date({ required_error: "A due date is required." }),
  receivedDate: z.date().optional(),
  shade: z.string().optional(),
  material: z.string().optional(),
  instructions: z.string().optional(),
  doctorName: z.string().optional(),
  lab_service_id: z.number().optional().nullable(),
  applied_price: z.coerce.number().optional().nullable(),
});

type LabOrderFormProps = {
    clients: Client[];
    onSave: (data: Omit<LaboratoryOrder, 'id' | 'branchId'>) => void;
    onOpenChange: (open: boolean) => void;
};

export function LabOrderForm({ clients, onSave, onOpenChange }: LabOrderFormProps) {
  const { toast } = useToast();
  const { selectedBranch } = useBranch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [labServices, setLabServices] = useState<LabService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      setServicesLoading(true);
      try {
        const data = await getLabServices(selectedBranch);
        if (Array.isArray(data)) {
          setLabServices(data);
        } else {
          setLabServices(data || []);
        }
      } catch (error) {
        console.error("Error fetching lab services:", error);
      } finally {
        setServicesLoading(false);
      }
    };
    fetchServices();
  }, [selectedBranch]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        sentDate: new Date(),
        status: 'Draft',
        lab_service_id: null,
        applied_price: null,
    },
  });

  const handleLabServiceSelect = async (serviceId: number) => {
    form.setValue('lab_service_id', serviceId);
    setPriceLoading(true);
    try {
      const price = await getActivePriceForService(serviceId, selectedBranch);
      if (price) {
        const parsedPrice = parseFloat(String(price.base_price));
        form.setValue('applied_price', parsedPrice);
      }
    } catch (error) {
      console.error("Error fetching price:", error);
    } finally {
      setPriceLoading(false);
    }
  };

  // Auto-fill doctor name when client is selected
  useEffect(() => {
    const subscription = form.watch((data) => {
      if (data.clientId) {
        const selectedClient = clients.find(c => String(c.id) === data.clientId);
        if (selectedClient && !data.doctorName) {
          form.setValue('doctorName', selectedClient.name);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, clients]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
        await onSave({
            ...values,
            sentDate: format(values.sentDate, "yyyy-MM-dd"),
            dueDate: format(values.dueDate, "yyyy-MM-dd"),
            receivedDate: values.receivedDate ? format(values.receivedDate, "yyyy-MM-dd") : undefined,
        } as any);
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
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Create Lab Order</DialogTitle>
                <DialogDescription>
                    Fill out the details for the new lab order.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="clientId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Client</FormLabel>
                            <FormControl>
                                <Combobox
                                    options={clients.map(c => ({ value: String(c.id), label: c.name }))}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Select a client"
                                    searchPlaceholder="Search clients..."
                                    emptyMessage="No client found."
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="doctorName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Prescribing Doctor (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter doctor name" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="lab_service_id"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Lab Service (Optional)</FormLabel>
                            <FormControl>
                                <Select
                                  value={field.value?.toString() || ""}
                                  onValueChange={(val) => handleLabServiceSelect(parseInt(val))}
                                  disabled={servicesLoading || priceLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a service to auto-populate price" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {labServices.map((service) => (
                                            <SelectItem key={service.id} value={service.id.toString()}>
                                                {service.service_name} {service.category && `(${service.category})`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="applied_price"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Price</FormLabel>
                            <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="Auto-filled from service or enter manually"
                                  {...field}
                                  value={field.value || ""}
                                  onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                                  disabled={priceLoading}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="item"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Item</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Zirconia Crown" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="tooth"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Tooth #</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="Optional" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.value)} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Draft">Draft</SelectItem>
                                    <SelectItem value="Received">Received</SelectItem>
                                    <SelectItem value="In Production">In Production</SelectItem>
                                    <SelectItem value="Ready for Delivery">Ready for Delivery</SelectItem>
                                    <SelectItem value="Delivered">Delivered</SelectItem>
                                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="sentDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Sent Date</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "pl-3 text-left font-normal w-full",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Due Date</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "pl-3 text-left font-normal w-full",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="shade"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Shade</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., A1, B2" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="material"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Material</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Zirconia, PFM" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="instructions"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Instructions</FormLabel>
                            <FormControl>
                                <Input placeholder="Special instructions for the lab" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="receivedDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Received Date</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "pl-3 text-left font-normal w-full",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter className="col-span-1 md:col-span-3 mt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Order
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
