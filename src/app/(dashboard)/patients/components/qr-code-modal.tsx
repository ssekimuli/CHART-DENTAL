"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2pdf from "html2pdf.js";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string | number;
  patientName?: string;
  baseUrl: string;
}

export function QRCodeModal({
  isOpen,
  onClose,
  patientId,
  patientName,
  baseUrl,
}: QRCodeModalProps) {
  const { toast } = useToast();
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const qrImageRef = useRef<HTMLImageElement>(null);

  const cleanBaseUrl = baseUrl.replace(/\/api\/?$/, "");
  const registrationUrl = patientId
    ? `${cleanBaseUrl}/self-register?patientId=${patientId}`
    : `${cleanBaseUrl}/self-register`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(registrationUrl)}`;

  const downloadQRCodePDF = async () => {
    try {
      if (!qrContainerRef.current) return;

      const element = qrContainerRef.current;
      const filename = patientName
        ? `${patientName}-registration-qr.pdf`
        : "patient-registration-qr.pdf";

      const opt = {
        margin: 10,
        filename: filename,
        image: { type: "png", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
      } as any;

      html2pdf().set(opt).from(element).save();

      toast({
        title: "Success",
        description: "QR code downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading QR code:", error);
      toast({
        title: "Error",
        description: "Failed to download QR code",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Patient Registration QR Code</DialogTitle>
          <DialogDescription>
            {patientName
              ? `Share this QR code with ${patientName} for self-registration`
              : "Share this QR code for patient self-registration"}
          </DialogDescription>
        </DialogHeader>

        <div ref={qrContainerRef} className="flex flex-col items-center justify-center space-y-4 py-6">
          <div className="bg-white p-4 rounded-lg border">
            <img
              ref={qrImageRef}
              src={qrCodeUrl}
              alt="Patient registration QR code"
              className="w-[300px] h-[300px]"
            />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Patients can scan this QR code to register themselves on the portal
          </p>
          <p className="text-xs text-muted-foreground">
            Registration URL: {registrationUrl}
          </p>
        </div>

        <DialogFooter className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={downloadQRCodePDF} className="gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
