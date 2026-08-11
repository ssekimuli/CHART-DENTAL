// Utility for managing business details from localStorage

export interface BusinessDetails {
  clinic_name: string;
  clinic_address: string;
  clinic_phone?: string;
  branch?: {
    id: number;
    name: string;
    address: string;
    currency: string;
    contactNumber?: string;
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
  return details?.clinic_address || "Your Address Here";
}

export function getClinicPhone(): string {
  const details = getBusinessDetails();
  return details?.clinic_phone || details?.branch?.contactNumber || "";
}

export function getBranchCurrency(): string {
  const details = getBusinessDetails();
  return details?.branch?.currency || "UGX";
}
