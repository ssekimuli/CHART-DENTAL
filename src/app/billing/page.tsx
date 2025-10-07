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
import { invoices } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { FileDown, PlusCircle } from "lucide-react";

export default function BillingPage() {
  const getStatusVariant = (status: "Paid" | "Pending" | "Overdue") => {
    switch (status) {
      case "Paid":
        return "secondary";
      case "Pending":
        return "default";
      case "Overdue":
        return "destructive";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Billing</CardTitle>
          <CardDescription>
            Manage invoices and patient billing.
          </CardDescription>
        </div>
        <div className="flex gap-2">
            <Button variant="outline">
                <FileDown className="mr-2 h-4 w-4" />
                Export
            </Button>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Invoice
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice ID</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.id}</TableCell>
                <TableCell>{invoice.patientName}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell>{invoice.issueDate}</TableCell>
                <TableCell>{invoice.dueDate}</TableCell>
                <TableCell className="text-right">
                  ${invoice.amount.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
