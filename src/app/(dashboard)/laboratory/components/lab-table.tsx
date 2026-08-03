
"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { LaboratoryOrder } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Mail, MessageCircle, Loader2, Send, Smartphone } from "lucide-react";
import { sendLabOrder } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function LabTable({ data }: { data: LaboratoryOrder[] }) {
    const getStatusVariant = (status: "Sent" | "Received" | "Completed" | "Cancelled") => {
        switch (status) {
          case "Completed":
            return "secondary";
          case "Sent":
          case "Received":
            return "default";
          case "Cancelled":
            return "destructive";
        }
    };
    
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Doctor</TableHead>
            <TableHead>Lab</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sent Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((order) => (
            <TableRow
              key={order.id}
            >
              <TableCell className="font-medium">{order.patientName}</TableCell>
              <TableCell>{order.doctor?.name || '-'}</TableCell>
              <TableCell>{order.lab}</TableCell>
              <TableCell>{order.item} {order.tooth ? `(#${order.tooth})` : ''}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(order.status)}>
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell>{order.sentDate}</TableCell>
              <TableCell>{order.dueDate}</TableCell>
              <TableCell>
                  <LabOrderActions order={order} />
              </TableCell>
            </TableRow>
          ))}
           {data.length === 0 && (
                <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                        No lab orders found.
                    </TableCell>
                </TableRow>
            )}
        </TableBody>
      </Table>
    </div>
  );
}

function LabOrderActions({ order }: { order: LaboratoryOrder }) {
    const { toast } = useToast();
    const [isSending, setIsSending] = useState(false);
    const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
    const [customChannel, setCustomChannel] = useState<'email' | 'whatsapp' | 'sms'>('email');
    const [customMessage, setCustomMessage] = useState("");

    const handleSend = async (channel: 'email' | 'whatsapp' | 'sms', message?: string) => {
        try {
            setIsSending(true);
            await sendLabOrder(order.id, channel, message);
            toast({
                title: "Sent Successfully",
                description: `Lab order has been sent via ${channel}.`,
            });
            setIsCustomDialogOpen(false);
            setCustomMessage("");
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Failed to send",
                description: error?.response?.data?.error || "An unexpected error occurred",
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0" disabled={isSending}>
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleSend('email')}>
                    <Mail className="mr-2 h-4 w-4" /> Send Default via Email
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSend('whatsapp')}>
                    <MessageCircle className="mr-2 h-4 w-4 text-green-500" /> Send Default via WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSend('sms')}>
                    <Smartphone className="mr-2 h-4 w-4 text-blue-500" /> Send Default via SMS
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsCustomDialogOpen(true)}>
                    <Send className="mr-2 h-4 w-4" /> Send Custom Message
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Send Custom Message</DialogTitle>
                    <DialogDescription>
                        Send a custom update regarding this lab order.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Channel</Label>
                        <Select value={customChannel} onValueChange={(val: any) => setCustomChannel(val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select channel" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                <SelectItem value="sms">SMS</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Message</Label>
                        <Textarea 
                            placeholder="Type your custom message here..." 
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            rows={5}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCustomDialogOpen(false)}>Cancel</Button>
                    <Button onClick={() => handleSend(customChannel, customMessage)} disabled={isSending || !customMessage.trim()}>
                        {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Message
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}
