
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function PeriodontalChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Periodontal Chart</CardTitle>
        <CardDescription>
          Assess the health of gums and bone around each tooth.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
          <p className="text-muted-foreground">
            Periodontal Chart Component - Coming Soon
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
