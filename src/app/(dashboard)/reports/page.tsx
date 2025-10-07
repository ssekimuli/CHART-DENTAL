
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  
  export default function ReportsPage() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
          <CardDescription>
            Generate and view reports for your practice.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold">Report Module</h3>
            <p className="text-muted-foreground mt-2">
              This is the starting point for your reporting needs. What kind of reports would you find most useful?
            </p>
            <p className="text-muted-foreground mt-1">
              For example: Financial Reports, Appointment Statistics, Patient Demographics, etc.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
