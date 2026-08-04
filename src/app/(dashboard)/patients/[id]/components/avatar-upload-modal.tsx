"use client";

import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, UploadCloud, X } from "lucide-react";
import { updatePatientAvatar } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface AvatarUploadModalProps {
  patientId: string | number;
  isOpen: boolean;
  onClose: () => void;
  onAvatarUpdated: (newAvatarUrl: string) => void;
}

export function AvatarUploadModal({ patientId, isOpen, onClose, onAvatarUpdated }: AvatarUploadModalProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [mode, setMode] = useState<"choose" | "camera" | "preview">("choose");
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      setMode("camera");
    } catch (err) {
      toast({ title: "Error", description: "Could not access camera.", variant: "destructive" });
    }
  };

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  }, [cameraStream]);

  const handleCancelCamera = () => {
    stopCamera();
    setMode("choose");
  };

  const handleCancelPreview = () => {
    setPreviewFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setMode("choose");
  };

  // Stop camera when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
  }, [isOpen, stopCamera]);

  // Attach stream to video element once it is mounted
  React.useEffect(() => {
    if (mode === "camera" && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [mode, cameraStream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
            const url = URL.createObjectURL(blob);
            setPreviewFile(file);
            setPreviewUrl(url);
            stopCamera();
            setMode("preview");
          }
        }, "image/jpeg", 0.9);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewFile(file);
      setPreviewUrl(url);
      setMode("preview");
    }
  };

  const confirmUpload = async () => {
    if (previewFile) {
        await uploadFile(previewFile);
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      const res = await updatePatientAvatar(patientId, file);
      toast({ title: "Success", description: "Avatar updated successfully." });
      onAvatarUpdated(res.avatar);
      onClose();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update avatar.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Profile Picture</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {mode === "choose" ? (
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-32 flex flex-col items-center justify-center gap-2 border-dashed"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="h-8 w-8 text-muted-foreground" />
                <span>Upload File</span>
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
              />
              <Button
                variant="outline"
                className="h-32 flex flex-col items-center justify-center gap-2 border-dashed"
                onClick={startCamera}
              >
                <Camera className="h-8 w-8 text-muted-foreground" />
                <span>Take Photo</span>
              </Button>
            </div>
          ) : mode === "camera" ? (
            <div className="flex flex-col gap-4">
              <div className="relative rounded-md overflow-hidden bg-black aspect-video flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-white bg-black/50 hover:bg-black/70"
                  onClick={handleCancelCamera}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <Button onClick={capturePhoto} disabled={isUploading} className="w-full">
                Capture Photo
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="relative rounded-md overflow-hidden bg-black aspect-square max-h-[300px] flex items-center justify-center mx-auto w-full">
                {previewUrl && (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Button variant="outline" onClick={handleCancelPreview} disabled={isUploading}>
                  Cancel
                </Button>
                <Button onClick={confirmUpload} disabled={isUploading}>
                  {isUploading ? "Uploading..." : "Confirm & Upload"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
