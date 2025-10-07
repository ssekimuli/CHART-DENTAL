
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, parseISO } from "date-fns";

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
import type { SoftTissueRecord } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  date: z.date({ required_error: "A date is required." }),
  location: z.string().min(1, "Location is required."),
  type: z.enum(["Ulcer", "Lesion", "Color Change", "Swelling"]),
  description: z.string().min(1, "Description is required."),
});

type SoftTissueRecordFormProps = {
  record?: SoftTissueRecord;
  onSave: (data: Omit<SoftTissueRecord, 'id'>) => void;
  onOpenChange: (open: boolean) => void;
};

export function SoftTissueRecordForm({ record, onSave, onOpenChange }: SoftTissueRecordFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: record ? parseISO(record.date) : new Date(),
      location: record?.location ?? "",
      type: record?.type ?? "Lesion",
      description: record?.description ?? "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onSave({
      ...values,
      date: format(values.date, "yyyy-MM-dd"),
    });
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{record ? "Edit Soft Tissue Record" : "Add Soft Tissue Record"}</DialogTitle>
          <DialogDescription>
            Log any observations or abnormalities on the soft tissues.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date of Observation</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
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
                    name="location"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Right buccal mucosa" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
             <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observation Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Ulcer">Ulcer</SelectItem>
                        <SelectItem value="Lesion">Lesion</SelectItem>
                        <SelectItem value="Color Change">Color Change</SelectItem>
                        <SelectItem value="Swelling">Swelling</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
             <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="e.g., 2mm white, round, well-defined borders..."
                        className="resize-none"
                        {...field}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{record ? "Save Changes" : "Add Record"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
