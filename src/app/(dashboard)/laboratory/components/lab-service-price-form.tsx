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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { labServicePriceSchema, type LabServicePriceFormData } from "../schemas/lab-service-price.schema";
import type { LabService, LabServicePrice } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface LabServicePriceFormProps {
  price?: LabServicePrice;
  services: LabService[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LabServicePriceFormData) => Promise<void>;
  isLoading?: boolean;
}

export function LabServicePriceForm({
  price,
  services,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: LabServicePriceFormProps) {
  const { toast } = useToast();
  const [selectedService, setSelectedService] = useState<string>(price?.lab_service_id.toString() || "");

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<LabServicePriceFormData>({
    resolver: zodResolver(labServicePriceSchema),
    defaultValues: {
      lab_service_id: price?.lab_service_id || 0,
      lab: price?.lab || "",
      base_price: price?.base_price || 0,
      is_active: price?.is_active ?? true,
    },
  });

  const isActive = watch("is_active");

  const handleFormSubmit = async (data: LabServicePriceFormData) => {
    try {
      if (!selectedService) {
        toast({
          title: "Error",
          description: "Please select a lab service",
          variant: "destructive",
        });
        return;
      }

      await onSubmit({
        ...data,
        lab_service_id: parseInt(selectedService),
      });
      reset();
      setSelectedService("");
      onClose();
      toast({
        title: "Success",
        description: price ? "Lab price updated successfully" : "Lab price created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save lab price",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{price ? "Edit Lab Price" : "Create Lab Price"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lab_service_id">Lab Service *</Label>
            <Select value={selectedService} onValueChange={setSelectedService} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a lab service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id.toString()}>
                    {service.service_name} {service.category && `(${service.category})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.lab_service_id && (
              <p className="text-sm text-red-500">{errors.lab_service_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lab">Lab Name *</Label>
            <Input
              id="lab"
              placeholder="e.g., Premier Lab, Standard Lab"
              {...register("lab")}
              disabled={isLoading}
            />
            {errors.lab && (
              <p className="text-sm text-red-500">{errors.lab.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="base_price">Base Price *</Label>
            <Input
              id="base_price"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("base_price", { valueAsNumber: true })}
              disabled={isLoading}
            />
            {errors.base_price && (
              <p className="text-sm text-red-500">{errors.base_price.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={(checked) => register("is_active").onChange({ target: { value: checked } })}
              disabled={isLoading}
            />
            <Label htmlFor="is_active">Active (Sets this as the current price)</Label>
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
