"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Download, Loader2 } from "lucide-react";
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
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && qrCanvasRef.current) {
      generateQRCode();
    }
  }, [isOpen]);

  const generateQRCode = async () => {
    try {
      // Dynamic import of QR code library
      const QRCode = (await import("qrcode")).default;

      const cleanBaseUrl = baseUrl.replace(/\/api\/?$/, "");
      const registrationUrl = patientId
        ? `${cleanBaseUrl}/self-register?patientId=${patientId}`
        : `${cleanBaseUrl}/self-register`;

      // Generate QR code on canvas
      if (qrCanvasRef.current) {
        await QRCode.toCanvas(qrCanvasRef.current, registrationUrl, {
          errorCorrectionLevel: "H",
          type: "image/png",
          quality: 0.95,
          margin: 1,
          width: 300,
        });
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
    }
  };

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
      };

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
            <canvas ref={qrCanvasRef} />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Patients can scan this QR code to register themselves on the portal
          </p>
          <p className="text-xs text-muted-foreground">
            Registration URL: {baseUrl.replace(/\/api\/?$/, "")}/self-register
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
