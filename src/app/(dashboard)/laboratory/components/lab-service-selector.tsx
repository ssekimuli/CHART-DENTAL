"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LabService, LabServicePrice } from "@/lib/types";
import { getActivePriceForService } from "@/lib/api-lab-prices";

interface LabServiceSelectorProps {
  services: LabService[];
  selectedServiceId?: number | null;
  appliedPrice?: number | null;
  onServiceSelect: (serviceId: number, price: number | null) => void;
  onPriceChange: (price: number) => void;
  canOverridePrice?: boolean;
  isLoading?: boolean;
}

export function LabServiceSelector({
  services,
  selectedServiceId,
  appliedPrice,
  onServiceSelect,
  onPriceChange,
  canOverridePrice = true,
  isLoading = false,
}: LabServiceSelectorProps) {
  const [open, setOpen] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [showPriceOverride, setShowPriceOverride] = useState(false);

  const selectedService = services.find((s) => s.id === selectedServiceId);

  const handleServiceSelect = async (serviceId: number) => {
    setPriceLoading(true);
    try {
      const price = await getActivePriceForService(serviceId);
      onServiceSelect(serviceId, price?.base_price || null);
    } catch (error) {
      console.error("Error fetching price:", error);
      onServiceSelect(serviceId, null);
    } finally {
      setPriceLoading(false);
      setOpen(false);
      setShowPriceOverride(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="lab-service">Lab Service (Optional)</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={isLoading || priceLoading}
            >
              {selectedService ? (
                <span className="truncate">
                  {selectedService.service_name}
                  {selectedService.category && ` (${selectedService.category})`}
                </span>
              ) : (
                "Select a lab service..."
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search lab services..." />
              <CommandEmpty>No lab service found.</CommandEmpty>
              <CommandList>
                <CommandGroup>
                  {services.map((service) => (
                    <CommandItem
                      key={service.id}
                      value={service.id.toString()}
                      onSelect={() => handleServiceSelect(service.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedServiceId === service.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1">
                        <div>{service.service_name}</div>
                        {service.category && (
                          <div className="text-xs text-muted-foreground">{service.category}</div>
                        )}
                      </div>
                      {service.current_price && (
                        <div className="ml-2 font-semibold">${parseFloat(String(service.current_price)).toFixed(2)}</div>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground">
          Selecting a service will auto-populate the price
        </p>
      </div>

      {selectedService && (
        <div className="space-y-2 p-3 border rounded bg-muted/50">
          <div className="flex items-center justify-between">
            <Label>Service Price</Label>
            {canOverridePrice && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPriceOverride(!showPriceOverride)}
              >
                {showPriceOverride ? "Use Default" : "Override"}
              </Button>
            )}
          </div>

          {priceLoading ? (
            <div className="text-sm text-muted-foreground">Fetching price...</div>
          ) : appliedPrice ? (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">${parseFloat(String(appliedPrice)).toFixed(2)}</span>
              <span className="text-xs text-muted-foreground">
                {selectedService.current_price === appliedPrice ? "Current price" : "Custom price"}
              </span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No active price for this service</div>
          )}

          {showPriceOverride && canOverridePrice && (
            <div className="space-y-2 mt-3 pt-3 border-t">
              <Label htmlFor="price-override" className="text-xs">
                Enter custom price
              </Label>
              <Input
                id="price-override"
                type="number"
                step="0.01"
                placeholder="Enter price"
                value={appliedPrice || ""}
                onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
                className="text-sm"
              />
            </div>
          )}
        </div>
      )}

      {!selectedService && appliedPrice && (
        <div className="space-y-2 p-3 border rounded bg-muted/50">
          <Label htmlFor="manual-price">Manual Price</Label>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">${parseFloat(String(appliedPrice)).toFixed(2)}</span>
            <span className="text-xs text-muted-foreground">Custom price (no service)</span>
          </div>
        </div>
      )}
    </div>
  );
}
