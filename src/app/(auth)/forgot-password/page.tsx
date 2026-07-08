
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ToothIcon } from "@/components/icons/tooth-icon";
import Link from "next/link";
import { Mail, ArrowLeft, ArrowRight, Phone } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = () => {
    if (!identifier) {
      toast({
        variant: "destructive",
        title: "Input Required",
        description: "Please enter your email or phone number.",
      });
      return;
    }
    
    setIsLoading(true);
    // Simulate sending OTP
    setTimeout(() => {
      toast({
        title: "OTP Sent",
        description: `An OTP has been sent to ${identifier}.`,
      });
      router.push(`/verify-otp?id=${encodeURIComponent(identifier)}`);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-12 overflow-hidden bg-[#E0F7F7]/30">
      {/* Brand/Hero Section */}
      <div className="hidden lg:flex lg:col-span-5 relative flex-col items-center justify-center p-12 text-white bg-[#2C3F4D]">
        {/* Animated Glow Rings */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-[#008B89]/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#5CC8D6]/15 rounded-full blur-[120px] animate-pulse"></div>
        
        {/* Floating Content Card */}
        <div className="relative flex flex-col items-center justify-center gap-8 text-center max-w-md p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
          <div className="relative w-44 h-44 flex items-center justify-center bg-white/10 rounded-full p-4 border border-white/20 shadow-inner">
            <ToothIcon className="w-32 h-32 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.2)] animate-bounce [animation-duration:3s]" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold tracking-tight">
              Dentio
            </h1>
            <p className="text-sm text-gray-300 leading-relaxed">
              Access support to recover your login. Your security is our priority. Get back to streamlining clinical workflows and serving your patients.
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Form Section */}
      <div className="flex items-center justify-center py-16 px-6 lg:col-span-7 bg-[#E0F7F7]">
        <div className="w-full max-w-md p-10 bg-white border border-[#A3D8E1]/30 rounded-3xl shadow-[0_20px_50px_rgba(44,63,77,0.08)] backdrop-blur-sm space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-[#2C3F4D] tracking-tight">
              Forgot Password
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter your email or phone number to receive a one-time password (OTP)
            </p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-xs font-semibold text-[#2C3F4D] uppercase tracking-wider">Email or Phone Number</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="identifier"
                  type="text"
                  placeholder="m@example.com or +1234567890"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                  disabled={isLoading}
                  className="pl-11 h-12 bg-gray-50/50 border-[#A3D8E1]/50 rounded-xl focus-visible:ring-[#008B89] focus-visible:border-[#008B89] transition-all"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-[#008B89] hover:bg-[#008B89]/90 text-white font-semibold rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#008B89]/20 active:translate-y-0 active:shadow-md transition-all flex items-center justify-center gap-2" 
              onClick={handleSendOTP}
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send OTP"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center text-sm">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm text-[#008B89] hover:underline font-semibold">
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
