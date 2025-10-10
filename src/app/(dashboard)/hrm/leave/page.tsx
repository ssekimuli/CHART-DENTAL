
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  
  export default function LeavePage() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leave Management</CardTitle>
          <CardDescription>
            Track and manage employee leave requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold">Leave Module</h3>
            <p className="text-muted-foreground mt-2">
              This page is under construction.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
