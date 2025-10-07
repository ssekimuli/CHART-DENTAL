import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { appointments } from "@/lib/data";

export default function AppointmentsPage() {
  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Appointments</CardTitle>
            <CardDescription>
              Manage and view patient appointments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Treatment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <div className="font-medium">{appointment.patientName}</div>
                    </TableCell>
                    <TableCell>{appointment.treatment}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          appointment.status === "Scheduled"
                            ? "default"
                            : appointment.status === "Completed"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {appointment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{appointment.date}</TableCell>
                    <TableCell className="text-right">
                      {appointment.time}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardContent className="p-0">
            <Calendar
              mode="single"
              selected={new Date()}
              className="rounded-md"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
