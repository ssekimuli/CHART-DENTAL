
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
import { sendLabOrder, updateLabOrderStatus } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function LabTable({ data, onDataChange }: { data: LaboratoryOrder[]; onDataChange?: (updatedData: LaboratoryOrder[]) => void }) {
    const [orders, setOrders] = useState<LaboratoryOrder[]>(data);

    const getStatusVariant = (status: "Received" | "In Production" | "Ready for Delivery" | "Delivered" | "Cancelled") => {
        switch (status) {
          case "Delivered":
            return "secondary";
          case "Received":
          case "In Production":
          case "Ready for Delivery":
            return "default";
          case "Cancelled":
            return "destructive";
        }
    };

    const handleStatusChange = (updatedOrder: LaboratoryOrder) => {
        const updatedOrders = orders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
        setOrders(updatedOrders);
        onDataChange?.(updatedOrders);
    };

    React.useEffect(() => {
        setOrders(data);
    }, [data]);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client Name</TableHead>
            <TableHead>Phone/Email</TableHead>
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
          {orders.map((order) => (
            <TableRow
              key={order.id}
            >
              <TableCell className="font-medium">{order.client?.name || '-'}</TableCell>
              <TableCell>
                <div className="space-y-0.5 text-sm">
                  {order.client?.phone && <div>{order.client.phone}</div>}
                  {order.client?.email && <div className="text-muted-foreground">{order.client.email}</div>}
                </div>
              </TableCell>
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
                  <LabOrderActions order={order} onStatusChange={handleStatusChange} />
              </TableCell>
            </TableRow>
          ))}
           {orders.length === 0 && (
                <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                        No lab orders found.
                    </TableCell>
                </TableRow>
            )}
        </TableBody>
      </Table>
    </div>
  );
}

function LabOrderActions({ order, onStatusChange }: { order: LaboratoryOrder; onStatusChange?: (updatedOrder: LaboratoryOrder) => void }) {
    const { toast } = useToast();
    const [isSending, setIsSending] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string>(order.status);
    const [customChannel, setCustomChannel] = useState<'email' | 'whatsapp' | 'sms'>('email');
    const [customMessage, setCustomMessage] = useState("");

    const getStatusDescription = (status: string) => {
        switch (status) {
            case 'Received':
                return 'Review the order and confirm pricing.';
            case 'In Production':
                return 'Generate and send the invoice.';
            case 'Ready for Delivery':
                return 'Production is finished.';
            case 'Delivered':
                return 'Order delivered to the clinic.';
            case 'Cancelled':
                return 'Order has been cancelled.';
            default:
                return '';
        }
    };

    const handleStatusChange = async () => {
        if (selectedStatus === order.status) {
            setIsStatusDialogOpen(false);
            return;
        }

        try {
            setIsUpdatingStatus(true);
            const updatedOrder = await updateLabOrderStatus(order.id, selectedStatus);

            const isMovingToProduction = order.status !== 'In Production' && selectedStatus === 'In Production';
            const isCancelling = selectedStatus === 'Cancelled';

            if (isMovingToProduction) {
                toast({
                    title: "Status Updated",
                    description: `Lab order moved to "In Production". Invoice has been generated and sent to the client.`,
                });
            } else if (isCancelling) {
                toast({
                    title: "Order Cancelled",
                    description: `Lab order has been cancelled. Associated invoice has been voided and client has been notified.`,
                });
            } else {
                toast({
                    title: "Status Updated",
                    description: `Lab order status updated to "${selectedStatus}".`,
                });
            }

            setIsStatusDialogOpen(false);
            onStatusChange?.(updatedOrder);
        } catch (error: any) {
            setSelectedStatus(order.status);
            toast({
                variant: "destructive",
                title: "Failed to update status",
                description: error?.response?.data?.error || "An unexpected error occurred",
            });
        } finally {
            setIsUpdatingStatus(false);
        }
    };

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
                <Button variant="ghost" className="h-8 w-8 p-0" disabled={isSending || isUpdatingStatus}>
                    {isSending || isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsStatusDialogOpen(true)}>
                    Update Status
                </DropdownMenuItem>
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

        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Update Lab Order Status</DialogTitle>
                    <DialogDescription>
                        Change the status of this lab order. Current status: <strong>{order.status}</strong>
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-3">
                        <Label>Select New Status</Label>
                        <div className="space-y-2">
                            {['Received', 'In Production', 'Ready for Delivery', 'Delivered', 'Cancelled'].map((status) => (
                                <div
                                    key={status}
                                    onClick={() => setSelectedStatus(status)}
                                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                        selectedStatus === status
                                            ? 'bg-blue-50 border-blue-500'
                                            : 'bg-white border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            checked={selectedStatus === status}
                                            onChange={() => setSelectedStatus(status)}
                                            className="cursor-pointer"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{status}</p>
                                            <p className="text-xs text-gray-600">{getStatusDescription(status)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleStatusChange} disabled={isUpdatingStatus || selectedStatus === order.status}>
                        {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Status
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}
