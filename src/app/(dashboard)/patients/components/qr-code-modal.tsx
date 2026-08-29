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
      if (!qrImageRef.current) return;

      // Convert image to data URL
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.crossOrigin = "anonymous";
      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        const imageDataUrl = canvas.toDataURL("image/png");

        // Create a new container with the data URL image
        const downloadElement = document.createElement("div");
        downloadElement.style.padding = "20px";
        downloadElement.style.textAlign = "center";
        downloadElement.style.backgroundColor = "white";

        const imageEl = document.createElement("img");
        imageEl.src = imageDataUrl;
        imageEl.style.width = "300px";
        imageEl.style.height = "300px";
        imageEl.style.marginBottom = "20px";

        const textEl = document.createElement("div");
        textEl.innerHTML = `
          <h2 style="font-size: 18px; margin-bottom: 10px; font-weight: bold;">Patient Registration QR Code</h2>
          <p style="font-size: 12px; color: #666; margin-bottom: 10px;">Scan to register</p>
          <p style="font-size: 10px; color: #999;">${registrationUrl}</p>
        `;

        downloadElement.appendChild(imageEl);
        downloadElement.appendChild(textEl);

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

        html2pdf().set(opt).from(downloadElement).save();

        toast({
          title: "Success",
          description: "QR code downloaded successfully",
        });
      };

      img.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to load QR code image",
          variant: "destructive",
        });
      };

      img.src = qrCodeUrl;
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
