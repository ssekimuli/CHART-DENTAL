
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ToothIcon } from "@/components/icons/tooth-icon";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [identifier, setIdentifier] = useState("");

  const handleSendOTP = () => {
    if (!identifier) {
      toast({
        variant: "destructive",
        title: "Input Required",
        description: "Please enter your email or phone number.",
      });
      return;
    }
    
    // In a real app, you would call an API to send the OTP.
    // For this prototype, we'll just navigate to the next step.
    toast({
      title: "OTP Sent",
      description: `An OTP has been sent to ${identifier}.`,
    });
    router.push(`/verify-otp?id=${encodeURIComponent(identifier)}`);
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
       <div className="hidden bg-gradient-to-br from-gray-900 to-blue-900 lg:flex flex-col items-center justify-center p-10 text-white">
        <div className="flex flex-col items-center justify-center gap-6 text-center">
            <div className="relative w-64 h-64">
                <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-2xl"></div>
                <ToothIcon className="w-64 h-64 text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)]" />
            </div>
          <h1 className="text-5xl font-bold tracking-tight">
            <span className="text-blue-400">Dentio</span>
          </h1>
          <p className="max-w-sm text-gray-300">
            The modern, AI-powered solution for dental practice management. Streamline your workflow and focus on what matters most—your patients.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center py-12 bg-background">
        <div className="mx-auto grid w-[380px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Forgot Password</h1>
            <p className="text-balance text-muted-foreground">
              Enter your email or phone number to receive a one-time password (OTP).
            </p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="identifier">Email or Phone Number</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="m@example.com or +1234567890"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
              />
            </div>
            <Button type="submit" className="w-full" onClick={handleSendOTP}>
              Send OTP
            </Button>
          </div>
           <div className="mt-4 text-center text-sm">
            Remember your password?{" "}
            <Link href="/login" className="underline">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
