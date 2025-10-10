
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  
  export default function StaffPositionPage() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Staff Positions</CardTitle>
          <CardDescription>
            Manage roles and positions within your practice.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold">Staff Position Module</h3>
            <p className="text-muted-foreground mt-2">
              This page is under construction.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
