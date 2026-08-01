"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import customAxios from '@/lib/axios';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';

export const InsuranceClaims = () => {
  const [claims, setClaims] = useState<any[]>([]);
  const [stats, setStats] = useState({ total_claims: 0, paid_amount: 0, pending_count: 0 });
  const [insurances, setInsurances] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [formData, setFormData] = useState({
    patient_insurance_id: '',
    invoice_id: '',
    claim_number: '',
    total_amount: '',
    claimed_amount: '',
    status: 'pending'
  });
  const [policyFormData, setPolicyFormData] = useState({
    patient_id: '',
    provider_name: '',
    policy_number: '',
    group_number: '',
    plan_type: 'PPO'
  });

  const handleSearchPatient = (searchTerm: string) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    
    setSearchTimeout(setTimeout(async () => {
      try {
        const response = await customAxios.get('/patients', {
          params: { search: searchTerm, per_page: 20 }
        });
        setPatients(response.data?.data || response.data);
      } catch (error) {
        console.error("Failed to search patients:", error);
      }
    }, 300));
  };

  const handleViewClaim = (claim: any) => {
    setSelectedClaim(claim);
    setIsViewModalOpen(true);
  };

  const handleMarkAsPaid = async () => {
    if (!selectedClaim) return;
    try {
      const response = await customAxios.put(`/insurance-claims/${selectedClaim.id}`, {
        status: 'paid',
        approved_amount: selectedClaim.claimed_amount
      });
      
      // Update local state
      setClaims(claims.map(c => c.id === selectedClaim.id ? { ...c, ...response.data } : c));
      setSelectedClaim({ ...selectedClaim, ...response.data });
      
      // Refresh stats
      const statsRes = await customAxios.get('/insurance-claims/stats');
      setStats(statsRes.data);
    } catch (error) {
      console.error("Failed to mark as paid:", error);
    }
  };

  useEffect(() => {
    const fetchClaimsAndStats = async () => {
      try {
        const [claimsRes, statsRes, insurancesRes, patientsRes] = await Promise.all([
          customAxios.get('/insurance-claims'),
          customAxios.get('/insurance-claims/stats'),
          customAxios.get('/patient-insurances'),
          customAxios.get('/patients')
        ]);
        setClaims(claimsRes.data);
        setStats(statsRes.data);
        setInsurances(insurancesRes.data);
        setPatients(patientsRes.data?.data || patientsRes.data);
      } catch (error) {
        console.error("Failed to fetch claims or stats:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClaimsAndStats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await customAxios.post('/insurance-claims', formData);
      setClaims([response.data, ...claims]);
      setIsModalOpen(false);
      
      const statsRes = await customAxios.get('/insurance-claims/stats');
      setStats(statsRes.data);
      
      // Reset form
      setFormData({
        patient_insurance_id: '',
        invoice_id: '',
        claim_number: '',
        total_amount: '',
        claimed_amount: '',
        status: 'pending'
      });
    } catch (error) {
      console.error("Failed to create claim:", error);
    }
  };

  const handlePolicySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await customAxios.post('/patient-insurances', policyFormData);
      setInsurances([response.data, ...insurances]);
      setIsPolicyModalOpen(false);
      setPolicyFormData({
        patient_id: '',
        provider_name: '',
        policy_number: '',
        group_number: '',
        plan_type: 'PPO'
      });
    } catch (error) {
      console.error("Failed to create policy:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-300';
      case 'submitted': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'denied': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Insurance & Claims</h2>
        <div className="space-x-2 flex">
          <Dialog open={isPolicyModalOpen} onOpenChange={setIsPolicyModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">+ Add Policy</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Patient Insurance Policy</DialogTitle>
              </DialogHeader>
              <form onSubmit={handlePolicySubmit} className="space-y-4">
                <div className="space-y-2 flex flex-col">
                  <Label>Patient</Label>
                  <Combobox
                    options={patients.map((p: any) => ({ value: String(p.id), label: `${p.first_name} ${p.last_name}` }))}
                    value={policyFormData.patient_id}
                    onChange={(val) => setPolicyFormData({...policyFormData, patient_id: String(val)})}
                    placeholder="Search and select a patient..."
                    searchPlaceholder="Search patients by name..."
                    emptyMessage="No patient found."
                    onSearchChange={handleSearchPatient}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Provider Name</Label>
                  <Input required value={policyFormData.provider_name} onChange={(e) => setPolicyFormData({...policyFormData, provider_name: e.target.value})} placeholder="e.g. BlueCross" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Policy Number</Label>
                    <Input required value={policyFormData.policy_number} onChange={(e) => setPolicyFormData({...policyFormData, policy_number: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Group Number</Label>
                    <Input value={policyFormData.group_number} onChange={(e) => setPolicyFormData({...policyFormData, group_number: e.target.value})} />
                  </div>
                </div>
                <Button type="submit" className="w-full">Save Policy</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button>+ New Claim</Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Claim</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Patient Insurance Policy</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={formData.patient_insurance_id}
                  onChange={(e) => setFormData({...formData, patient_insurance_id: e.target.value})}
                  required
                >
                  <option value="">Select a policy...</option>
                  {insurances.map((ins: any) => (
                    <option key={ins.id} value={ins.id}>
                      {ins.patient?.first_name} {ins.patient?.last_name} - {ins.provider_name} ({ins.policy_number})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Claim Number</Label>
                <Input required value={formData.claim_number} onChange={(e) => setFormData({...formData, claim_number: e.target.value})} placeholder="CLM-XXXX" />
              </div>
              <div className="space-y-2">
                <Label>Linked Invoice ID (Optional)</Label>
                <Input type="number" value={formData.invoice_id} onChange={(e) => setFormData({...formData, invoice_id: e.target.value})} placeholder="e.g. 123" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Total Amount</Label>
                  <Input required type="number" step="0.01" value={formData.total_amount} onChange={(e) => setFormData({...formData, total_amount: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Claimed Amount</Label>
                  <Input required type="number" step="0.01" value={formData.claimed_amount} onChange={(e) => setFormData({...formData, claimed_amount: e.target.value})} />
                </div>
              </div>
              <Button type="submit" className="w-full">Submit Claim</Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Claim Details: {selectedClaim?.claim_number}</DialogTitle>
            </DialogHeader>
            {selectedClaim && (
              <div className="space-y-4 text-sm mt-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Patient Name</p>
                    <p className="font-medium text-base">{selectedClaim.patient_insurance?.patient?.first_name} {selectedClaim.patient_insurance?.patient?.last_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Status</p>
                    <Badge variant="outline" className={getStatusColor(selectedClaim.status)}>
                      {selectedClaim.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Provider</p>
                    <p className="font-medium">{selectedClaim.patient_insurance?.provider_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Policy Number</p>
                    <p className="font-medium">{selectedClaim.patient_insurance?.policy_number}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Total Invoice Amount</p>
                    <p className="font-medium">${Number(selectedClaim.total_amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Claimed Amount</p>
                    <p className="font-medium">${Number(selectedClaim.claimed_amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Date Submitted</p>
                    <p className="font-medium">{selectedClaim.created_at ? new Date(selectedClaim.created_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  {selectedClaim.invoice_id && (
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Linked Invoice ID</p>
                      <p className="font-medium">#{selectedClaim.invoice_id}</p>
                    </div>
                  )}
                </div>
                <div className="pt-4 flex justify-end gap-2">
                   <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
                   {selectedClaim.status !== 'paid' && (
                     <Button onClick={handleMarkAsPaid} className="bg-emerald-600 hover:bg-emerald-700">Mark as Paid</Button>
                   )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-white shadow-sm border-indigo-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-indigo-800">Total Claims Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-900">{stats.total_claims}</div>
            <p className="text-xs text-indigo-600/80">Total lifetime claims</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-white shadow-sm border-emerald-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Paid Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">${Number(stats.paid_amount).toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-white shadow-sm border-amber-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">{stats.pending_count}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle>Recent Claims</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-slate-100 rounded-md"></div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-md">Claim #</th>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Total Amount</th>
                    <th className="px-4 py-3">Claimed Amount</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right rounded-tr-md">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim: any) => (
                    <tr key={claim.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-indigo-600">{claim.claim_number}</td>
                      <td className="px-4 py-3 font-medium">
                        {claim.patient_insurance?.patient?.first_name} {claim.patient_insurance?.patient?.last_name}
                      </td>
                      <td className="px-4 py-3">${Number(claim.total_amount).toFixed(2)}</td>
                      <td className="px-4 py-3">${Number(claim.claimed_amount).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className={getStatusColor(claim.status)}>
                          {claim.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewClaim(claim)}>View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
