
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
  appliance: z.string(),
  applianceLocation: z.string().optional(),
  treatmentPhase: z.string().optional(),
  wireSize: z.string().optional(),
  wireSizeUpper: z.string().optional(),
  wireSizeLower: z.string().optional(),
  archwireMaterial: z.string().optional(),
  elastics: z.string().optional(),
  compliance: z.string().optional(),
  oralHygiene: z.string().optional(),
  bracketChanges: z.string().optional(),
  brokenBrackets: z.string().optional(),
  nextVisitGoals: z.string().optional(),
  notes: z.string().optional(),
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
      applianceLocation: record?.applianceLocation ?? "",
      treatmentPhase: record?.treatmentPhase ?? "",
      wireSize: record?.wireSize ?? "",
      wireSizeUpper: record?.wireSizeUpper ?? "",
      wireSizeLower: record?.wireSizeLower ?? "",
      archwireMaterial: record?.archwireMaterial ?? "",
      elastics: record?.elastics ?? "",
      compliance: record?.compliance ?? "",
      oralHygiene: record?.oralHygiene ?? "",
      bracketChanges: record?.bracketChanges?.join(', ') ?? "",
      brokenBrackets: record?.brokenBrackets?.join(', ') ?? "",
      nextVisitGoals: record?.nextVisitGoals ?? "",
      notes: record?.notes ?? "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onSave({
      ...values,
      date: format(values.date, "yyyy-MM-dd"),
      bracketChanges: values.bracketChanges?.split(',').map(s => s.trim()).filter(Boolean),
      brokenBrackets: values.brokenBrackets?.split(',').map(s => s.trim()).filter(Boolean),
    });
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <DialogTitle>{record ? "Edit Orthodontic Record" : "Add Orthodontic Record"}</DialogTitle>
            <DialogDescription>
              Log the details of the orthodontic appointment.
            </DialogDescription>
          </div>
          <div className="flex gap-2 mr-6">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="button" size="sm" onClick={form.handleSubmit(onSubmit)}>{record ? "Save" : "Add"}</Button>
          </div>
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
                        <SelectItem value="Other">Other</SelectItem>
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
                  name="applianceLocation"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Location</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                          <SelectTrigger>
                              <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                          <SelectItem value="Upper">Upper</SelectItem>
                          <SelectItem value="Lower">Lower</SelectItem>
                          <SelectItem value="Both">Both</SelectItem>
                          </SelectContent>
                      </Select>
                      <FormMessage />
                      </FormItem>
                  )}
              />
               <FormField
                  control={form.control}
                  name="treatmentPhase"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Treatment Phase</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                          <SelectTrigger>
                              <SelectValue placeholder="Select phase" />
                          </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                          <SelectItem value="Observation">Observation</SelectItem>
                          <SelectItem value="Initial Alignment">Initial Alignment</SelectItem>
                          <SelectItem value="Space Closure">Space Closure</SelectItem>
                          <SelectItem value="Finishing">Finishing</SelectItem>
                          <SelectItem value="Retention">Retention</SelectItem>
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
                    name="wireSizeUpper"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Wire Size (Upper)</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., .016 NiTi" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="wireSizeLower"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Wire Size (Lower)</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., .014 NiTi" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="archwireMaterial"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Archwire Material</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., NiTi, SS, TMA" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="elastics"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Elastics</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Class II, Nighttime" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="bracketChanges"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Bracket Changes</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., 12, 14" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="brokenBrackets"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Broken Brackets</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., 44, 45" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="compliance"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Compliance</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                          <SelectTrigger>
                              <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                          <SelectItem value="Excellent">Excellent</SelectItem>
                          <SelectItem value="Good">Good</SelectItem>
                          <SelectItem value="Fair">Fair</SelectItem>
                          <SelectItem value="Poor">Poor</SelectItem>
                          </SelectContent>
                      </Select>
                      <FormMessage />
                      </FormItem>
                  )}
              />
               <FormField
                  control={form.control}
                  name="oralHygiene"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Oral Hygiene</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                          <SelectTrigger>
                              <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                          <SelectItem value="Excellent">Excellent</SelectItem>
                          <SelectItem value="Good">Good</SelectItem>
                          <SelectItem value="Fair">Fair</SelectItem>
                          <SelectItem value="Poor">Poor</SelectItem>
                          </SelectContent>
                      </Select>
                      <FormMessage />
                      </FormItem>
                  )}
              />
            </div>
             <FormField
                control={form.control}
                name="nextVisitGoals"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Next Visit Goals</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Start closing spaces..." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
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

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
