"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { updateLabOrder } from "@/lib/api";

const formSchema = z.object({
  clientId: z.string().optional(),
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
  applied_price: z.number().optional().nullable(),
});

type LabOrderEditFormProps = {
  order: LaboratoryOrder;
  clients: Client[];
  doctors: Employee[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (data: LaboratoryOrder) => void;
};

export function LabOrderEditForm({
  order,
  clients,
  doctors,
  isOpen,
  onClose,
  onUpdate,
}: LabOrderEditFormProps) {
  const { toast } = useToast();
  const { selectedBranch } = useBranch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [labServices, setLabServices] = useState<LabService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: String(order.clientId || ""),
      item: order.item,
      tooth: order.tooth,
      status: order.status,
      sentDate: new Date(order.sentDate),
      dueDate: new Date(order.dueDate),
      receivedDate: order.receivedDate ? new Date(order.receivedDate) : undefined,
      shade: order.shade,
      material: order.material,
      instructions: order.instructions,
      doctorName: order.doctorName || "",
      lab_service_id: order.lab_service_id,
      applied_price: order.applied_price,
    },
  });

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

  useEffect(() => {
    const selectedClientId = form.watch('clientId');
    const currentDoctorName = form.watch('doctorName');

    if (selectedClientId && !currentDoctorName) {
      const selectedClient = clients.find(c => String(c.id) === selectedClientId);
      if (selectedClient) {
        form.setValue('doctorName', selectedClient.name);
      }
    }
  }, [form.watch('clientId'), clients, form]);

  const handleLabServiceSelect = async (serviceId: number) => {
    form.setValue('lab_service_id', serviceId);
    setPriceLoading(true);
    try {
      const price = await getActivePriceForService(serviceId);
      if (price) {
        form.setValue('applied_price', parseFloat(String(price.base_price)));
      }
    } catch (error) {
      console.error("Error fetching price:", error);
    } finally {
      setPriceLoading(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const updatedOrder = await updateLabOrder(order.id as number, {
        ...values,
        sentDate: format(values.sentDate, "yyyy-MM-dd"),
        dueDate: format(values.dueDate, "yyyy-MM-dd"),
        receivedDate: values.receivedDate ? format(values.receivedDate, "yyyy-MM-dd") : undefined,
      } as any);

      onUpdate(updatedOrder);
      onClose();
      toast({
        title: "Success",
        description: "Lab order updated successfully",
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "Failed to update lab order",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Lab Order</DialogTitle>
          <DialogDescription>
            Update the details for lab order #{order.id}
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
              name="material"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Zirconia, Gold" {...field} />
                  </FormControl>
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
                    <Input placeholder="e.g., A1, A2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sent Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
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
                        disabled={(date) => date > new Date("2100-01-01")}
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
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
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
                        disabled={(date) => date > new Date("2100-01-01")}
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
              name="receivedDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Received Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
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
                        disabled={(date) => date > new Date("2100-01-01")}
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
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
              name="instructions"
              render={({ field }) => (
                <FormItem className="md:col-span-3">
                  <FormLabel>Instructions</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., High-strength, no adjustments" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="md:col-span-3 flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Updating..." : "Update Order"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
