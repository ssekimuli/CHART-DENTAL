
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
import type { OrthodonticRecord } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  date: z.date({ required_error: "A date is required." }),
  appliance: z.enum(["Braces", "Invisalign", "Retainer"]),
  wireSize: z.string().optional(),
  bracketChanges: z.string().optional(),
  notes: z.string().min(1, "Notes are required."),
});

type OrthodonticRecordFormProps = {
  record?: OrthodonticRecord;
  onSave: (data: Omit<OrthodonticRecord, 'id'>) => void;
  onOpenChange: (open: boolean) => void;
};

export function OrthodonticRecordForm({ record, onSave, onOpenChange }: OrthodonticRecordFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: record ? parseISO(record.date) : new Date(),
      appliance: record?.appliance ?? "Braces",
      wireSize: record?.wireSize ?? "",
      bracketChanges: record?.bracketChanges?.join(', ') ?? "",
      notes: record?.notes ?? "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onSave({
      ...values,
      date: format(values.date, "yyyy-MM-dd"),
      bracketChanges: values.bracketChanges?.split(',').map(s => s.trim()).filter(Boolean),
    });
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{record ? "Edit Orthodontic Record" : "Add Orthodontic Record"}</DialogTitle>
          <DialogDescription>
            Log the details of the orthodontic appointment.
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
                    <FormLabel>Date</FormLabel>
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
                name="appliance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Appliance</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select appliance" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Braces">Braces</SelectItem>
                        <SelectItem value="Invisalign">Invisalign</SelectItem>
                        <SelectItem value="Retainer">Retainer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="wireSize"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Wire Size (optional)</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., .016 x .022" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="bracketChanges"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Bracket Changes (optional)</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., #12, #14" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
             <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="e.g., Patient compliant with elastic wear..."
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
