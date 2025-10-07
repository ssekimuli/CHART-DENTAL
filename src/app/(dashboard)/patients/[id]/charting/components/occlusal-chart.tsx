
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function OcclusalChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Occlusal Chart</CardTitle>
        <CardDescription>
          Record bite relationship between upper and lower jaws.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
          <p className="text-muted-foreground">
            Occlusal Chart Component - Coming Soon
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
