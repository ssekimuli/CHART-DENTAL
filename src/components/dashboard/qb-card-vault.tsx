"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { qb } from "@/lib/api";
import { CreditCard, AlertCircle, Loader2 } from "lucide-react";

interface QbCardVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: number;
  onSuccess?: (vaultToken: string) => void;
}

declare global {
  interface Window {
    QuickBooks?: any;
  }
}

export function QbCardVault({ open, onOpenChange, customerId, onSuccess }: QbCardVaultProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [qbScriptLoaded, setQbScriptLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  });

  // Load QB.js library
  useEffect(() => {
    if (typeof window !== "undefined" && !window.QuickBooks) {
      const script = document.createElement("script");
      script.src = "https://js.appcenter.intuit.com/v1/quickbooks.js";
      script.async = true;
      script.onload = () => {
        setQbScriptLoaded(true);
      };
      document.head.appendChild(script);
    } else if (window.QuickBooks) {
      setQbScriptLoaded(true);
    }
  }, []);

  const handleVaultCard = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!qbScriptLoaded || !window.QuickBooks) {
      toast({
        title: "Error",
        description: "QB payment library not loaded. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    if (!cardDetails.cardNumber || !cardDetails.expiryDate || !cardDetails.cvv) {
      toast({
        title: "Invalid Card",
        description: "Please fill in all card details",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Parse expiry date (MM/YY format)
      const [expMonth, expYear] = cardDetails.expiryDate.split("/");

      // Request token from QB.js
      const tokenResponse = await new Promise((resolve, reject) => {
        window.QuickBooks.payments.tokenize(
          {
            card: {
              number: cardDetails.cardNumber.replace(/\s/g, ""),
              expirationMonth: expMonth,
              expirationYear: "20" + expYear,
              cvc: cardDetails.cvv,
              cardholderName: cardDetails.cardholderName,
            },
          },
          (token: string) => resolve(token),
          (error: any) => reject(error)
        );
      });

      // Send token to backend for vaulting
      const result = await qb.vaultCard(
        tokenResponse as string,
        customerId
      );

      if (result.success) {
        toast({
          title: "Card Saved",
          description: "Your card has been securely vaulted",
        });
        setCardDetails({
          cardNumber: "",
          expiryDate: "",
          cvv: "",
          cardholderName: "",
        });
        onOpenChange(false);
        onSuccess?.(result.vault_token);
      }
    } catch (error: any) {
      console.error("Card vault error:", error);
      toast({
        title: "Failed to Save Card",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Payment Card</DialogTitle>
          <DialogDescription>
            Securely add a card for future payments. Your card information is encrypted and stored with QuickBooks.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <CreditCard className="h-4 w-4" />
          <AlertDescription>
            This form uses secure tokenization. Your card data is never stored on our servers.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleVaultCard} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardholder-name">Cardholder Name</Label>
            <Input
              id="cardholder-name"
              placeholder="John Doe"
              value={cardDetails.cardholderName}
              onChange={(e) =>
                setCardDetails({
                  ...cardDetails,
                  cardholderName: e.target.value,
                })
              }
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="card-number">Card Number</Label>
            <Input
              id="card-number"
              placeholder="4111 1111 1111 1111"
              value={cardDetails.cardNumber}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, "");
                value = value.replace(/(\d{4})/g, "$1 ").trim();
                setCardDetails({
                  ...cardDetails,
                  cardNumber: value,
                });
              }}
              maxLength={19}
              required
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry-date">Expiry (MM/YY)</Label>
              <Input
                id="expiry-date"
                placeholder="12/25"
                value={cardDetails.expiryDate}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, "");
                  if (value.length >= 2) {
                    value = value.slice(0, 2) + "/" + value.slice(2, 4);
                  }
                  setCardDetails({
                    ...cardDetails,
                    expiryDate: value,
                  });
                }}
                maxLength={5}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                placeholder="123"
                type="password"
                value={cardDetails.cvv}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setCardDetails({
                    ...cardDetails,
                    cvv: value,
                  });
                }}
                maxLength={4}
                required
                disabled={isLoading}
              />
            </div>
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
            <Button type="submit" disabled={isLoading || !qbScriptLoaded}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Save Card
                </>
              )}
            </Button>
          </DialogFooter>
        </form>

        {!qbScriptLoaded && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Loading payment system... please wait
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}
