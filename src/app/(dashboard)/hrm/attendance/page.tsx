
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  
  export default function AttendancePage() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
          <CardDescription>
            Monitor and record staff attendance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold">Attendance Module</h3>
            <p className="text-muted-foreground mt-2">
              This page is under construction.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
