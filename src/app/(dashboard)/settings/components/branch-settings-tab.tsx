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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useBranch } from "@/context/branch-context";
import { getBranchSettings, updateBranchSettings, topUpBranchCredits } from "@/lib/api";
import { Loader2, MessageSquare, Phone } from "lucide-react";

export function BranchSettingsTab() {
  const { toast } = useToast();
  const { selectedBranch } = useBranch();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isToppingUpSms, setIsToppingUpSms] = useState(false);
  const [isToppingUpWa, setIsToppingUpWa] = useState(false);
  
  const [settings, setSettings] = useState<any>(null);
  const [smsAmount, setSmsAmount] = useState("");
  const [waAmount, setWaAmount] = useState("");
  const [clinicName, setClinicName] = useState("");

  const fetchSettings = async () => {
    if (!selectedBranch) return;
    try {
      setIsLoading(true);
      const data = await getBranchSettings(selectedBranch.id);
      setSettings(data);
      if (data.clinic_name) {
        setClinicName(data.clinic_name);
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load branch settings.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [selectedBranch]);

  const handleToggle = (module: string, channel: string, checked: boolean) => {
    setSettings((prev: any) => {
      const newSettings = { ...prev };
      if (!newSettings.notifications) newSettings.notifications = {};
      if (!newSettings.notifications[module]) newSettings.notifications[module] = {};
      newSettings.notifications[module][channel] = checked;
      return newSettings;
    });
  };

  const handleSaveSettings = async () => {
    if (!selectedBranch) return;
    try {
      setIsSaving(true);
      await updateBranchSettings(selectedBranch.id, {
        clinic_name: clinicName,
        notifications: settings?.notifications
      });
      toast({
        title: "Settings Saved",
        description: "Notification preferences updated successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTopUp = async (type: 'sms' | 'whatsapp') => {
    if (!selectedBranch) return;
    const amount = type === 'sms' ? parseInt(smsAmount) : parseInt(waAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: "destructive", description: "Enter a valid amount." });
      return;
    }
    
    try {
      type === 'sms' ? setIsToppingUpSms(true) : setIsToppingUpWa(true);
      await topUpBranchCredits(selectedBranch.id, type, amount);
      toast({
        title: "Top-up Successful",
        description: `Added ${amount} ${type} credits to branch.`,
      });
      type === 'sms' ? setSmsAmount("") : setWaAmount("");
      fetchSettings(); // Refresh balances
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process top-up.",
      });
    } finally {
      type === 'sms' ? setIsToppingUpSms(false) : setIsToppingUpWa(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const modules = [
    { id: 'appointments_created', label: 'New Appointment Booked', description: 'Send confirmation when a new appointment is scheduled' },
    { id: 'appointments_upcoming', label: 'Upcoming Appointment Reminder', description: 'Send reminders before the scheduled appointment time' },
    { id: 'patient_created', label: 'Welcome New Patient', description: 'Send a welcome message when a new patient profile is created' },
    { id: 'staff_created', label: 'New Staff Onboarding', description: 'Send welcome and login credentials to new staff' },
    { id: 'auth_forgot_password', label: 'Forgot Password / OTP', description: 'Send reset instructions or OTP when password is forgotten' },
    { id: 'auth_reset_password', label: 'Password Reset Success', description: 'Confirm that the password was successfully reset' },
    { id: 'billing', label: 'Billing & Invoices', description: 'Send new invoices and payment links' },
    { id: 'payment_success', label: 'Payment Receipt', description: 'Send confirmation when a payment is received' },
    { id: 'marketing', label: 'Marketing Campaigns', description: 'Allow sending promotional and bulk messages' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SMS Credits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> SMS Credits
            </CardTitle>
            <CardDescription>Current balance: <strong className="text-foreground">{settings?.sms_balance || 0}</strong></CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input 
                type="number" 
                placeholder="Amount to top up" 
                value={smsAmount}
                onChange={(e) => setSmsAmount(e.target.value)}
              />
              <Button onClick={() => handleTopUp('sms')} disabled={isToppingUpSms}>
                {isToppingUpSms ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Top Up'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Credits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" /> WhatsApp Credits
            </CardTitle>
            <CardDescription>Current balance: <strong className="text-foreground">{settings?.whatsapp_balance || 0}</strong></CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input 
                type="number" 
                placeholder="Amount to top up" 
                value={waAmount}
                onChange={(e) => setWaAmount(e.target.value)}
              />
              <Button onClick={() => handleTopUp('whatsapp')} disabled={isToppingUpWa}>
                {isToppingUpWa ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Top Up'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clinic Information</CardTitle>
          <CardDescription>This name will be used in SMS, WhatsApp, and Email notifications.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label>Clinic Name</Label>
              <Input 
                value={clinicName} 
                onChange={(e) => setClinicName(e.target.value)} 
                placeholder="e.g. My Dental Clinic" 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Configure which modules can send automated messages.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {modules.map(module => (
            <div key={module.id} className="rounded-lg border p-4">
              <div className="mb-4">
                <h4 className="text-base font-semibold">{module.label}</h4>
                <p className="text-sm text-muted-foreground">{module.description}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id={`email-${module.id}`}
                    checked={settings?.notifications?.[module.id]?.email ?? true}
                    onCheckedChange={(c) => handleToggle(module.id, 'email', c)}
                  />
                  <Label htmlFor={`email-${module.id}`}>Enable Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id={`sms-${module.id}`}
                    checked={settings?.notifications?.[module.id]?.sms || false}
                    onCheckedChange={(c) => handleToggle(module.id, 'sms', c)}
                  />
                  <Label htmlFor={`sms-${module.id}`}>Enable SMS</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id={`wa-${module.id}`}
                    checked={settings?.notifications?.[module.id]?.whatsapp || false}
                    onCheckedChange={(c) => handleToggle(module.id, 'whatsapp', c)}
                  />
                  <Label htmlFor={`wa-${module.id}`}>Enable WhatsApp</Label>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveSettings} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Preferences
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
