import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Patient } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPatientFullName(patient: Patient | { first_name: string; last_name: string }): string {
  return `${patient.first_name} ${patient.last_name}`.trim()
}
