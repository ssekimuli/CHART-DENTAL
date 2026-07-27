"use client";

import { useEffect, useState } from "react";
import { InvoiceForm } from "../components/invoice-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { createNewInvoice, getPatients } from "@/lib/api";
import { useBranch } from "@/context/branch-context";
import { Invoice, InvoiceTreatment, Patient } from "@/lib/types";

export default function NewInvoicePage() {
    const router = useRouter();
    const { selectedBranch } = useBranch();
    const [patients, setPatients] = useState<Patient[]>([]);

    useEffect(() => {
        getPatients().then(data => setPatients(data.data));
    }, []);

    const handleSave = async (data: Omit<Invoice, 'id' | 'patientName' | 'branchId' | 'amount' | 'paidAmount'>, treatments: InvoiceTreatment[]) => {
        const patient = patients.find(p => String(p.id) === String(data.patientId));
        const newInvoice = await createNewInvoice({
            ...data,
            patientName: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown',
            branchId: Number(selectedBranch),
            treatments,
        });
        if (newInvoice) {
            router.push("/billing");
            router.refresh();
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Create Invoice</CardTitle>
                    <CardDescription>
                        Select a patient and add treatments to the invoice.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <InvoiceForm 
                        patients={patients}
                        onSave={handleSave} 
                        onOpenChange={(open) => {
                            if (!open) {
                                router.push("/billing");
                            }
                        }}
                        asModal={false}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
