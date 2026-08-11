import { useEffect, useState } from "react";
import type { BusinessDetails } from "@/lib/business-details";
import { getBusinessDetails, getClinicPhone } from "@/lib/business-details";

export function useBusinessDetails() {
  const [details, setDetails] = useState<BusinessDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const businessDetails = getBusinessDetails();
    setDetails(businessDetails);
    setIsLoading(false);
  }, []);

  return {
    details,
    isLoading,
    clinicName: details?.clinic_name || "CHART DENTAL",
    clinicAddress: details?.clinic_address || "Your Address Here",
    clinicPhone: getClinicPhone(),
    currency: details?.branch?.currency || "UGX",
  };
}
