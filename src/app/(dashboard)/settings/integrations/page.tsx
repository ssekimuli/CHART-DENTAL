"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const integrations = [
  {
    id: "quickbooks",
    name: "QuickBooks Online",
    description: "Sync patients as customers, invoices with treatments, and payments automatically",
    icon: "📊",
    status: "active",
    features: [
      "Real-time patient syncing",
      "Invoice synchronization",
      "Payment recording",
      "Automatic retries",
    ],
    href: "/settings/integrations/quickbooks",
  },
  {
    id: "gusto",
    name: "Gusto HRM",
    description: "Manage employee payroll, benefits, and HR data with real-time synchronization",
    icon: "👥",
    status: "active",
    features: [
      "Employee payroll sync",
      "Benefits management",
      "HR data integration",
      "Real-time updates",
    ],
    href: "/settings/integrations/gusto",
  },
];

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground mt-2">
          Connect your dental practice with third-party services for seamless data synchronization.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {integrations.map((integration) => (
          <Card key={integration.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{integration.icon}</div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {integration.name}
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {integration.description}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-grow">
              <div>
                <h4 className="text-sm font-semibold mb-3">Features:</h4>
                <ul className="space-y-2">
                  {integration.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>

            <CardFooter>
              <Link href={integration.href} className="w-full">
                <Button className="w-full" variant="default">
                  Configure
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Coming Soon</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800">
          <p>We're working on additional integrations to expand your practice management capabilities. Stay tuned!</p>
        </CardContent>
      </Card>
    </div>
  );
}
