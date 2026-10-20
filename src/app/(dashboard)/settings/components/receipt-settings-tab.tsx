"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Receipt, RefreshCw, CheckCircle2 } from "lucide-react";
import { getFacilityReceiptSettings, updateFacilityReceiptSettings, FacilityReceiptSettings } from "@/lib/api";

export function ReceiptSettingsTab() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<FacilityReceiptSettings>({
    clinic_name: "",
    subtitle: "",
    address: "",
    phone: "",
    email: "",
    receipt_prefix: "REC-",
    currency: "USD",
    receipt_footer: "",
  });

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const data = await getFacilityReceiptSettings();
      setFormData({
        clinic_name: data.clinic_name || "",
        subtitle: data.subtitle || "",
        address: data.address || "",
        phone: data.phone || "",
        email: data.email || "",
        receipt_prefix: data.receipt_prefix || "REC-",
        currency: data.currency || "USD",
        receipt_footer: data.receipt_footer || "",
        updated_at: data.updated_at,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error Loading Settings",
        description: error?.response?.data?.message || "Failed to load facility receipt configuration.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (field: keyof FacilityReceiptSettings, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const response = await updateFacilityReceiptSettings(formData);
      toast({
        title: "Settings Saved",
        description: response.message || "Facility receipt information updated successfully.",
      });
      if (response.data) {
        setFormData((prev) => ({
          ...prev,
          ...response.data,
        }));
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error?.response?.data?.message || "Failed to save receipt settings.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-sm">Loading receipt settings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Configuration Form */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Facility Receipt Information</CardTitle>
                <CardDescription>
                  Configure header, contact, numbering prefix, and footer terms printed or sent on receipts.
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchSettings} disabled={isLoading || isSaving}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form id="receipt-settings-form" onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="receipt-clinic-name">Facility / Clinic Name</Label>
                <Input
                  id="receipt-clinic-name"
                  placeholder="e.g. Smile Dental Specialists"
                  value={formData.clinic_name || ""}
                  onChange={(e) => handleChange("clinic_name", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt-subtitle">Tagline / Subtitle</Label>
                <Input
                  id="receipt-subtitle"
                  placeholder="e.g. Comprehensive Dental Care & Surgery"
                  value={formData.subtitle || ""}
                  onChange={(e) => handleChange("subtitle", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="receipt-address">Facility Address</Label>
              <Input
                id="receipt-address"
                placeholder="e.g. Plot 14, High Street, Suite 201"
                value={formData.address || ""}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="receipt-phone">Contact Phone</Label>
                <Input
                  id="receipt-phone"
                  placeholder="e.g. +256 700 123456"
                  value={formData.phone || ""}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt-email">Billing / Contact Email</Label>
                <Input
                  id="receipt-email"
                  type="email"
                  placeholder="e.g. billing@smiledental.com"
                  value={formData.email || ""}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="receipt-prefix">Receipt Number Prefix</Label>
                <Input
                  id="receipt-prefix"
                  placeholder="e.g. REC-"
                  value={formData.receipt_prefix || ""}
                  onChange={(e) => handleChange("receipt_prefix", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  New invoices will generate receipt numbers formatted like: <code>{formData.receipt_prefix || "REC-"}ABC12345</code>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt-currency">Receipt Currency</Label>
                <Input
                  id="receipt-currency"
                  placeholder="e.g. USD, UGX, EUR"
                  value={formData.currency || ""}
                  onChange={(e) => handleChange("currency", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="receipt-footer">Receipt Footer / Terms & Notes</Label>
              <Textarea
                id="receipt-footer"
                rows={3}
                placeholder="e.g. Thank you for your visit. Goods and services rendered are non-refundable."
                value={formData.receipt_footer || ""}
                onChange={(e) => handleChange("receipt_footer", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Appears at the bottom of printed thermal/A4 slips and digital receipts.
              </p>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <p className="text-xs text-muted-foreground">
            {formData.updated_at ? `Last updated: ${new Date(formData.updated_at).toLocaleString()}` : ""}
          </p>
          <Button type="submit" form="receipt-settings-form" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Receipt Settings
          </Button>
        </CardFooter>
      </Card>

      {/* Live Preview Card */}
      <Card className="border-dashed bg-muted/20">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Receipt Header Preview
          </CardTitle>
          <CardDescription className="text-xs">
            Live preview of how header and footer metadata will appear on client receipts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-white dark:bg-card p-4 shadow-sm text-center font-mono text-xs space-y-2">
            <div className="font-bold text-sm tracking-wide uppercase text-foreground">
              {formData.clinic_name || "CLINIC / FACILITY NAME"}
            </div>
            {formData.subtitle && (
              <div className="text-muted-foreground text-[11px] italic">
                {formData.subtitle}
              </div>
            )}
            <div className="text-muted-foreground text-[11px] border-b pb-2 space-y-0.5">
              {formData.address && <div>{formData.address}</div>}
              {formData.phone && <div>Tel: {formData.phone}</div>}
              {formData.email && <div>Email: {formData.email}</div>}
            </div>

            <div className="py-2 text-left space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Receipt #:</span>
                <span className="font-bold">{formData.receipt_prefix || "REC-"}89412A</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Currency:</span>
                <span>{formData.currency || "USD"}</span>
              </div>
            </div>

            <div className="border-t pt-2 text-[11px] text-muted-foreground italic">
              {formData.receipt_footer || "Thank you for choosing our facility."}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
