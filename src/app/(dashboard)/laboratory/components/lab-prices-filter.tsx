"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface LabPricesFilterProps {
  search: string;
  lab: string;
  minPrice: number | null;
  maxPrice: number | null;
  activeOnly: boolean;
  onSearchChange: (search: string) => void;
  onLabChange: (lab: string) => void;
  onPriceRangeChange: (min: number | null, max: number | null) => void;
  onActiveChange: (active: boolean) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

export function LabPricesFilter({
  search,
  lab,
  minPrice,
  maxPrice,
  activeOnly,
  onSearchChange,
  onLabChange,
  onPriceRangeChange,
  onActiveChange,
  onClear,
  hasActiveFilters,
}: LabPricesFilterProps) {
  return (
    <div className="space-y-4 mb-6 p-4 border rounded-lg bg-muted/50">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search by lab or service..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lab">Lab Name</Label>
          <Input
            id="lab"
            placeholder="Filter by lab..."
            value={lab}
            onChange={(e) => onLabChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="minPrice">Min Price</Label>
          <Input
            id="minPrice"
            type="number"
            placeholder="Min price"
            value={minPrice || ""}
            onChange={(e) => onPriceRangeChange(e.target.value ? parseFloat(e.target.value) : null, maxPrice)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxPrice">Max Price</Label>
          <Input
            id="maxPrice"
            type="number"
            placeholder="Max price"
            value={maxPrice || ""}
            onChange={(e) => onPriceRangeChange(minPrice, e.target.value ? parseFloat(e.target.value) : null)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => onActiveChange(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">Active prices only</span>
        </label>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}
