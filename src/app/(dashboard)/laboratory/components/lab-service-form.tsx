"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { labServiceSchema, type LabServiceFormData } from "../schemas/lab-service.schema";
import type { LabService } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface LabServiceFormProps {
  service?: LabService;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LabServiceFormData) => Promise<void>;
  isLoading?: boolean;
}

export function LabServiceForm({
  service,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: LabServiceFormProps) {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<LabServiceFormData>({
    resolver: zodResolver(labServiceSchema),
    defaultValues: {
      service_name: service?.service_name || "",
      category: service?.category || "",
      is_active: service?.is_active ?? true,
    },
  });

  const handleFormSubmit = async (data: LabServiceFormData) => {
    try {
      await onSubmit(data);
      reset();
      onClose();
      toast({
        title: "Success",
        description: service ? "Lab service updated successfully" : "Lab service created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save lab service",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{service ? "Edit Lab Service" : "Create Lab Service"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service_name">Service Name *</Label>
            <Input
              id="service_name"
              placeholder="e.g., Crown, Bridge, Denture"
              {...register("service_name")}
              disabled={isLoading}
            />
            {errors.service_name && (
              <p className="text-sm text-red-500">{errors.service_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="e.g., Prosthodontics, Implantology"
              {...register("category")}
              disabled={isLoading}
            />
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <Switch
                  id="is_active"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              )}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
