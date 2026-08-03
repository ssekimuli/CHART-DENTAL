"use client";

import { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrthodonticRecord } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";
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
  onCancel: () => void;
};

export function OrthodonticRecordForm({ record, onSave, onCancel }: OrthodonticRecordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: record ? parseISO(record.date) : new Date(),
      appliance: record?.appliance ?? "Braces",
      applianceLocation: record?.applianceLocation ?? "",
      treatmentPhase: record?.treatmentPhase ?? "",
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
    onSave({
      ...values,
      date: format(values.date, "yyyy-MM-dd"),
      bracketChanges: values.bracketChanges?.split(',').map(s => s.trim()).filter(Boolean),
      brokenBrackets: values.brokenBrackets?.split(',').map(s => s.trim()).filter(Boolean),
    });
      } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-6">
      <div className="mb-6 flex flex-row items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {record ? "Edit Orthodontic Record" : "Add Orthodontic Record"}
          </h2>
          <p className="text-muted-foreground">
            {record
              ? "Update the details of the orthodontic visit."
              : "Record details of the orthodontic visit, including appliance changes and treatment goals."}
          </p>
        </div>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
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
                  <FormLabel>Appliance Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select appliance" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Braces">Braces</SelectItem>
                      <SelectItem value="Clear Aligners">Clear Aligners</SelectItem>
                      <SelectItem value="Retainer">Retainer</SelectItem>
                      <SelectItem value="Expander">Expander</SelectItem>
                      <SelectItem value="Headgear">Headgear</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="applianceLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Appliance Location</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Upper">Upper Only</SelectItem>
                      <SelectItem value="Lower">Lower Only</SelectItem>
                      <SelectItem value="Upper & Lower">Upper & Lower</SelectItem>
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
                      <SelectItem value="Initial Alignment">Initial Alignment</SelectItem>
                      <SelectItem value="Leveling">Leveling</SelectItem>
                      <SelectItem value="Space Closure">Space Closure</SelectItem>
                      <SelectItem value="Finishing">Finishing & Detailing</SelectItem>
                      <SelectItem value="Retention">Retention</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="wireSizeUpper"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wire Size (Upper)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., .014 NiTi" {...field} />
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
                    <Input placeholder="e.g., .018 SS" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                  <FormLabel>Elastics Instructions</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Class II, 1/4 inch, 4.5 oz" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="compliance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient Compliance</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select compliance" />
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
                        <SelectValue placeholder="Select status" />
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
            name="bracketChanges"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repositioned Brackets</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., UR3, LL4 (Comma separated)" {...field} />
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
                  <Input placeholder="e.g., UR6, LR7 (Comma separated)" {...field} />
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
                <FormLabel>Clinical Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="General observations and treatment notes..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nextVisitGoals"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Next Visit Goals</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Plan for the next appointment..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button type="submit"  disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Record
      </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
