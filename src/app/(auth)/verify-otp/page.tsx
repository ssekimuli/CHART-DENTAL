
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useToast } from "@/hooks/use-toast";
import { ToothIcon } from "@/components/icons/tooth-icon";
import Link from "next/link";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

function VerifyOTPComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [otp, setOtp] = useState("123456"); // Pre-filled for prototype

  const identifier = searchParams.get('id');

  const handleVerifyOTP = () => {
    if (otp.length < 6) {
      toast({
        variant: "destructive",
        title: "Invalid OTP",
        description: "Please enter the 6-digit OTP.",
      });
      return;
    }
    
    // In a real app, you would verify the OTP against a backend service.
    // For this prototype, any 6-digit OTP is considered valid.
    toast({
      title: "OTP Verified",
      description: "You can now reset your password.",
    });
    router.push(`/reset-password?id=${encodeURIComponent(identifier || '')}`);
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
            <span className="text-gray-300">DentalChart</span>
            <br/>
            <span className="text-blue-400">PRO</span>
          </h1>
          <p className="max-w-sm text-gray-300">
            The modern, AI-powered solution for dental practice management. Streamline your workflow and focus on what matters most—your patients.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center py-12 bg-background">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Verify OTP</h1>
            <p className="text-balance text-muted-foreground">
              Enter the 6-digit code sent to {identifier}.
            </p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="otp">One-Time Password</Label>
               <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(value) => setOtp(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
            </div>
            <Button type="submit" className="w-full" onClick={handleVerifyOTP}>
              Verify & Proceed
            </Button>
          </div>
           <div className="mt-4 text-center text-sm">
            Didn't receive the code?{" "}
            <Link href="/forgot-password" className="underline">
              Request a new one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function VerifyOTPPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyOTPComponent />
    </Suspense>
  )
}
