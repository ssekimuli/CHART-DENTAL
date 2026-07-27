"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { History, Search, Filter, Loader2 } from "lucide-react";
import { getActivityLogs } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBranch } from "@/context/branch-context";
import { useToast } from "@/hooks/use-toast";

type ActivityLog = {
    id: number;
    user_id: number | null;
    action: string;
    description: string;
    metadata: any;
    created_at: string;
    user_name: string;
};

export default function ActivityLogsPage() {
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchLogs = async (currentPage: number) => {
        try {
            setLoading(true);
            const params: any = {
                page: currentPage,
                per_page: 20,
            };
            if (actionFilter !== "all") {
                params.action = actionFilter;
            }
            if (selectedBranch?.id) {
                params.branch_id = selectedBranch.id;
            }

            if (searchQuery.trim() !== "") {
                params.search = searchQuery.trim();
            }

            const response = await getActivityLogs(params);
            if (response.data) {
                setLogs(response.data);
                setTotalPages(response.last_page || 1);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load activity logs.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            setPage(1);
            fetchLogs(1);
        }, 300); // 300ms debounce for search typing

        return () => clearTimeout(delayDebounceFn);
    }, [actionFilter, selectedBranch, searchQuery]);

    useEffect(() => {
        if (page > 1) {
            fetchLogs(page);
        }
    }, [page]);

    // We no longer need client-side filtering since the backend handles it.
    const filteredLogs = logs;

    const getActionBadgeColor = (action: string) => {
        switch (action) {
            case 'send_email': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'send_sms': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'send_whatsapp': return 'bg-green-100 text-green-800 border-green-200';
            case 'pay_invoice': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'login': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'logout': return 'bg-slate-100 text-slate-800 border-slate-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatActionName = (action: string) => {
        return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">System Activity Logs</h2>
                    <p className="text-muted-foreground">
                        Monitor and audit all automated and user-triggered system actions.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search descriptions or users..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <Select value={actionFilter} onValueChange={setActionFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by action" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Actions</SelectItem>
                                    <SelectItem value="send_email">Emails Sent</SelectItem>
                                    <SelectItem value="send_sms">SMS Sent</SelectItem>
                                    <SelectItem value="send_whatsapp">WhatsApp Sent</SelectItem>
                                    <SelectItem value="pay_invoice">Invoice Payments</SelectItem>
                                    <SelectItem value="login">Logins</SelectItem>
                                    <SelectItem value="logout">Logouts</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>User / Trigger</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead className="max-w-[300px]">Description</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                            <p className="mt-2 text-sm text-muted-foreground">Loading logs...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                                            No activity logs found matching your criteria.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="whitespace-nowrap text-sm">
                                                {format(new Date(log.created_at), "MMM d, yyyy HH:mm:ss")}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {log.user_name}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={getActionBadgeColor(log.action)}>
                                                    {formatActionName(log.action)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-[300px] truncate" title={log.description}>
                                                {log.description}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-end space-x-2 pt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                            >
                                Previous
                            </Button>
                            <div className="text-sm font-medium">
                                Page {page} of {totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || loading}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
