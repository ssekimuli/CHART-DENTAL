
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ToothIcon } from "@/components/icons/tooth-icon";
import { login } from "@/lib/api";
import { setCurrentUser } from "@/lib/user";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Please enter both email and password.",
      });
      return;
    }
    
    const loggedInUser = await login(email, password);

    if (loggedInUser) {
       setCurrentUser(loggedInUser);
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
  };

  const handleGoogleSignIn = async () => {
    // In a real app, this would trigger the Google Sign-In flow.
    // For this prototype, we'll log in as the default super admin.
    const loggedInUser = await login("lisa.cuddy@example.com", "password");
     if (loggedInUser) {
        setCurrentUser(loggedInUser);
        toast({
            title: "Login Successful",
            description: `Welcome back, ${loggedInUser.name}!`,
        });
        router.push("/dashboard");
    }
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
            <h1 className="text-3xl font-bold">Login</h1>
            <p className="text-balance text-muted-foreground">
              Enter your email below to login to your account
            </p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="ml-auto inline-block text-sm underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button type="submit" className="w-full" onClick={handleLogin}>
              Login
            </Button>
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
              Login with Google
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <a href="#" className="underline">
              Sign up
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
