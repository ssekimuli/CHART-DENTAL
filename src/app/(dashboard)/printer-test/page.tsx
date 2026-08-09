"use client";

import { useState } from "react";
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
import { getWindowsPrinterService } from "@/lib/windows-printer";
import { generateSimpleReceiptHTML } from "@/lib/receipt-html-generator";
import {
  AlertCircle,
  CheckCircle,
  Printer as PrinterIcon,
  Loader2,
  FileText,
  Settings,
} from "lucide-react";

export default function PrinterTestPage() {
  const [printerName, setPrinterName] = useState("POS58 Printer(2)");
  const [printerSize, setPrinterSize] = useState<"58mm" | "80mm">("58mm");
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [testData, setTestData] = useState({
    clinicName: "CHART Dental Clinic",
    patientName: "John Doe",
    treatmentType: "General Checkup",
    amount: "150.00",
    date: new Date().toLocaleDateString(),
  });

  const handlePrintReceipt = async () => {
    setIsPrinting(true);
    setError(null);
    setSuccess(false);

    try {
      const printerService = getWindowsPrinterService();
      printerService.setPrinterName(printerName);
      printerService.setPaperSize(printerSize);

      const html = generateSimpleReceiptHTML(
        testData.clinicName,
        testData.patientName,
        testData.treatmentType,
        parseFloat(testData.amount),
        "BL-001",
        testData.date,
        printerSize
      );

      await printerService.printReceipt(html, { printerName, paperSize: printerSize });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Print failed";
      setError(errorMsg);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Thermal Printer Test</h1>
          <p className="text-slate-600">Test Windows thermal printer connectivity</p>
        </div>

        {/* Success Alert */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              ✓ Print job sent successfully! Check your printer.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-900">
                ✕
              </button>
            </AlertDescription>
          </Alert>
        )}

        {/* Printer Configuration */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <PrinterIcon className="w-5 h-5" />
                Printer Configuration
              </span>
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                <CheckCircle className="w-3 h-3 mr-1" /> Ready
              </Badge>
            </CardTitle>
            <CardDescription>Configure your thermal printer settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Printer Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Printer Name
              </label>
              <input
                type="text"
                value={printerName}
                onChange={(e) => setPrinterName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., POS58 Printer(2)"
              />
              <p className="text-xs text-slate-500 mt-1">
                Name of your Windows-installed thermal printer
              </p>
            </div>

            {/* Paper Size */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Paper Width</label>
              <Select value={printerSize} onValueChange={(v) => setPrinterSize(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="58mm">58mm (Mobile Receipt Printer)</SelectItem>
                  <SelectItem value="80mm">80mm (Standard Thermal Printer)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Test Data Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Receipt Data
            </CardTitle>
            <CardDescription>Fill in test receipt information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Clinic Name
                </label>
                <input
                  type="text"
                  value={testData.clinicName}
                  onChange={(e) => setTestData({ ...testData, clinicName: e.target.value })}
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
                  onChange={(e) => setTestData({ ...testData, patientName: e.target.value })}
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
                  onChange={(e) => setTestData({ ...testData, treatmentType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                <input
                  type="text"
                  value={testData.amount}
                  onChange={(e) => setTestData({ ...testData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Print Button */}
        <Card>
          <CardHeader>
            <CardTitle>Print Receipt</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handlePrintReceipt}
              disabled={isPrinting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending to Printer...
                </>
              ) : (
                <>
                  <PrinterIcon className="w-5 h-5 mr-2" />
                  Print Receipt
                </>
              )}
            </Button>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">How to Use:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>Make sure your printer (POS58 Printer(2)) is installed in Windows</li>
                <li>Fill in the receipt data above</li>
                <li>Click "Print Receipt"</li>
                <li>Use the print dialog to select your printer and adjust settings</li>
                <li>Click "Print" to send to your thermal printer</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card className="mt-6 bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-900">Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-800 space-y-2">
            <p>
              <strong>Print dialog doesn't appear?</strong> Make sure pop-ups aren't blocked in your
              browser.
            </p>
            <p>
              <strong>Printer not in list?</strong> Check Windows Settings → Devices → Printers &
              scanners to verify your printer is installed.
            </p>
            <p>
              <strong>Output looks wrong?</strong> Try different paper size settings (58mm vs 80mm).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
