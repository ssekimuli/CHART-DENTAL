
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
import { MoreHorizontal, Mail, MessageCircle, Loader2, Send, Smartphone, Package, FileText, Edit2, Trash2 } from "lucide-react";
import { sendLabOrder, updateLabOrderStatus } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function LabTable({ data, onDataChange, onEdit, onDelete }: { data: LaboratoryOrder[]; onDataChange?: (updatedData: LaboratoryOrder[]) => void; onEdit?: (order: LaboratoryOrder) => void; onDelete?: (orderId: number) => void }) {
    const [orders, setOrders] = useState<LaboratoryOrder[]>(data);

    const getStatusColor = (status: "Draft" | "Received" | "In Production" | "Ready for Delivery" | "Delivered" | "Cancelled") => {
        switch (status) {
          case "Draft":
            return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
          case "Received":
            return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
          case "In Production":
            return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
          case "Ready for Delivery":
            return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
          case "Delivered":
            return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
          case "Cancelled":
            return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
        }
    };

    const handleStatusChange = (updatedOrder: LaboratoryOrder) => {
        const updatedOrders = orders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
        setOrders(updatedOrders);
        onDataChange?.(updatedOrders);
    };

    const handleOrderUpdate = (updatedOrder: LaboratoryOrder) => {
        const updatedOrders = orders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
        setOrders(updatedOrders);
        onDataChange?.(updatedOrders);
    };

    React.useEffect(() => {
        setOrders(data);
    }, [data]);

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border-b border-slate-200 dark:border-slate-800">
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Client</TableHead>
            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Contact</TableHead>
            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Doctor</TableHead>
            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Item</TableHead>
            <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
            <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">Timeline</TableHead>
            <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow
              key={order.id}
              className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors border-b border-slate-200 dark:border-slate-800"
            >
              <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                <div className="flex items-center gap-2">
                  <span>{order.client?.name || '-'}</span>
                  {order.invoiceId && (
                    <Badge variant="outline" className="text-xs gap-1 py-0.5 px-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                      <FileText className="h-3 w-3" />
                      Invoice
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1 text-sm">
                  {order.client?.phone && <div className="text-slate-700 dark:text-slate-300">{order.client.phone}</div>}
                  {order.client?.email && <div className="text-slate-500 dark:text-slate-400 truncate text-xs">{order.client.email}</div>}
                </div>
              </TableCell>
              <TableCell className="text-slate-700 dark:text-slate-300">{order.doctorName || '-'}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="text-slate-700 dark:text-slate-300">{order.item}</div>
                  {order.tooth && <Badge variant="outline" className="text-xs">#{order.tooth}</Badge>}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={`font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <div>Sent: {order.sentDate || 'N/A'}</div>
                  <div>Due: {order.dueDate || 'N/A'}</div>
                </div>
              </TableCell>
              <TableCell className="text-right">
                  <LabOrderActions order={order} onStatusChange={handleStatusChange} onEdit={onEdit} onUpdate={handleOrderUpdate} onDelete={onDelete} />
              </TableCell>
            </TableRow>
          ))}
           {orders.length === 0 && (
                <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={8} className="h-24 text-center text-slate-500 dark:text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Package className="h-8 w-8 opacity-40" />
                          <p>No lab orders found. Create one to get started.</p>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </TableBody>
      </Table>
    </div>
  );
}

function LabOrderActions({ order, onStatusChange, onEdit, onUpdate, onDelete }: { order: LaboratoryOrder; onStatusChange?: (updatedOrder: LaboratoryOrder) => void; onEdit?: (order: LaboratoryOrder) => void; onUpdate?: (updatedOrder: LaboratoryOrder) => void; onDelete?: (orderId: number) => void }) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSending, setIsSending] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string>(order.status);
    const [customChannel, setCustomChannel] = useState<'email' | 'whatsapp' | 'sms'>('email');
    const [customMessage, setCustomMessage] = useState("");

    const getStatusDescription = (status: string) => {
        switch (status) {
            case 'Draft':
                return 'Order is in draft mode, not yet sent to lab.';
            case 'Received':
                return 'Review the order and confirm pricing.';
            case 'In Production':
                return 'This will generate and send an invoice for this lab order to the billing system.';
            case 'Ready for Delivery':
                return 'Lab work is complete and ready for pickup/delivery.';
            case 'Delivered':
                return 'Order has been delivered to the clinic.';
            case 'Cancelled':
                return 'Order has been cancelled.';
            default:
                return '';
        }
    };

    const getStatusDisplayLabel = (status: string) => {
        if (status === 'In Production') return 'Generate Invoice';
        return status;
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

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            const { deleteLabOrder } = await import('@/lib/api-lab-prices');
            await deleteLabOrder(order.id as number);

            toast({
                title: "Deleted Successfully",
                description: `Lab order #${order.id} has been deleted.`,
            });
            setIsDeleteDialogOpen(false);
            onDelete?.(order.id as number);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Failed to delete",
                description: error?.response?.data?.error || "An unexpected error occurred",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                  disabled={isSending || isUpdatingStatus}
                >
                    {isSending || isUpdatingStatus ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    ) : (
                      <MoreHorizontal className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="font-semibold">Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {order.invoiceId && (
                  <>
                    <DropdownMenuItem
                      onClick={() => router.push(`/billing/${order.invoiceId}`)}
                      className="cursor-pointer text-blue-600 dark:text-blue-400"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      View Invoice
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={() => onEdit?.(order)}
                  className="cursor-pointer"
                >
                    <Edit2 className="mr-2 h-4 w-4 text-slate-600 dark:text-slate-400" />
                    Edit Order
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsStatusDialogOpen(true)}
                  className="cursor-pointer"
                >
                    Update Status
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">Send Order</div>
                <DropdownMenuItem
                  onClick={() => handleSend('email')}
                  className="cursor-pointer"
                >
                    <Mail className="mr-2 h-4 w-4 text-blue-500" /> Email
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleSend('whatsapp')}
                  className="cursor-pointer"
                >
                    <MessageCircle className="mr-2 h-4 w-4 text-green-500" /> WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleSend('sms')}
                  className="cursor-pointer"
                >
                    <Smartphone className="mr-2 h-4 w-4 text-blue-600" /> SMS
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setIsCustomDialogOpen(true)}
                  className="cursor-pointer"
                >
                    <Send className="mr-2 h-4 w-4 text-slate-600" /> Custom Message
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="cursor-pointer text-red-600 dark:text-red-400"
                >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Order
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl">Send Custom Message</DialogTitle>
                    <DialogDescription>
                        Send a personalized message to the lab regarding this order.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label className="font-semibold">Communication Channel</Label>
                        <Select value={customChannel} onValueChange={(val: any) => setCustomChannel(val)}>
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select channel" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="email">
                                  <span className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" /> Email
                                  </span>
                                </SelectItem>
                                <SelectItem value="whatsapp">
                                  <span className="flex items-center gap-2">
                                    <MessageCircle className="h-4 w-4" /> WhatsApp
                                  </span>
                                </SelectItem>
                                <SelectItem value="sms">
                                  <span className="flex items-center gap-2">
                                    <Smartphone className="h-4 w-4" /> SMS
                                  </span>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="font-semibold">Message</Label>
                        <Textarea
                            placeholder="Type your custom message here..."
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            rows={5}
                            className="resize-none"
                        />
                        <p className="text-xs text-slate-500">{customMessage.length} characters</p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCustomDialogOpen(false)}>Cancel</Button>
                    <Button
                      onClick={() => handleSend(customChannel, customMessage)}
                      disabled={isSending || !customMessage.trim()}
                      className="gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                        {isSending && <Loader2 className="h-4 w-4 animate-spin" />}
                        Send Message
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle className="text-xl">Update Lab Order Status</DialogTitle>
                    <DialogDescription>
                        Change the status of this lab order. Current: <span className="font-semibold text-slate-700 dark:text-slate-300">{order.status}</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-3">
                        <Label className="font-semibold">Select New Status</Label>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {['Draft', 'Received', 'In Production', 'Ready for Delivery', 'Delivered', 'Cancelled'].map((status) => (
                                <div
                                    key={status}
                                    onClick={() => setSelectedStatus(status)}
                                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                        selectedStatus === status
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-600 shadow-sm'
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="radio"
                                            checked={selectedStatus === status}
                                            onChange={() => setSelectedStatus(status)}
                                            className="cursor-pointer mt-1"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                                                    {getStatusDisplayLabel(status)}
                                                </p>
                                                {status === 'In Production' && (
                                                    <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                                                        Creates Invoice
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{getStatusDescription(status)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>Cancel</Button>
                    <Button
                      onClick={handleStatusChange}
                      disabled={isUpdatingStatus || selectedStatus === order.status}
                      className="gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                        {isUpdatingStatus && <Loader2 className="h-4 w-4 animate-spin" />}
                        Update Status
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="text-xl text-red-600 dark:text-red-400">Delete Lab Order</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete lab order #{order.id}? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-sm text-red-800 dark:text-red-300">
                        <strong>Item:</strong> {order.item}<br/>
                        <strong>Client:</strong> {order.client?.name || '-'}
                    </p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="gap-2 bg-red-600 hover:bg-red-700"
                    >
                        {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                        Delete Order
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}
