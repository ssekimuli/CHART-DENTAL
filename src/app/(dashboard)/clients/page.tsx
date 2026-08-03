"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle, Pencil, Trash } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { Client } from "@/lib/types";
import { getClients, createClient, updateClient, deleteClient } from "@/lib/api";
import { ClientForm } from "./components/client-form";

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    useEffect(() => {
        const fetchClients = async () => {
            setIsLoading(true);
            const data = await getClients();
            setClients(data);
            setIsLoading(false);
        };
        fetchClients();
    }, []);

    const handleSaveClient = async (data: Omit<Client, 'id'>) => {
        if (editingClient) {
            const updated = await updateClient(editingClient.id, data);
            setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
        } else {
            const added = await createClient(data);
            setClients(prev => [...prev, added]);
        }
        setIsFormOpen(false);
        setEditingClient(null);
    };

    const handleDeleteClient = async (id: string | number) => {
        if (!confirm("Are you sure you want to delete this client?")) return;
        await deleteClient(id);
        setClients(prev => prev.filter(c => c.id !== id));
    };

    const openEditForm = (client: Client) => {
        setEditingClient(client);
        setIsFormOpen(true);
    };

    const openCreateForm = () => {
        setEditingClient(null);
        setIsFormOpen(true);
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Clients</CardTitle>
                        <CardDescription>
                            Manage lab clients and partner clinics.
                        </CardDescription>
                    </div>
                    <Button onClick={openCreateForm}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Client
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Address</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {clients.map(client => (
                                        <TableRow key={client.id}>
                                            <TableCell className="font-medium">{client.name}</TableCell>
                                            <TableCell>{client.email || '-'}</TableCell>
                                            <TableCell>{client.phone || '-'}</TableCell>
                                            <TableCell>{client.address || '-'}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => openEditForm(client)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteClient(client.id)}>
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {clients.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                No clients found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {isFormOpen && (
                <ClientForm
                    initialData={editingClient}
                    onSave={handleSaveClient}
                    onOpenChange={setIsFormOpen}
                />
            )}
        </>
    );
}
