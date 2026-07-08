
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ToothIcon } from "@/components/icons/tooth-icon";
import { login } from "@/lib/api";
import Link from "next/link";
import axios from "axios";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("lisa.cuddy@example.com");
  const [password, setPassword] = useState("password");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Please enter both email and password.",
      });
      setIsLoading(false);
      return;
    }
    
    try {
      const loggedInUser = await login(email, password);

      if (loggedInUser) {
        toast({
          title: "Login Successful",
          description: `Welcome back, ${loggedInUser.name}!`,
        });
        router.push("/dashboard");
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid email or password.",
        });
      }
    } catch (error) {
       if (!axios.isAxiosError(error) || error.response) {
         toast({
            variant: "destructive",
            title: "Login Error",
            description: "An unexpected error occurred. Please try again.",
          });
       }
    } finally {
        setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const loggedInUser = await login("lisa.cuddy@example.com", "password");
      if (loggedInUser) {
          toast({
              title: "Login Successful",
              description: `Welcome back, ${loggedInUser.name}!`,
          });
          router.push("/dashboard");
      } else {
         toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Could not log in with default user.",
         });
      }
    } catch (error) {
       if (!axios.isAxiosError(error) || error.response) {
         toast({
          variant: "destructive",
          title: "Login Error",
          description: "An unexpected error occurred. Please try again.",
         });
       }
    } finally {
        setIsLoading(false);
    }
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
              The modern solution for dental practice management. Streamline clinical workflows and focus on what matters most—your patients.
            </p>
          </div>
        </div>
      </div>

      {/* Login Form Section */}
      <div className="flex items-center justify-center py-16 px-6 lg:col-span-7 bg-[#E0F7F7]">
        <div className="w-full max-w-md p-10 bg-white border border-[#A3D8E1]/30 rounded-3xl shadow-[0_20px_50px_rgba(44,63,77,0.08)] backdrop-blur-sm space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-[#2C3F4D] tracking-tight">
              Welcome Back
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access your dashboard
            </p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold text-[#2C3F4D] uppercase tracking-wider">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="pl-11 h-12 bg-gray-50/50 border-[#A3D8E1]/50 rounded-xl focus-visible:ring-[#008B89] focus-visible:border-[#008B89] transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-[#2C3F4D] uppercase tracking-wider">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#008B89] hover:underline font-semibold"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  disabled={isLoading}
                  className="pl-11 h-12 bg-gray-50/50 border-[#A3D8E1]/50 rounded-xl focus-visible:ring-[#008B89] focus-visible:border-[#008B89] transition-all"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4 pt-2">
              <Button 
                type="submit" 
                className="w-full h-12 bg-[#008B89] hover:bg-[#008B89]/90 text-white font-semibold rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#008B89]/20 active:translate-y-0 active:shadow-md transition-all flex items-center justify-center gap-2" 
                onClick={handleLogin} 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <Button 
                variant="outline" 
                className="w-full h-12 border-[#A3D8E1]/80 hover:bg-gray-50 text-[#2C3F4D] font-medium rounded-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2" 
                onClick={handleGoogleSignIn} 
                disabled={isLoading}
              >
                <svg className="h-5 w-5 mr-1" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.354 0 3.373 2.736 1.5 6.745l3.766 3.02z"
                  />
                  <path
                    fill="#34A853"
                    d="M16.04 15.342c-1.127.755-2.5 1.173-4.04 1.173a7.077 7.077 0 0 1-6.734-4.856L1.5 14.679C3.373 18.688 7.354 21.424 12 21.424c3.09 0 5.864-1.136 7.954-3.09l-3.913-2.992z"
                  />
                  <path
                    fill="#4285F4"
                    d="M22.5 12c0-.773-.082-1.5-.236-2.209H12v4.418h5.882a5.053 5.053 0 0 1-2.182 3.318l3.913 2.991C21.736 18.364 22.5 15.427 22.5 12z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.266 11.659A7.01 7.01 0 0 1 5 12c0 .345.027.682.082 1.018l-3.766 3.021A11.93 11.93 0 0 1 1 12c0-1.464.264-2.864.745-4.164l3.52 2.823z"
                  />
                </svg>
                Sign In with Google
              </Button>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
