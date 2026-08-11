// Utility for managing business details from localStorage

export interface BusinessDetails {
  clinic_name: string;
  clinic_address: string;
  branch?: {
    id: number;
    name: string;
    address: string;
    currency: string;
  };
}

export function getBusinessDetails(): BusinessDetails | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem("businessDetails");
    if (stored) {
      return JSON.parse(stored) as BusinessDetails;
    }
  } catch (error) {
    console.error("Failed to parse business details from localStorage:", error);
  }

  return null;
}

export function getClinicName(): string {
  const details = getBusinessDetails();
  return details?.clinic_name || "CHART DENTAL";
}

export function getClinicAddress(): string {
  const details = getBusinessDetails();
  return details?.clinic_address || "null";
}

export function getClinicPhone(): string {
  // Phone number is not in the API response, keeping as default
  return "+256 759672755";
}

export function getBranchCurrency(): string {
  const details = getBusinessDetails();
  return details?.branch?.currency || "UGX";
}
