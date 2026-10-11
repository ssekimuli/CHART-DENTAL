"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { sendXrayRequestDocument } from "@/lib/api";
import type { XrayRequest, XrayAttachment } from "@/lib/types";
import {
  Mail,
  Send,
  Loader2,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Copy,
  Check,
  Building2,
  User,
} from "lucide-react";

interface XrayShareDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  record: XrayRequest | null;
  targetFile?: XrayAttachment | null;
  initialChannel?: "email" | "whatsapp";
}

function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

export function XrayShareDialog({
  isOpen,
  onOpenChange,
  record,
  targetFile,
  initialChannel = "email",
}: XrayShareDialogProps) {
  const { toast } = useToast();
  const [channel, setChannel] = useState<"email" | "whatsapp">(initialChannel);
  const [recipient, setRecipient] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Sync recipient and channel when modal opens or channel changes
  useEffect(() => {
    if (isOpen && record) {
      setChannel(initialChannel);
      const defaultEmail =
        record.patientRecord?.email ||
        (typeof record.patient === "object" ? (record.patient as any)?.email : "") ||
        "";
      const defaultPhone =
        record.patientRecord?.phone ||
        (typeof record.patient === "object" ? (record.patient as any)?.phone : "") ||
        "";

      setRecipient(initialChannel === "email" ? defaultEmail : defaultPhone.replace(/[^0-9]/g, ""));
      setCustomMessage("");
    }
  }, [isOpen, record, initialChannel]);

  // When user toggles between Email and WhatsApp tab
  const handleChannelChange = (newChannel: "email" | "whatsapp") => {
    setChannel(newChannel);
    if (!record) return;
    const defaultEmail =
      record.patientRecord?.email ||
      (typeof record.patient === "object" ? (record.patient as any)?.email : "") ||
      "";
    const defaultPhone =
      record.patientRecord?.phone ||
      (typeof record.patient === "object" ? (record.patient as any)?.phone : "") ||
      "";

    setRecipient(newChannel === "email" ? defaultEmail : defaultPhone.replace(/[^0-9]/g, ""));
  };

  if (!record) return null;

  const patientName =
    typeof record.patient === "string" && record.patient.trim()
      ? record.patient.trim()
      : record.patientRecord
      ? `${record.patientRecord.first_name || ""} ${record.patientRecord.last_name || ""}`.trim()
      : typeof record.patient === "object" && record.patient
      ? `${(record.patient as any).first_name || ""} ${(record.patient as any).last_name || ""}`.trim()
      : "Patient";

  const handleSendViaBackend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipient.trim()) {
      toast({
        title: "Recipient Required",
        description: `Please enter the ${channel === "email" ? "email address" : "WhatsApp phone number"}.`,
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const result = await sendXrayRequestDocument(record.id!, {
        channel,
        recipient: recipient.trim(),
        custom_message: customMessage.trim() || undefined,
        file_url: targetFile?.url || undefined,
        file_name: targetFile?.name || undefined,
      });

      if (result.success) {
        toast({
          title: "Document Sent",
          description: result.message || `Requisition details sent via ${channel === "email" ? "Email" : "WhatsApp"}.`,
        });
        onOpenChange(false);
      } else {
        toast({
          title: "Send Notice",
          description: result.message || "Failed to send through server. You can also open WhatsApp/Email directly.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error Sending",
        description: err?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Direct client launcher fallback
  const handleOpenClientDirectly = () => {
    if (channel === "whatsapp") {
      const cleanPhone = recipient.replace(/[^0-9]/g, "");
      const details = [
        `*Dental Radiology Requisition #${String(record.id).padStart(5, "0")}*`,
        `*Patient:* ${patientName}`,
        `*Facility:* ${record.facility}`,
        `*Scan Type:* ${record.xray_type || "Dental Imaging"}`,
        targetFile ? `*Attached File:* ${targetFile.name || "Scan"}\n🔗 ${targetFile.url}` : "",
        customMessage ? `\n*Note:* ${customMessage}` : "",
      ].filter(Boolean).join("\n");

      const waUrl = cleanPhone.length >= 9
        ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(details)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(details)}`;

      window.open(waUrl, "_blank", "noopener,noreferrer");
    } else {
      const subject = `Radiology Requisition #${String(record.id).padStart(5, "0")} - ${patientName}`;
      const body = [
        `Radiology Requisition Details:`,
        ``,
        `Patient: ${patientName}`,
        `Requisition #: ${String(record.id).padStart(5, "0")}`,
        `Facility: ${record.facility}`,
        `Investigation: ${record.xray_type || "Dental Imaging"}`,
        targetFile ? `\nAttached File Link:\n${targetFile.url}\n` : "",
        customMessage ? `\nNote:\n${customMessage}\n` : "",
      ].filter(Boolean).join("\n");

      window.location.href = `mailto:${recipient.trim()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  };

  const handleCopyLink = async () => {
    const url = targetFile?.url || window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      toast({ title: "Copied", description: "File link copied to clipboard." });
      setTimeout(() => setIsCopied(false), 2000);
    } catch {}
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="pb-3 border-b border-dashed border-slate-200 dark:border-slate-800">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Send className="h-4 w-4 text-teal-600" />
            Send Requisition & Files
          </DialogTitle>
          <DialogDescription className="text-xs">
            Send directly via backend service to patient or clinician email / WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSendViaBackend} className="space-y-4 pt-3 text-xs">
          {/* CHANNEL SELECTOR TABS */}
          <div className="flex rounded-md p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => handleChannelChange("email")}
              className={`flex-1 py-1.5 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                channel === "email"
                  ? "bg-white dark:bg-slate-950 text-sky-700 dark:text-sky-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Email</span>
            </button>
            <button
              type="button"
              onClick={() => handleChannelChange("whatsapp")}
              className={`flex-1 py-1.5 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                channel === "whatsapp"
                  ? "bg-white dark:bg-slate-950 text-emerald-700 dark:text-emerald-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <WhatsAppIcon className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>

          {/* ITEM SUMMARY CARD */}
          <div className="p-2.5 rounded-md bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-900/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-teal-600" />
                {patientName}
              </span>
              <Badge variant="outline" className="text-[10px] bg-white dark:bg-slate-950 font-mono">
                Req #{String(record.id).padStart(5, "0")}
              </Badge>
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-2">
              <span>{record.xray_type || "Imaging"}</span>
              <span>•</span>
              <span className="truncate max-w-[150px]">{record.facility}</span>
            </div>

            {targetFile && (
              <div className="mt-2 pt-1.5 border-t border-teal-200/40 dark:border-teal-900/40 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 truncate max-w-[220px]">
                  {targetFile.mime?.startsWith("image/") ? (
                    <ImageIcon className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                  ) : (
                    <FileText className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                  )}
                  <span className="font-semibold truncate">{targetFile.name || "Attached Scan"}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 shrink-0"
                >
                  {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>Copy Link</span>
                </button>
              </div>
            )}
          </div>

          {/* RECIPIENT INPUT */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {channel === "email" ? "Recipient Email Address" : "WhatsApp Phone Number (Intl format)"} <span className="text-rose-500">*</span>
            </Label>
            <Input
              type={channel === "email" ? "email" : "text"}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={channel === "email" ? "e.g. patient@example.com or doctor@clinic.com" : "e.g. 256701234567 or +2567..."}
              className="h-9 text-xs"
              required
            />
            <p className="text-[10px] text-muted-foreground">
              {channel === "email"
                ? "The recipient will receive an official requisition email with attachments."
                : "Enter phone number with country code (e.g. 2567... without leading 0)."}
            </p>
          </div>

          {/* CUSTOM MESSAGE TEXTAREA */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Custom Message / Note <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="e.g. Please find your requested dental imaging scan..."
              className="min-h-[65px] text-xs resize-none"
            />
          </div>

          {/* ACTION BUTTONS */}
          <DialogFooter className="pt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleOpenClientDirectly}
              className="text-[11px] text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 font-medium mr-auto"
              title="Launch external email app or WhatsApp directly"
            >
              <ExternalLink className="h-3 w-3" />
              <span>Open in {channel === "email" ? "Mail App" : "WhatsApp"}</span>
            </button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isSending}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSending || !recipient.trim()}
                className="h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                    Send via Backend
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
