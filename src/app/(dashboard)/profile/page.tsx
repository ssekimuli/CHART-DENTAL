
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCurrentUser, setCurrentUser } from "@/lib/user";
import type { CurrentUser } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
    const { toast } = useToast();
    const [user, setUser] = useState<CurrentUser | null>(null);

    useEffect(() => {
        setUser(getCurrentUser());
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user) return;
        const { id, value } = e.target;
        setUser({ ...user, [id]: value });
    }

    const handleSaveChanges = () => {
        if (user) {
            setCurrentUser(user);
            toast({
                title: "Profile Updated",
                description: "Your changes have been saved successfully.",
            });
        }
    }

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                Manage your personal account settings.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24 border">
                        <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person face" />
                        <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="avatar-file">Profile Picture</Label>
                        <Input id="avatar-file" type="file" />
                        <p className="text-xs text-muted-foreground">Upload a new photo.</p>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={user.name} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={user.email} onChange={handleInputChange} />
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSaveChanges}>Save Changes</Button>
            </CardFooter>
        </Card>
    );
}
