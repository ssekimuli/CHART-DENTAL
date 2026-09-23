
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, User, Loader2 } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { getPatients } from "@/lib/api"
import type { Patient } from "@/lib/types"
import { getPatientFullName } from "@/lib/utils"

export function PatientSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Ctrl/Cmd+K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery("")
      setPatients([])
    }
  }, [open])

  // Debounced API search
  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setPatients([])
      return
    }

    setIsLoading(true)
    try {
      const data = await getPatients({ searchQuery, perPage: 10 })
      setPatients(data)
    } catch {
      setPatients([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, search])

  const handleSelect = (patientId: string) => {
    setOpen(false)
    router.push(`/patients/${patientId}`)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-[300px] md:w-[200px] lg:w-[300px]"
      >
        <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span>Search patients...</span>
        </div>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Type a name, email, or phone to search..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </div>
          )}
          {!isLoading && query.trim() && patients.length === 0 && (
            <CommandEmpty>No patients found.</CommandEmpty>
          )}
          {!isLoading && !query.trim() && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Start typing to search patients...
            </div>
          )}
          {!isLoading && patients.length > 0 && (
            <CommandGroup heading="Patients">
              {patients.map((patient) => (
                <CommandItem
                  key={patient.id}
                  value={`${getPatientFullName(patient)} ${patient.email} ${patient.id}`}
                  onSelect={() => handleSelect(patient.id.toString())}
                  className="flex items-start gap-2"
                >
                  <div className="mt-1">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span>{getPatientFullName(patient)}</span>
                    <span className="text-xs text-muted-foreground">{patient.email}</span>
                    <span className="text-xs text-muted-foreground font-mono">ID: {patient.id}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
