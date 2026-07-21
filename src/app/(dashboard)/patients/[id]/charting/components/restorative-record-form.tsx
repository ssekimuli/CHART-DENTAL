"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import type { RestorativeRecord } from "@/lib/types";

const formSchema = z.object({
  toothId: z.number().min(1, "Tooth ID is required").max(48, "Invalid tooth ID"),
  surface: z.string().min(1, "Surface is required"),
  material: z.string().min(1, "Material is required"),
  notes: z.string().optional(),
});

type RestorativeRecordFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: RestorativeRecord;
  onSave: (record: Omit<RestorativeRecord, "id" | "createdAt" | "updatedAt">) => void;
  onUpdate: (record: RestorativeRecord) => void;
};

const commonSurfaces = ["O", "M", "D", "B", "L", "MO", "DO", "MOD", "MODB", "MODL"];
const commonMaterials = ["Composite", "Amalgam", "Glass Ionomer", "Gold", "Porcelain", "Ceramic"];

export function RestorativeRecordForm({
  open,
  onOpenChange,
  initialData,
  onSave,
  onUpdate,
}: RestorativeRecordFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      toothId: initialData?.toothId || 1,
      surface: initialData?.surface || "",
      material: initialData?.material || "",
      notes: initialData?.notes || "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        toothId: initialData.toothId,
        surface: initialData.surface,
        material: initialData.material,
        notes: initialData.notes || "",
      });
    } else {
      form.reset({
        toothId: 1,
        surface: "",
        material: "",
        notes: "",
      });
    }
  }, [initialData, form, open]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (initialData && initialData.id) {
      onUpdate({
        ...initialData,
        ...values,
      });
    } else {
      onSave(values);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Restorative Record" : "Add Restorative Record"}</DialogTitle>
          <DialogDescription>
            Record details about dental restorations.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="toothId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tooth ID</FormLabel>
                  <FormControl>
                    <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="surface"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Surface</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select surface (e.g. MOD)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {commonSurfaces.map((surface) => (
                        <SelectItem key={surface} value={surface}>
                          {surface}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {commonMaterials.map((material) => (
                        <SelectItem key={material} value={material}>
                          {material}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                        placeholder="Additional details..." 
                        className="resize-none"
                        {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
