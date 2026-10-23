"use client";
import { useToast } from "@/hooks/use-toast";

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
  amount: z.string().optional(),
  period: z.string().optional(),
  procedures: z.string().optional(),
});

type OrthodonticRecordFormProps = {
  record?: OrthodonticRecord;
  onSave: (data: Omit<OrthodonticRecord, 'id'>) => void;
  onCancel: () => void;
};

export function OrthodonticRecordForm({ record, onSave, onCancel }: OrthodonticRecordFormProps) {
  const { toast } = useToast();
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
      amount: record?.amount != null ? String(record.amount) : "",
      period: record?.period ?? "",
      procedures: record?.procedures ?? "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
    await onSave({
      ...values,
      amount: values.amount ? parseFloat(values.amount) : undefined,
      period: values.period || undefined,
      procedures: values.procedures || undefined,
      date: format(values.date, "yyyy-MM-dd"),
      bracketChanges: values.bracketChanges?.split(',').map(s => s.trim()).filter(Boolean),
      brokenBrackets: values.brokenBrackets?.split(',').map(s => s.trim()).filter(Boolean),
    });
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
                      <SelectItem value="Initial">Initial / Commencement</SelectItem>
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

            {/* INITIAL TREATMENT PHASE SPECIAL SECTION (COST, DURATION & PROCEDURES) */}
            {form.watch("treatmentPhase")?.toLowerCase().includes("initial") && (
              <div className="col-span-full rounded-xl border border-teal-200 bg-teal-50/60 p-4 dark:border-teal-900/50 dark:bg-teal-950/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white font-bold text-xs shadow-sm">
                      USh
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-teal-950 dark:text-teal-200">
                        Initial Phase: Treatment Contract & Duration
                      </h4>
                      <p className="text-xs text-teal-700 dark:text-teal-400">
                        Entering total fee will generate a billing invoice. Clinical plan will be logged into Medical History without fee amount.
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-semibold text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
                    Billing & Medical History
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-teal-900 dark:text-teal-300">Total Process Cost (USh)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 2500000"
                            className="bg-white dark:bg-slate-900 font-mono font-bold"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="period"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-teal-900 dark:text-teal-300">Estimated Treatment Period / Duration</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 18 Months"
                            className="bg-white dark:bg-slate-900"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {['6 Months', '12 Months', '18 Months', '24 Months', '36 Months'].map(chip => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => form.setValue('period', chip)}
                              className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                                field.value === chip
                                  ? 'bg-teal-600 text-white border-teal-600'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="procedures"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-teal-900 dark:text-teal-300">
                        Planned Procedures Across Treatment Period
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Initial banding & bonding, archwire progression, IPR/space closure, detailing & retainers"
                          className="bg-white dark:bg-slate-900 text-xs min-h-[60px]"
                          {...field}
                        />
                      </FormControl>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {['Banding & Bonding', 'Archwire Progression', 'IPR / Space Closure', 'Detailing & Finishing', 'Debonding & Retainers'].map(item => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => {
                              const cur = field.value || '';
                              if (!cur) form.setValue('procedures', item);
                              else if (!cur.includes(item)) form.setValue('procedures', `${cur}, ${item}`);
                            }}
                            className="text-[10px] px-2 py-0.5 rounded-md border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 hover:bg-teal-50 text-teal-800 dark:text-teal-300"
                          >
                            + {item}
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
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
