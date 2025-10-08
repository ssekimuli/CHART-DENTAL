
"use client";

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
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = () => {
    // In a real app, you'd have validation here.
    toast({
      title: "Login Successful",
      description: "Welcome back, Dr. Cuddy!",
    });
    router.push('/dashboard');
  }

  return (
     <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
       <div className="hidden bg-muted lg:block">
         <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <Image
                src="https://picsum.photos/seed/logo/100/100"
                alt="DentalChart Pro Logo"
                width={100}
                height={100}
                className="rounded-full"
                data-ai-hint="logo"
            />
            <h1 className="text-4xl font-bold text-primary-foreground">
              DentalChart Pro
            </h1>
            <p className="text-muted-foreground">The modern solution for dental practice management.</p>
        </div>
      </div>
      <div className="flex items-center justify-center py-12">
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
                defaultValue="lisa.cuddy@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <a
                  href="#"
                  className="ml-auto inline-block text-sm underline"
                >
                  Forgot your password?
                </a>
              </div>
              <Input 
                id="password" 
                type="password" 
                defaultValue="password" 
                required 
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button type="submit" className="w-full" onClick={handleLogin}>
              Login
            </Button>
            <Button variant="outline" className="w-full" onClick={handleLogin}>
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
