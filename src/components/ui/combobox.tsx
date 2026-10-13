
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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

type ComboboxOption<T> = {
    label: string;
    value: T;
    category?: string;
}

type ComboboxProps<T> = {
    options: ComboboxOption<T>[];
    value?: T;
    onChange: (value: T) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    onSearchChange?: (search: string) => void;
}

export function Combobox<T extends string | number>({ options, value, onChange, placeholder, searchPlaceholder, emptyMessage, onSearchChange }: ComboboxProps<T>) {
  const [open, setOpen] = React.useState(false)

  // Group options if categories exist
  const groupedOptions = React.useMemo(() => {
    const hasCategories = options.some(opt => opt.category);
    if (!hasCategories) return { "All": options };

    return options.reduce((acc, option) => {
      const key = option.category || 'Other';
      if (!acc[key]) acc[key] = [];
      acc[key].push(option);
      return acc;
    }, {} as Record<string, typeof options>);
  }, [options]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value !== undefined && value !== null && value !== ""
            ? options.find((option) => String(option.value) === String(value))?.label ?? String(value)
            : placeholder ?? "Select option..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder ?? "Search..."} onValueChange={onSearchChange} />
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>{emptyMessage ?? "No results found."}</CommandEmpty>
            {Object.entries(groupedOptions).map(([category, items]) => (
                <CommandGroup key={category} heading={category !== "All" ? category : undefined}>
                  {items.map((option) => (
                    <CommandItem
                      key={String(option.value)}
                      value={option.label}
                      onSelect={() => {
                        onChange(option.value)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          String(value) === String(option.value) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
