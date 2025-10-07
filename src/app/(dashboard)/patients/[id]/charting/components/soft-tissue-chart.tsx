
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SoftTissueChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Soft Tissue Chart</CardTitle>
        <CardDescription>
          Chart non-tooth structures like cheeks, tongue, and palate.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
          <p className="text-muted-foreground">
            Soft Tissue Chart Component - Coming Soon
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
