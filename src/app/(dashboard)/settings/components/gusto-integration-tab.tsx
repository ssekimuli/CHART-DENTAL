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
import { gusto, type QbSyncLog } from "@/lib/api";
import { AlertCircle, CheckCircle2, Clock, RefreshCw, Unlink, ExternalLink, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface GustoConnectionStatus {
  connected: boolean;
  company_id?: string;
  company_info?: any;
  is_token_expired?: boolean;
  is_token_expiring_soon?: boolean;
  access_token_expires_at?: string;
  last_sync?: string;
}

export function GustoIntegrationTab() {
  const { toast } = useToast();
  const [status, setStatus] = useState<GustoConnectionStatus>({
    connected: false,
  });
  const [syncLogs, setSyncLogs] = useState<QbSyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  const fetchStatus = async () => {
    try {
      const data = await gusto.getStatus();
      setStatus(data);
    } catch (error) {
      console.error("Failed to fetch Gusto status:", error);
      toast({
        title: "Error",
        description: "Failed to fetch Gusto status",
        variant: "destructive",
      });
    }
  };

  const fetchSyncLogs = async () => {
    try {
      const data = await gusto.getSyncLogs({ page: 1 });
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
      const { auth_url } = await gusto.getConnectUrl();
      window.location.href = auth_url;
    } catch (error) {
      console.error("Failed to get Gusto connect URL:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to initiate Gusto connection",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await gusto.disconnect();
      toast({
        title: "Disconnected",
        description: "Gusto connection has been removed",
      });
      await fetchStatus();
    } catch (error) {
      console.error("Failed to disconnect Gusto:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect from Gusto",
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
            Gusto HRM + Payroll Connection
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
            Connect your dental practice to Gusto for automatic employee and payroll synchronization.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {status.connected ? (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Your practice is successfully connected to Gusto.
                  <br />
                  <span className="text-sm">
                    Company ID: <code className="bg-green-100 px-2 py-1 rounded">{status.company_id}</code>
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
                  ✓ Employees automatically synced to Gusto
                  <br />
                  ✓ Payroll runs synced automatically
                  <br />
                  ✓ Real-time sync monitoring
                  <br />
                  ✓ Compliance tracking (I-9, E-Verify, W-4)
                  <br />
                  ✓ Tax form generation and archival
                </p>
              </div>
            </div>
          ) : (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Connect your Gusto account to start syncing employee and payroll data automatically.
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
                href="https://app.gusto.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="ghost" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Go to Gusto
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
                "Connect to Gusto"
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
            <strong>Automatic Syncing Enabled:</strong> All employees and payroll data are automatically synced to Gusto in real-time. No manual action needed!
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
                Real-time synchronization with Gusto
              </CardDescription>
            </div>
            {status.connected && (
              <div className="flex items-center gap-2">
                <Label htmlFor="auto-refresh-gusto" className="text-sm">
                  Live Updates
                </Label>
                <Switch
                  id="auto-refresh-gusto"
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
              <p className="text-xs mt-2">Syncs will appear here automatically when you create or update employees and payroll</p>
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
                    <TableHead>Gusto ID</TableHead>
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
                        {log.gusto_id || "-"}
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
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-semibold mb-2 text-purple-900">⚡ Real-Time Syncing</h4>
              <p className="text-purple-800">
                Everything syncs automatically in the background—no manual buttons needed. When you:
              </p>
              <ul className="mt-2 space-y-1 text-purple-800 ml-4">
                <li>✓ Create an employee → Synced to Gusto automatically</li>
                <li>✓ Update employee info → Gusto record updated</li>
                <li>✓ Create payroll → Synced with deductions</li>
                <li>✓ Approve payroll → Recorded in Gusto</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-1">📊 Real-Time Monitoring</h4>
              <p className="text-muted-foreground">
                Watch sync activity live above. Enable "Live Updates" to see new syncs appear instantly as they happen.
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
                OAuth 2.0 tokens encrypted at rest. SSN and sensitive employee data encrypted before storage.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-1">✅ Compliance Tracking</h4>
              <p className="text-muted-foreground">
                Automatic I-9 verification, E-Verify tracking, W-4 form management, and state tax compliance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
