
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, User } from "lucide-react"
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

export function PatientSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])

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

  useEffect(() => {
    if (open) {
      const fetchPatients = async () => {
        const patientsData = await getPatients()
        setPatients(patientsData)
      }
      fetchPatients()
    }
  }, [open])

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
        <CommandInput placeholder="Type a name, email, or ID to search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Patients">
            {patients.map((patient) => (
              <CommandItem
                key={patient.id}
                value={`${patient.name} ${patient.email} ${patient.id}`}
                onSelect={() => handleSelect(patient.id)}
                className="flex items-start gap-2"
              >
                <div className="mt-1">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span>{patient.name}</span>
                  <span className="text-xs text-muted-foreground">{patient.email}</span>
                  <span className="text-xs text-muted-foreground font-mono">ID: {patient.id}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
