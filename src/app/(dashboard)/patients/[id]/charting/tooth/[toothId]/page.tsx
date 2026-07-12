"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Stethoscope, ActivitySquare } from "lucide-react";
import { format } from "date-fns";

type HistoryItem = {
    id: string;
    type: "Condition" | "Treatment";
    date: string;
    details: string;
    status?: string;
    cost?: number;
    notes?: string;
    user?: string;
};

export default function ToothHistoryPage() {
    const params = useParams();
    const router = useRouter();
    const patientId = params.id as string;
    const toothId = params.toothId as string;

    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const response = await fetchApi(`/patients/${patientId}/tooth/${toothId}/history`);
                if (response?.history) {
                    setHistory(response.history);
                }
            } catch (error) {
                console.error("Failed to load tooth history:", error);
            } finally {
                setLoading(false);
            }
        };

        if (patientId && toothId) {
            loadHistory();
        }
    }, [patientId, toothId]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Tooth #{toothId} History</h2>
                    <p className="text-muted-foreground">Detailed clinical timeline for tooth {toothId}</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Clinical Timeline</CardTitle>
                    <CardDescription>All conditions and treatments recorded for this tooth, ordered chronologically.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8 text-muted-foreground">Loading history...</div>
                    ) : history.length === 0 ? (
                        <div className="text-center p-8 border rounded-lg bg-muted/20 border-dashed">
                            <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-3 opacity-50" />
                            <h3 className="text-lg font-medium text-foreground">No History Found</h3>
                            <p className="text-sm text-muted-foreground">There are no conditions or treatments recorded for tooth #{toothId}.</p>
                        </div>
                    ) : (
                        <div className="relative border-l border-muted ml-3 space-y-8 pb-4">
                            {history.map((item, index) => (
                                <div key={item.id || index} className="relative pl-6">
                                    <div className={`absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-background ${item.type === 'Treatment' ? 'bg-blue-500' : 'bg-amber-500'}`}>
                                        {item.type === 'Treatment' ? (
                                            <Stethoscope className="h-3 w-3 text-white" />
                                        ) : (
                                            <ActivitySquare className="h-3 w-3 text-white" />
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-foreground">{item.type}</span>
                                            <span className="text-xs text-muted-foreground">{format(new Date(item.date), 'MMM d, yyyy h:mm a')}</span>
                                        </div>
                                        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                                            <div className="font-medium text-base mb-1">{item.details}</div>
                                            
                                            {item.type === 'Treatment' && item.status && (
                                                <div className="flex gap-2 text-sm mt-2">
                                                    <span className="text-muted-foreground">Status:</span>
                                                    <span className={`font-medium ${item.status === 'Completed' ? 'text-green-600' : 'text-blue-600'}`}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            {item.notes && (
                                                <div className="mt-3 text-sm bg-muted/50 p-3 rounded-md border text-muted-foreground whitespace-pre-wrap">
                                                    {item.notes}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
