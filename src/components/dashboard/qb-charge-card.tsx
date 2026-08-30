"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { qb } from "@/lib/api";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface QbChargeCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: number;
  invoiceAmount: number;
  vaultToken: string;
  onSuccess?: () => void;
}

export function QbChargeCard({
  open,
  onOpenChange,
  invoiceId,
  invoiceAmount,
  vaultToken,
  onSuccess,
}: QbChargeCardProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [chargeAmount, setChargeAmount] = useState(invoiceAmount.toString());
  const [chargeStatus, setChargeStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleCharge = async () => {
    const amount = parseFloat(chargeAmount);

    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (amount > invoiceAmount) {
      toast({
        title: "Amount Too High",
        description: `Cannot charge more than the invoice amount (${invoiceAmount})`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setChargeStatus("loading");

    try {
      const result = await qb.chargeCard(invoiceId, vaultToken, amount);

      if (result.success) {
        setChargeStatus("success");
        toast({
          title: "Payment Successful",
          description: `${amount} has been charged to your card`,
        });

        setTimeout(() => {
          onOpenChange(false);
          setChargeStatus("idle");
          setChargeAmount(invoiceAmount.toString());
          onSuccess?.();
        }, 2000);
      }
    } catch (error: any) {
      setChargeStatus("error");
      console.error("Charge error:", error);
      toast({
        title: "Payment Failed",
        description: error?.response?.data?.message || "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (chargeStatus === "success") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle2 className="w-16 h-16 text-green-600 mb-4" />
            <h2 className="text-2xl font-bold text-center mb-2">Payment Successful</h2>
            <p className="text-muted-foreground text-center">
              ${parseFloat(chargeAmount).toFixed(2)} has been charged successfully
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Charge Card</DialogTitle>
          <DialogDescription>
            Charge your saved card for this invoice
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Invoice Amount: ${invoiceAmount.toFixed(2)}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="charge-amount">Amount to Charge</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
              <Input
                id="charge-amount"
                type="number"
                step="0.01"
                min="0"
                max={invoiceAmount}
                value={chargeAmount}
                onChange={(e) => setChargeAmount(e.target.value)}
                className="pl-7"
                disabled={isLoading}
              />
            </div>
          </div>

          {chargeStatus === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Payment failed. Please check your card details and try again.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleCharge} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Charge $${parseFloat(chargeAmount).toFixed(2)}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
