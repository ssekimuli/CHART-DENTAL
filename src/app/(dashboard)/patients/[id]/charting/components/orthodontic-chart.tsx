
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function OrthodonticChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orthodontic Chart</CardTitle>
        <CardDescription>
          Specialized chart for braces and tooth movement.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
          <p className="text-muted-foreground">
            Orthodontic Chart Component - Coming Soon
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
