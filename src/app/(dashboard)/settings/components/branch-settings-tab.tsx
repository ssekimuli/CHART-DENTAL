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
import { getBranchSettings, updateBranchSettings, topUpBranchCredits, verifyAndUpdateTopUp } from "@/lib/api";
import { Loader2, MessageSquare, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const topUpSchema = z.object({
  type: z.enum(["sms", "whatsapp"]),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  phone: z.string().min(1, "Phone is required").regex(/^\+/, "Must start with country code (+)"),
  provider: z.enum(["iotec", "card"]),
});

function CheckoutForm({ clientSecret, reference, type, amount, phone, provider, onSuccess, onCancel }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { selectedBranch } = useBranch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !selectedBranch) return;

    setIsProcessing(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: error.message || "Something went wrong.",
      });
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      try {
        await verifyAndUpdateTopUp(selectedBranch.id, type, amount, phone, provider, reference);
        onSuccess();
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: "Payment succeeded but failed to update balance.",
        });
        setIsProcessing(false);
      }
    } else {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <PaymentElement />
      <div className="flex gap-2 justify-end mt-4">
        <Button variant="outline" type="button" onClick={onCancel} disabled={isProcessing}>Cancel</Button>
        <Button type="submit" disabled={isProcessing || !stripe || !elements}>
          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Pay Now
        </Button>
      </div>
    </form>
  );
}

export function BranchSettingsTab() {
  const { toast } = useToast();
  const { selectedBranch } = useBranch();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isToppingUp, setIsToppingUp] = useState(false);
  const [stripeData, setStripeData] = useState<{ clientSecret: string, publishableKey: string, reference: string, formData: any } | null>(null);
  
  const [settings, setSettings] = useState<any>(null);
  
  const form = useForm<z.infer<typeof topUpSchema>>({
    resolver: zodResolver(topUpSchema),
    defaultValues: {
      type: "sms",
      amount: 100,
      phone: "",
      provider: "iotec",
    },
  });
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

  const openTopUpModal = (type: "sms" | "whatsapp") => {
    form.reset({ type, amount: 100, phone: "", provider: "iotec" });
    setIsTopUpOpen(true);
  };

  const onSubmitTopUp = async (data: z.infer<typeof topUpSchema>) => {
    if (!selectedBranch) return;
    try {
      setIsToppingUp(true);
      const res: any = await topUpBranchCredits(
        selectedBranch.id, 
        data.type, 
        data.amount, 
        data.phone, 
        data.provider,
        () => {
          toast({
            title: "Action Required",
            description: "Please check your phone and enter your Mobile Money PIN to approve the transaction.",
            duration: 15000,
          });
        }
      );
      
      if (res && res.requiresAction) {
         setStripeData({
           clientSecret: res.clientSecret,
           publishableKey: res.publishableKey,
           reference: res.reference,
           formData: data
         });
         return;
      }

      toast({
        title: "Top-up Successful",
        description: `Added ${data.amount} ${data.type} credits to branch.`,
      });
      setIsTopUpOpen(false);
      form.reset();
      fetchSettings(); // Refresh balances
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process top-up.",
      });
    } finally {
      setIsToppingUp(false);
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
            <Button onClick={() => openTopUpModal('sms')} variant="outline">
              Top Up SMS
            </Button>
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
            <Button onClick={() => openTopUpModal('whatsapp')} variant="outline">
              Top Up WhatsApp
            </Button>
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

      <Dialog open={isTopUpOpen} onOpenChange={(open) => {
        setIsTopUpOpen(open);
        if (!open) setStripeData(null);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Top Up Credits</DialogTitle>
            <DialogDescription>
              Purchase credits for SMS or WhatsApp notifications.
            </DialogDescription>
          </DialogHeader>
          
          {stripeData ? (
             <Elements stripe={loadStripe(stripeData.publishableKey)} options={{ clientSecret: stripeData.clientSecret }}>
               <CheckoutForm 
                 {...stripeData.formData} 
                 reference={stripeData.reference} 
                 onSuccess={() => {
                   toast({ title: "Success", description: "Top up successful." });
                   setStripeData(null);
                   setIsTopUpOpen(false);
                   form.reset();
                   fetchSettings();
                 }}
                 onCancel={() => setStripeData(null)}
               />
             </Elements>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitTopUp)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter amount" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Provider</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="iotec">Mobile Money (iotec)</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <PhoneInput
                          international
                          defaultCountry="UG"
                          placeholder="Enter phone number"
                          value={field.value as any}
                          onChange={field.onChange}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 [&>input]:bg-transparent [&>input]:border-none [&>input]:outline-none [&>input]:ml-2"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isToppingUp}>
                  {isToppingUp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Payment
                </Button>
              </DialogFooter>
            </form>
          </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
