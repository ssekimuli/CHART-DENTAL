import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { insuranceApi } from "@/services/api/insurance";

interface AttachPolicyFormProps {
    patientId: number;
    onSave: () => void;
    onOpenChange: (open: boolean) => void;
}

export function AttachPolicyForm({ patientId, onSave, onOpenChange }: AttachPolicyFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [policies, setPolicies] = useState<any[]>([]);
    
    const [formData, setFormData] = useState({
        insurance_policy_id: "",
        subscriber_id: "",
        group_number: "",
        relationship_to_subscriber: "self",
        subscriber_name: "",
        is_primary: true
    });

    useEffect(() => {
        const fetchPolicies = async () => {
            try {
                // Fetch all Master Policies to let user choose from
                const res = await insuranceApi.getPolicies();
                setPolicies(res.data?.data || []);
            } catch (e) {
                console.error("Failed to load policies", e);
            }
        };
        fetchPolicies();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await insuranceApi.attachPolicyToPatient(patientId, formData);
            onSave();
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to attach policy", error);
            alert("Failed to attach policy. Make sure it hasn't been attached already.");
        }
        setIsSubmitting(false);
    };

    return (
        <Dialog open={true} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Assign Master Policy</DialogTitle>
                        <DialogDescription>
                            Link this patient to a Master Policy and enter their specific member details.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Master Policy *</Label>
                            <div className="col-span-3">
                                <Select required onValueChange={(v) => setFormData({...formData, insurance_policy_id: v})} value={formData.insurance_policy_id}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Policy" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {policies.map(p => (
                                            <SelectItem key={p.id} value={String(p.id)}>
                                                {p.policy_number} - {p.package?.name} {p.employer_or_group_name ? `(${p.employer_or_group_name})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Member ID *</Label>
                            <Input required className="col-span-3" value={formData.subscriber_id} onChange={e => setFormData({...formData, subscriber_id: e.target.value})} placeholder="e.g. SUB-12345" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Group #</Label>
                            <Input className="col-span-3" value={formData.group_number} onChange={e => setFormData({...formData, group_number: e.target.value})} placeholder="Optional" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Relationship</Label>
                            <div className="col-span-3">
                                <Select required onValueChange={(v) => setFormData({...formData, relationship_to_subscriber: v})} value={formData.relationship_to_subscriber}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="self">Self</SelectItem>
                                        <SelectItem value="spouse">Spouse</SelectItem>
                                        <SelectItem value="child">Child</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {formData.relationship_to_subscriber !== 'self' && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Subscriber Name</Label>
                                <Input required className="col-span-3" value={formData.subscriber_name} onChange={e => setFormData({...formData, subscriber_name: e.target.value})} placeholder="Primary subscriber's name" />
                            </div>
                        )}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Primary?</Label>
                            <div className="col-span-3 flex items-center h-full">
                                <Checkbox checked={formData.is_primary} onCheckedChange={(c) => setFormData({...formData, is_primary: !!c})} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Insurance"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
