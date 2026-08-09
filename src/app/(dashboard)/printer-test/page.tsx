"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useThermalPrinter, type PrinterState } from "@/hooks/use-thermal-printer";
import {
  AlertCircle,
  CheckCircle,
  Wifi,
  WifiOff,
  Loader2,
  FileText,
  Settings,
  X,
} from "lucide-react";

export default function PrinterTestPage() {
  const printer = useThermalPrinter();
  const [printerSize, setPrinterSize] = useState<"58mm" | "80mm">("58mm");
  const [testData, setTestData] = useState({
    clinicName: "CHART Dental Clinic",
    patientName: "John Doe",
    treatmentType: "General Checkup",
    amount: "150.00",
    date: new Date().toLocaleDateString(),
  });

  const handleSelectPrinter = async () => {
    await printer.requestAndConnect(printerSize);
  };

  const handleDisconnect = async () => {
    await printer.disconnect();
  };

  const handleTestPrint = async () => {
    const success = await printer.print({
      clinicName: testData.clinicName,
      patientName: testData.patientName,
      treatmentType: testData.treatmentType,
      amount: testData.amount,
      date: testData.date,
      billNumber: "BL-001",
    });

    if (!success) {
      console.error("Print failed");
    }
  };

  const handlePrintTestPattern = async () => {
    // Send raw test pattern bytes
    const testPattern = new Uint8Array([
      0x1b, 0x40, // Initialize printer
      0x1b, 0x21, 0x08, // Font size
      0x54, 0x45, 0x53, 0x54, 0x20, 0x50, 0x41, 0x54, 0x54, 0x45, 0x52, 0x4e, // "TEST PATTERN"
      0x0a, 0x0a, // Line breaks
      0x2d, 0x2d, 0x2d, 0x2d, 0x2d, 0x2d, 0x2d, 0x2d, 0x2d, 0x2d, // dashes
      0x0a,
      0x54, 0x68, 0x69, 0x73, 0x20, 0x69, 0x73, 0x20, 0x61, 0x20, 0x74, 0x65, 0x73, 0x74, // "This is a test"
      0x0a,
      0x1b, 0x69, // Partial cut
    ]);

    try {
      await printer.print(testPattern);
    } catch (error: any) {
      console.error("Test pattern failed:", error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Bluetooth Printer Test</h1>
          <p className="text-slate-600">
            Test and manage Bluetooth thermal printer connections directly from your browser
          </p>
        </div>

        {/* Browser Support Alert */}
        {!printer.isSupported && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Web Serial API is not supported in your browser. Please use Chrome, Edge, or Opera.
            </AlertDescription>
          </Alert>
        )}

        {/* Connection Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Connection Status</span>
              {printer.isConnected ? (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  <Wifi className="w-3 h-3 mr-1" /> Connected
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <WifiOff className="w-3 h-3 mr-1" /> Disconnected
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Connected Device Info */}
            {printer.isConnected && printer.connectedDevice && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {printer.connectedDevice.name}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      Size: <strong>{printer.printerSize}</strong>
                    </p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                </div>
              </div>
            )}

            {/* Error Display */}
            {printer.error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <div className="flex items-start justify-between">
                    <span>{printer.error}</span>
                    <button
                      onClick={printer.clearError}
                      className="ml-2 text-red-600 hover:text-red-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Connection Controls */}
            <div className="flex gap-2">
              {!printer.isConnected ? (
                <Button
                  onClick={handleSelectPrinter}
                  disabled={!printer.isSupported || printer.isPrinting}
                  className="flex-1"
                >
                  {printer.isPrinting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Settings className="w-4 h-4 mr-2" />
                      Select & Connect Printer
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={handleDisconnect} variant="destructive" className="flex-1">
                  <X className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              )}
            </div>

            {/* Printer Size Selection */}
            {!printer.isConnected && (
              <div className="pt-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Printer Width
                </label>
                <Select value={printerSize} onValueChange={(v) => setPrinterSize(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58mm">58mm (Mobile Receipt Printer)</SelectItem>
                    <SelectItem value="80mm">80mm (Large Thermal Printer)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Print Options */}
        {printer.isConnected && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Print Test
              </CardTitle>
              <CardDescription>Send test data to your printer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Test Data Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Clinic Name
                  </label>
                  <input
                    type="text"
                    value={testData.clinicName}
                    onChange={(e) =>
                      setTestData({ ...testData, clinicName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Patient Name
                  </label>
                  <input
                    type="text"
                    value={testData.patientName}
                    onChange={(e) =>
                      setTestData({ ...testData, patientName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Treatment Type
                  </label>
                  <input
                    type="text"
                    value={testData.treatmentType}
                    onChange={(e) =>
                      setTestData({ ...testData, treatmentType: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="text"
                    value={testData.amount}
                    onChange={(e) => setTestData({ ...testData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Print Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleTestPrint}
                  disabled={printer.isPrinting}
                  className="flex-1"
                >
                  {printer.isPrinting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Printing...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Print Receipt
                    </>
                  )}
                </Button>
                <Button
                  onClick={handlePrintTestPattern}
                  variant="outline"
                  disabled={printer.isPrinting}
                >
                  Print Test Pattern
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Browser Support Info */}
        {printer.isSupported && !printer.isConnected && (
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-base">Getting Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <div>
                <h4 className="font-semibold mb-2">Step 1: Pair Your Printer</h4>
                <p>Make sure your Bluetooth printer is paired with your device first:</p>
                <ul className="list-disc list-inside mt-1 ml-2 text-slate-600">
                  <li>Windows: Settings → Devices → Bluetooth & devices → Add device</li>
                  <li>macOS: System Preferences → Bluetooth</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Step 2: Select Printer Size</h4>
                <p>Choose the correct paper width for your printer (58mm or 80mm)</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Step 3: Connect & Test</h4>
                <p>Click "Select & Connect Printer" and choose your printer from the system dialog</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
