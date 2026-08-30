"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { qb, type QbConnectionStatus, type QbSyncLog } from "@/lib/api";
import { AlertCircle, CheckCircle2, Clock, RefreshCw, Unlink, ExternalLink, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function QuickbooksIntegrationTab() {
  const { toast } = useToast();
  const [status, setStatus] = useState<QbConnectionStatus>({
    connected: false,
  });
  const [syncLogs, setSyncLogs] = useState<QbSyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  const fetchStatus = async () => {
    try {
      const data = await qb.getStatus();
      setStatus(data);
    } catch (error) {
      console.error("Failed to fetch QB status:", error);
      toast({
        title: "Error",
        description: "Failed to fetch QuickBooks status",
        variant: "destructive",
      });
    }
  };

  const fetchSyncLogs = async () => {
    try {
      const data = await qb.getSyncLogs({ page: 1 });
      setSyncLogs(data.data || []);
    } catch (error) {
      console.error("Failed to fetch sync logs:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchStatus(), fetchSyncLogs()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Auto-refresh sync logs every 5 seconds when connected
  useEffect(() => {
    if (!status.connected || !autoRefreshEnabled) return;

    const interval = setInterval(() => {
      fetchSyncLogs();
    }, 5000);

    return () => clearInterval(interval);
  }, [status.connected, autoRefreshEnabled]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const { auth_url } = await qb.getConnectUrl();
      window.location.href = auth_url;
    } catch (error) {
      console.error("Failed to get QB connect URL:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to initiate QuickBooks connection",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await qb.disconnect();
      toast({
        title: "Disconnected",
        description: "QuickBooks connection has been removed",
      });
      await fetchStatus();
    } catch (error) {
      console.error("Failed to disconnect QB:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect from QuickBooks",
        variant: "destructive",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            QuickBooks Online Connection
            {status.connected && (
              <Badge variant="default" className="ml-auto">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            )}
            {!status.connected && (
              <Badge variant="secondary" className="ml-auto">
                <AlertCircle className="w-3 h-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Connect your dental practice to QuickBooks Online for automatic invoice, customer, and payment synchronization.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {status.connected ? (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Your practice is successfully connected to QuickBooks Online.
                  <br />
                  <span className="text-sm">
                    Realm ID: <code className="bg-green-100 px-2 py-1 rounded">{status.realm_id}</code>
                  </span>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <div className="text-sm font-medium text-muted-foreground">Last Sync</div>
                  <div className="text-lg font-semibold">
                    {status.last_sync
                      ? new Date(status.last_sync).toLocaleString()
                      : "Never"}
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm font-medium text-muted-foreground">Token Status</div>
                  <div className="flex items-center gap-2 mt-1">
                    {status.is_token_expired ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm text-red-600">Expired</span>
                      </>
                    ) : status.is_token_expiring_soon ? (
                      <>
                        <Clock className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm text-yellow-600">Expiring Soon</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600">Valid</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  ✓ Patients automatically synced as QB customers
                  <br />
                  ✓ Invoices synced with treatment items
                  <br />
                  ✓ Payments recorded in QB
                  <br />
                  ✓ Real-time webhook updates
                  <br />
                  ✓ Nightly change data capture (CDC) sync
                </p>
              </div>
            </div>
          ) : (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Connect your QuickBooks Online account to start syncing patient and invoice data automatically.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="gap-2">
          {status.connected ? (
            <>
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
              >
                {isDisconnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <Unlink className="w-4 h-4 mr-2" />
                    Disconnect
                  </>
                )}
              </Button>
              <a
                href="https://quickbooks.intuit.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="ghost" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Go to QB
                </Button>
              </a>
            </>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect to QuickBooks Online"
              )}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Automatic Sync Info */}
      {status.connected && (
        <Alert className="border-blue-200 bg-blue-50">
          <Zap className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Automatic Syncing Enabled:</strong> All patients, invoices, and payments are automatically synced to QuickBooks in real-time. No manual action needed!
          </AlertDescription>
        </Alert>
      )}

      {/* Sync Activity Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sync Activity</CardTitle>
              <CardDescription>
                Real-time synchronization with QuickBooks
              </CardDescription>
            </div>
            {status.connected && (
              <div className="flex items-center gap-2">
                <Label htmlFor="auto-refresh" className="text-sm">
                  Live Updates
                </Label>
                <Switch
                  id="auto-refresh"
                  checked={autoRefreshEnabled}
                  onCheckedChange={setAutoRefreshEnabled}
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {syncLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No sync activity yet</p>
              <p className="text-xs mt-2">Syncs will appear here automatically when you create patients, invoices, or payments</p>
            </div>
          ) : (
            <div className="space-y-4">
              {autoRefreshEnabled && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                  <span>Live updates enabled</span>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>QB ID</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncLogs.slice(0, 20).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium capitalize">
                        {log.entity_type}
                      </TableCell>
                      <TableCell>
                        {log.status === "success" && (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Success
                          </Badge>
                        )}
                        {log.status === "failed" && (
                          <Badge variant="destructive">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                        {log.status === "pending" && (
                          <Badge variant="secondary">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {log.qb_id || "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentation Card */}
      <Card>
        <CardHeader>
          <CardTitle>How Automatic Syncing Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4 text-sm">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold mb-2 text-blue-900">⚡ Real-Time Syncing</h4>
              <p className="text-blue-800">
                Everything syncs automatically in the background—no manual buttons needed. When you:
              </p>
              <ul className="mt-2 space-y-1 text-blue-800 ml-4">
                <li>✓ Create a patient → Synced to QB as customer</li>
                <li>✓ Update patient info → QB customer updated</li>
                <li>✓ Create an invoice → Synced with treatments</li>
                <li>✓ Record a payment → Recorded in QB</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-1">📊 Real-Time Monitoring</h4>
              <p className="text-muted-foreground">
                Watch sync activity live above. Enable "Live Updates" to see new syncs appear instantly as they happen.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-1">💳 Payment Processing</h4>
              <p className="text-muted-foreground">
                Vault your cards securely using QB.js tokenization. Charge cards directly from invoices with automatic QB recording.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-1">🔄 Automatic Retries</h4>
              <p className="text-muted-foreground">
                If a sync fails, our system automatically retries up to 3 times. Check the sync log for any issues that need attention.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-1">🔐 Bank-Level Security</h4>
              <p className="text-muted-foreground">
                OAuth 2.0 tokens encrypted at rest. Card data never touches our servers—QB.js handles tokenization securely.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
