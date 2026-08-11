"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useThermalPrinter } from "@/hooks/use-thermal-printer";
import { AlertCircle, Printer, Settings2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PatientBill {
  patientName: string;
  clinicName: string;
  treatmentType: string;
  amount: string;
  date: string;
  billNumber: string;
}

interface PrinterIntegrationExampleProps {
  bill: PatientBill;
}

/**
 * Example component showing how to integrate thermal printer
 * printing into your application workflow.
 */
export function PrinterIntegrationExample({ bill }: PrinterIntegrationExampleProps) {
  const printer = useThermalPrinter();
  const [showPrinterSetup, setShowPrinterSetup] = useState(false);

  const handleConnectPrinter = async () => {
    const connected = await printer.requestAndConnect("58mm");
    if (connected) {
      setShowPrinterSetup(false);
    }
  };

  const handlePrintBill = async () => {
    const success = await printer.print({
      clinicName: bill.clinicName,
      patientName: bill.patientName,
      treatmentType: bill.treatmentType,
      amount: bill.amount,
      date: bill.date,
      billNumber: bill.billNumber,
    });

    if (success) {
      // Handle successful print (e.g., update UI, show confirmation)
      console.log("Bill printed successfully");
    }
  };

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {printer.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{printer.error}</AlertDescription>
        </Alert>
      )}

      {/* Printer Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Printer Status</span>
            {printer.isConnected ? (
              <span className="text-xs font-semibold bg-green-100 text-green-800 px-3 py-1 rounded-full">
                Ready to Print
              </span>
            ) : (
              <span className="text-xs font-semibold bg-gray-100 text-gray-800 px-3 py-1 rounded-full">
                Not Connected
              </span>
            )}
          </CardTitle>
          <CardDescription>Thermal receipt printer configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Printer Info */}
          {printer.isConnected && printer.connectedDevice && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="font-semibold text-sm text-green-900">
                {printer.connectedDevice.name}
              </p>
              <p className="text-xs text-green-700 mt-1">Size: {printer.printerSize}</p>
            </div>
          )}

          {/* Browser Support Warning */}
          {!printer.isSupported && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your browser doesn't support printer connectivity. Try Chrome, Edge, or Opera.
              </AlertDescription>
            </Alert>
          )}

          {/* Connection Controls */}
          <div className="flex gap-2">
            {printer.isConnected ? (
              <Button
                onClick={() => printer.disconnect()}
                variant="outline"
                className="flex-1"
              >
                Disconnect
              </Button>
            ) : (
              <Button
                onClick={handleConnectPrinter}
                disabled={!printer.isSupported}
                className="flex-1"
              >
                <Settings2 className="w-4 h-4 mr-2" />
                Connect Printer
              </Button>
            )}
          </div>

          {/* Setup Instructions */}
          {!printer.isConnected && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
              <p className="font-semibold mb-1">First time?</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Pair your printer in system Bluetooth settings</li>
                <li>Click "Connect Printer" above</li>
                <li>Select your printer from the system dialog</li>
                <li>Ready to print!</li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print Bill Card */}
      {printer.isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Printer className="w-5 h-5 mr-2" />
              Print Receipt
            </CardTitle>
            <CardDescription>Send this bill to the thermal printer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Bill Preview */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg font-mono text-xs space-y-1">
              <div className="text-center font-bold">{bill.clinicName}</div>
              <div className="border-b border-gray-300 my-2"></div>
              <div className="text-left">
                <div>Patient: {bill.patientName}</div>
                <div>Date: {bill.date}</div>
                <div>Bill: {bill.billNumber}</div>
              </div>
              <div className="border-b border-gray-300 my-2"></div>
              <div>
                <div>{bill.treatmentType}</div>
                <div className="flex justify-between mt-1">
                  <span>Amount:</span>
                  <span>₹{bill.amount}</span>
                </div>
              </div>
              <div className="border-b border-gray-300 my-2"></div>
              <div className="text-center">Thank you!</div>
            </div>

            {/* Print Button */}
            <Button
              onClick={handlePrintBill}
              disabled={printer.isPrinting}
              className="w-full"
            >
              {printer.isPrinting ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Printing...
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Receipt
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Usage example in a bill/invoice page:
 *
 * import { PrinterIntegrationExample } from "@/components/thermal-printer/printer-integration-example";
 *
 * export default function BillPage({ billData }) {
 *   return (
 *     <div className="grid grid-cols-3 gap-4">
 *       <div className="col-span-2">
 *         {/* Bill display/form */}
 *       </div>
 *       <div>
 *         <PrinterIntegrationExample bill={billData} />
 *       </div>
 *     </div>
 *   );
 * }
 */
