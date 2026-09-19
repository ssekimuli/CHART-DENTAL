"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type MultiComboboxOption<T> = {
  label: string;
  value: T;
  category?: string;
}

type MultiComboboxProps<T> = {
  options: MultiComboboxOption<T>[];
  values: T[];
  onChange: (values: T[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export function MultiCombobox<T extends string | number>({
  options,
  values,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
}: MultiComboboxProps<T>) {
  const [open, setOpen] = React.useState(false)

  const groupedOptions = React.useMemo(() => {
    const hasCategories = options.some(opt => opt.category)
    if (!hasCategories) return { All: options }
    return options.reduce((acc, option) => {
      const key = option.category || "Other"
      if (!acc[key]) acc[key] = []
      acc[key].push(option)
      return acc
    }, {} as Record<string, typeof options>)
  }, [options])

  const toggle = (val: T) => {
    if (values.some(v => String(v) === String(val))) {
      onChange(values.filter(v => String(v) !== String(val)))
    } else {
      onChange([...values, val])
    }
  }

  const remove = (val: T, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(values.filter(v => String(v) !== String(val)))
  }

  const selectedLabels = values.map(
    v => options.find(o => String(o.value) === String(v))?.label ?? String(v)
  )

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-10"
          >
            <span className="text-muted-foreground text-sm">
              {values.length === 0
                ? (placeholder ?? "Select procedures...")
                : `${values.length} selected`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder={searchPlaceholder ?? "Search..."} />
            <CommandList className="max-h-[300px] overflow-y-auto">
              <CommandEmpty>{emptyMessage ?? "No results found."}</CommandEmpty>
              {Object.entries(groupedOptions).map(([category, items]) => (
                <CommandGroup
                  key={category}
                  heading={category !== "All" ? category : undefined}
                >
                  {items.map(option => {
                    const isSelected = values.some(
                      v => String(v) === String(option.value)
                    )
                    return (
                      <CommandItem
                        key={String(option.value)}
                        value={option.label}
                        onSelect={() => toggle(option.value)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {option.label}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected badges */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedLabels.map((label, idx) => (
            <Badge
              key={String(values[idx])}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <span className="max-w-[200px] truncate text-xs">{label}</span>
              <button
                type="button"
                onClick={e => remove(values[idx], e)}
                className="rounded-full hover:bg-muted-foreground/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
