// Utility for managing business details from localStorage

export interface BusinessDetails {
  clinic_name?: string;
  clinic_address?: string;
  clinic_phone?: string;
  name?: string;
  address?: string;
  phone?: string;
  contactNumber?: string;
  contact_number?: string;
  branch?: {
    id: number;
    name: string;
    address: string;
    currency: string;
    contactNumber?: string;
    contact_number?: string;
    phone?: string;
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
  return details?.clinic_name || details?.name || details?.branch?.name || "CHART DENTAL";
}

export function getClinicAddress(): string {
  const details = getBusinessDetails();
  const addr = details?.clinic_address || details?.address || details?.branch?.address;
  if (addr && addr.toLowerCase() !== "your address here") {
    return addr;
  }
  return addr || "";
}

export function getClinicPhone(): string {
  const details = getBusinessDetails();
  return (
    details?.clinic_phone ||
    details?.phone ||
    details?.contactNumber ||
    details?.contact_number ||
    details?.branch?.contactNumber ||
    details?.branch?.contact_number ||
    details?.branch?.phone ||
    ""
  );
}

export function getBranchCurrency(): string {
  const details = getBusinessDetails();
  return details?.branch?.currency || "UGX";
}
