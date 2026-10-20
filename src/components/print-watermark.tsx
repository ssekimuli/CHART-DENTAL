"use client";

import React, { useEffect, useState } from "react";
import { getClinicName } from "@/lib/business-details";
import { getFacilityReceiptSettings } from "@/lib/api";

interface PrintWatermarkProps {
  /** Optional custom facility name. If omitted, retrieved from business-details / localStorage */
  facilityName?: string;
  /** Set to true when placed inside an exportable container (e.g. for html2pdf or section-isolated print) */
  embedInContent?: boolean;
  className?: string;
}

export function PrintWatermark({
  facilityName,
  embedInContent = false,
  className = "",
}: PrintWatermarkProps) {
  const [resolvedName, setResolvedName] = useState<string>(facilityName || "");

  useEffect(() => {
    if (facilityName) {
      setResolvedName(facilityName);
      return;
    }

    const localName = getClinicName();
    if (localName && localName !== "CHART DENTAL") {
      setResolvedName(localName);
    } else {
      setResolvedName(localName || "CHART DENTAL");
      // Asynchronously load receipt settings if local name was default fallback
      getFacilityReceiptSettings()
        .then((settings) => {
          if (settings?.clinic_name) {
            setResolvedName(settings.clinic_name);
          }
        })
        .catch(() => {});
    }
  }, [facilityName]);

  const displayName = facilityName || resolvedName;
  if (!displayName) return null;

  const embedClasses = `print-watermark-embed pointer-events-none select-none ${className}`;
  const overlayClasses = `print-watermark-overlay pointer-events-none select-none ${className}`;

  if (embedInContent) {
    return (
      <div
        className={embedClasses}
        aria-hidden="true"
        data-html2canvas-show="true"
      >
        <div className="print-watermark-text">{displayName}</div>
        <div className="print-watermark-text print-watermark-repeat">{displayName}</div>
      </div>
    );
  }

  return (
    <div
      className={overlayClasses}
      aria-hidden="true"
    >
      <div className="print-watermark-text">{displayName}</div>
    </div>
  );
}

export default PrintWatermark;
