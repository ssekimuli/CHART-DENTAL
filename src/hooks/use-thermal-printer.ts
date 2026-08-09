import { useState, useCallback, useEffect } from "react";
import { getPrinterService, type BluetoothDevice, type PrinterSize } from "@/lib/bluetooth-printer";
import { generateReceiptBytes, type ReceiptData } from "@/lib/escpos-printer";
import { useToast } from "@/hooks/use-toast";

export interface PrinterState {
  isSupported: boolean;
  isConnected: boolean;
  isPrinting: boolean;
  connectedDevice: BluetoothDevice | null;
  printerSize: PrinterSize;
  error: string | null;
}

export function useThermalPrinter() {
  const { toast } = useToast();
  const [state, setState] = useState<PrinterState>({
    isSupported: false,
    isConnected: false,
    isPrinting: false,
    connectedDevice: null,
    printerSize: "58mm",
    error: null,
  });

  // Use singleton printer service
  const printerService = getPrinterService();

  // Check support and restore connection on mount
  useEffect(() => {
    const isSupported = getPrinterService.toString().includes('serial');
    setState(prev => ({ ...prev, isSupported }));

    // Try to restore saved printer connection info
    try {
      const saved = localStorage.getItem("connected_printer");
      const savedSize = localStorage.getItem("printer_size") as PrinterSize;
      if (saved) {
        const device = JSON.parse(saved);
        setState(prev => ({
          ...prev,
          connectedDevice: device,
          printerSize: savedSize || "58mm",
          isSupported: true,
        }));
      }
    } catch (error) {
      console.error("Failed to load saved printer:", error);
    }
  }, []);

  const requestAndConnect = useCallback(
    async (size: PrinterSize): Promise<boolean> => {
      setState(prev => ({ ...prev, error: null }));

      try {
        // Request port first (user selects the device)
        const portSelected = await printerService.requestPort();
        if (!portSelected) {
          throw new Error('No port selected');
        }

        // Then connect
        const connected = await printerService.connect();
        if (connected) {
          const device = printerService.getConnectedDevice();

          setState(prev => ({
            ...prev,
            isConnected: true,
            connectedDevice: device,
            printerSize: size,
            error: null,
          }));

          // Save for future use
          try {
            if (device) {
              localStorage.setItem("connected_printer", JSON.stringify(device));
              localStorage.setItem("printer_size", size);
            }
          } catch {
            // Storage quota exceeded
          }

          toast({
            title: "Connected",
            description: `Connected to ${device?.name || 'printer'}`,
          });

          return true;
        }

        return false;
      } catch (error: any) {
        const errorMsg = error.message || "Failed to connect to printer";
        setState(prev => ({ ...prev, error: errorMsg, isConnected: false }));

        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: errorMsg,
        });

        return false;
      }
    },
    [printerService, toast]
  );

  const disconnect = useCallback(async () => {
    try {
      await printerService.disconnect();
      setState(prev => ({
        ...prev,
        isConnected: false,
        connectedDevice: null,
        error: null,
      }));

      try {
        localStorage.removeItem("connected_printer");
        localStorage.removeItem("printer_size");
      } catch {
        // Storage quota exceeded
      }

      toast({
        title: "Disconnected",
        description: "Printer disconnected",
      });
    } catch (error: any) {
      const errorMsg = error.message || "Failed to disconnect";
      setState(prev => ({ ...prev, error: errorMsg }));
    }
  }, [printerService, toast]);

  const print = useCallback(
    async (receiptData: ReceiptData): Promise<boolean> => {
      if (!state.isConnected || !state.connectedDevice) {
        const errorMsg = "Printer is not connected";
        setState(prev => ({ ...prev, error: errorMsg }));

        toast({
          variant: "destructive",
          title: "Printer Not Connected",
          description: errorMsg,
        });

        return false;
      }

      setState(prev => ({ ...prev, isPrinting: true, error: null }));

      try {
        // Generate ESC/POS bytes
        const receiptBytes = generateReceiptBytes({
          ...receiptData,
          printerSize: state.printerSize,
        });

        console.log(`Printing ${receiptBytes.length} bytes...`);

        // Send to printer
        await printerService.print(receiptBytes);

        setState(prev => ({ ...prev, isPrinting: false }));

        toast({
          title: "Printed Successfully",
          description: "Receipt printed successfully",
        });

        return true;
      } catch (error: any) {
        const errorMsg = error.message || "Failed to print receipt";
        setState(prev => ({ ...prev, isPrinting: false, error: errorMsg, isConnected: false }));

        toast({
          variant: "destructive",
          title: "Print Failed",
          description: errorMsg,
        });

        return false;
      }
    },
    [state.isConnected, state.connectedDevice, state.printerSize, printerService, toast]
  );

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    requestAndConnect,
    disconnect,
    print,
    clearError,
  };
}
