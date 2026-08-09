"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bluetooth, Loader2, CheckCircle, AlertCircle, Wifi } from "lucide-react";
import BluetoothPrinterService, { BluetoothDevice, PrinterSize } from "@/lib/bluetooth-printer";
import { useToast } from "@/hooks/use-toast";

interface PrinterSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrinterSelected: (device: BluetoothDevice, size: PrinterSize) => void;
  isSupported: boolean;
}

export function PrinterSelector({
  open,
  onOpenChange,
  onPrinterSelected,
  isSupported,
}: PrinterSelectorProps) {
  const { toast } = useToast();
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<BluetoothDevice | null>(null);
  const [printerSize, setPrinterSize] = useState<PrinterSize>("58mm");
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);

  useEffect(() => {
    if (open) {
      loadSavedDevices();
      loadConnectedDevice();
    }
  }, [open]);

  const loadSavedDevices = () => {
    try {
      const saved = localStorage.getItem("bluetooth_devices");
      if (saved) {
        setDevices(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load saved devices:", error);
    }
  };

  const loadConnectedDevice = () => {
    try {
      const saved = localStorage.getItem("connected_printer");
      if (saved) {
        const device = JSON.parse(saved);
        setConnectedDevice(device);
        setSelectedDevice(device);
      }
    } catch (error) {
      console.error("Failed to load connected device:", error);
    }
  };

  const handleScanDevices = async () => {
    setIsScanning(true);
    try {
      const printer = new BluetoothPrinterService();
      const success = await printer.requestPort();

      if (success) {
        // Create device object with a generated ID
        const device: BluetoothDevice = {
          id: Date.now().toString(),
          name: 'Thermal Printer',
        };

        setSelectedDevice(device);

        // Save device for future use
        const savedDevices = devices.filter(d => d.id !== device.id);
        savedDevices.unshift(device);
        setDevices(savedDevices);

        try {
          localStorage.setItem("bluetooth_devices", JSON.stringify(savedDevices.slice(0, 5)));
        } catch {
          // Storage quota exceeded
        }

        toast({
          title: "Device Found",
          description: `Found printer: ${device.name}`,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Scan Failed",
        description: error.message || "Failed to find printer",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const printer = new BluetoothPrinterService();

      // First, request the port
      const portSelected = await printer.requestPort();
      if (!portSelected) {
        throw new Error('No printer port selected');
      }

      // Get device info after port selection
      const device = printer.getConnectedDevice();

      // Then connect
      const connected = await printer.connect();
      if (connected) {
        const finalDevice = device || selectedDevice;
        if (!finalDevice) {
          throw new Error('Unable to identify selected printer');
        }

        setConnectedDevice(finalDevice);
        try {
          localStorage.setItem("connected_printer", JSON.stringify(finalDevice));
          localStorage.setItem("printer_size", printerSize);
        } catch {
          // Storage quota exceeded
        }

        toast({
          title: "Connected",
          description: `Successfully connected to ${finalDevice.name}`,
        });

        onPrinterSelected(finalDevice, printerSize);
        onOpenChange(false);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error.message || "Failed to connect to printer",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isSupported) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Bluetooth Printer Not Supported</DialogTitle>
            <DialogDescription>
              Your browser does not support Web Bluetooth or Web Serial APIs.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 p-3 rounded">
            <AlertCircle className="h-4 w-4" />
            <span>Try using Chrome, Edge, or Opera browser on a device with Bluetooth support.</span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Bluetooth Printer</DialogTitle>
          <DialogDescription>
            Connect to your thermal printer for receipt printing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Connection Status */}
          {connectedDevice && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded">
              <CheckCircle className="h-4 w-4" />
              <span>Connected: {connectedDevice.name}</span>
            </div>
          )}

          {/* Printer Size Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Paper Size</label>
            <Select value={printerSize} onValueChange={(val: any) => setPrinterSize(val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="58mm">58mm (2.24 inches) - Portable</SelectItem>
                <SelectItem value="80mm">80mm (3.15 inches) - Standard</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {printerSize === "58mm"
                ? "Characters per line: ~32"
                : "Characters per line: ~48"}
            </p>
          </div>

          {/* Device Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Device</label>
            <Select value={selectedDevice?.id || ""} onValueChange={(id) => {
              const device = devices.find(d => d.id === id);
              if (device) setSelectedDevice(device);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="No device selected" />
              </SelectTrigger>
              <SelectContent>
                {devices.map((device) => (
                  <SelectItem key={device.id} value={device.id}>
                    <div className="flex items-center gap-2">
                      <Bluetooth className="h-4 w-4" />
                      {device.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scan Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleScanDevices}
            disabled={isScanning || isConnecting}
          >
            {isScanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Wifi className="mr-2 h-4 w-4" />
                Scan for Printers
              </>
            )}
          </Button>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isConnecting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConnect}
            disabled={!selectedDevice || isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect & Print"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
