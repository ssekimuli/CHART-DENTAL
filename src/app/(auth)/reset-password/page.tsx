
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useToast } from "@/hooks/use-toast";
import { ToothIcon } from "@/components/icons/tooth-icon";
import Link from "next/link";

function ResetPasswordComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const identifier = searchParams.get('id');

  const handleResetPassword = () => {
    if (!password || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "Input Required",
        description: "Please enter and confirm your new password.",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords Do Not Match",
        description: "Please ensure both passwords are the same.",
      });
      return;
    }

    // In a real app, you'd call an API to update the password for the user associated with `identifier`.
    toast({
      title: "Password Reset Successful",
      description: "Your password has been changed. You can now log in.",
    });
    router.push("/login");
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
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Reset Password</h1>
            <p className="text-balance text-muted-foreground">
              Enter a new password for your account associated with {identifier}.
            </p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password">New Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input 
                id="confirm-password" 
                type="password" 
                required 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
              />
            </div>
            <Button type="submit" className="w-full" onClick={handleResetPassword}>
              Reset Password
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordComponent />
        </Suspense>
    )
}
