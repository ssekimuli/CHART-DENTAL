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
import { useCurrency } from '@/hooks/use-currency';

export const InsuranceClaims = () => {
  const { formatCurrency } = useCurrency();
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
  const [paidFormData, setPaidFormData] = useState({ approved_amount: '', write_off_amount: '0' });
  const [availableInvoices, setAvailableInvoices] = useState<any[]>([]);

  // Document upload state
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docDescription, setDocDescription] = useState('');

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

  const handleViewClaim = async (claim: any) => {
    setSelectedClaim(claim);
    setPaidFormData({ approved_amount: claim.claimed_amount, write_off_amount: '0' });
    setIsViewModalOpen(true);
    try {
      const res = await customAxios.get(`/insurance-claims/${claim.id}`);
      setSelectedClaim(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile || !selectedClaim) return;
    
    setUploadingDoc(true);
    const form = new FormData();
    form.append('file', docFile);
    form.append('description', docDescription);
    
    try {
      const res = await customAxios.post(`/insurance-claims/${selectedClaim.id}/documents`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const updatedClaim = { ...selectedClaim, documents: [...(selectedClaim.documents || []), res.data] };
      setSelectedClaim(updatedClaim);
      setClaims(claims.map(c => c.id === updatedClaim.id ? updatedClaim : c));
      setDocFile(null);
      setDocDescription('');
    } catch (err) {
      console.error("Failed to upload document", err);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!selectedClaim) return;
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await customAxios.delete(`/insurance-claims/${selectedClaim.id}/documents/${docId}`);
      const updatedClaim = { 
        ...selectedClaim, 
        documents: selectedClaim.documents.filter((d: any) => d.id !== docId) 
      };
      setSelectedClaim(updatedClaim);
      setClaims(claims.map(c => c.id === updatedClaim.id ? updatedClaim : c));
    } catch (err) {
      console.error("Failed to delete document", err);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedClaim) return;
    try {
      const response = await customAxios.put(`/insurance-claims/${selectedClaim.id}`, {
        status: 'Paid',
        approved_amount: paidFormData.approved_amount,
        write_off_amount: paidFormData.write_off_amount
      });
      
      // Update local state
      setClaims(claims.map(c => c.id === selectedClaim.id ? { ...c, ...response.data } : c));
      setSelectedClaim({ ...selectedClaim, ...response.data });
      
      // Refresh stats
      const statsRes = await customAxios.get('/insurance-claims/stats');
      setStats(statsRes.data);
      setIsViewModalOpen(false);
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
          customAxios.get('/insurance/attached-policies'),
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
                  onChange={async (e) => {
                    const policyId = e.target.value;
                    setFormData({...formData, patient_insurance_id: policyId, invoice_id: ''});
                    const policy = insurances.find(ins => String(ins.id) === policyId);
                    if (policy && policy.patient_id) {
                      try {
                        const res = await customAxios.get(`/patients/${policy.patient_id}/invoices?status=Pending`);
                        setAvailableInvoices(res.data);
                      } catch (err) {
                        setAvailableInvoices([]);
                      }
                    } else {
                      setAvailableInvoices([]);
                    }
                  }}
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
                <Label>Linked Invoice (Optional)</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:opacity-50"
                  value={formData.invoice_id}
                  onChange={(e) => {
                    const invId = e.target.value;
                    const selectedInv = availableInvoices.find(inv => String(inv.id) === invId);
                    if (selectedInv) {
                      setFormData({...formData, invoice_id: invId, total_amount: selectedInv.amount, claimed_amount: selectedInv.amount});
                    } else {
                      setFormData({...formData, invoice_id: invId});
                    }
                  }}
                  disabled={!formData.patient_insurance_id}
                >
                  <option value="">{formData.patient_insurance_id ? "Select an invoice..." : "Select policy first..."}</option>
                  {availableInvoices.map((inv: any) => (
                    <option key={inv.id} value={inv.id}>
                      #{inv.id} - {formatCurrency(inv.amount)} - {inv.status}
                    </option>
                  ))}
                </select>
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                    <p className="font-medium">{formatCurrency(selectedClaim.total_amount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Claimed Amount</p>
                    <p className="font-medium">{formatCurrency(selectedClaim.claimed_amount)}</p>
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
                  {selectedClaim.write_off_amount > 0 && (
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Write-Off Amount</p>
                      <p className="font-medium text-red-600">-{formatCurrency(selectedClaim.write_off_amount)}</p>
                    </div>
                  )}
                </div>
                
                {selectedClaim.invoice?.treatments && selectedClaim.invoice.treatments.length > 0 && (
                  <div className="pt-4 border-t space-y-4">
                    <h4 className="font-medium text-sm">Procedures</h4>
                    <div className="rounded-md border">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-muted text-muted-foreground">
                          <tr>
                            <th className="px-3 py-2 font-medium">Code/Name</th>
                            <th className="px-3 py-2 font-medium">Qty</th>
                            <th className="px-3 py-2 font-medium text-right">Unit Price</th>
                            <th className="px-3 py-2 font-medium text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {selectedClaim.invoice.treatments.map((t: any) => (
                            <tr key={t.id}>
                              <td className="px-3 py-2">{t.procedure || `Procedure #${t.procedure_id}`}</td>
                              <td className="px-3 py-2">{t.quantity}</td>
                              <td className="px-3 py-2 text-right">{formatCurrency(t.unit_price)}</td>
                              <td className="px-3 py-2 text-right font-medium">{formatCurrency(t.total_amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {selectedClaim.status?.toLowerCase() !== 'paid' ? (
                  <div className="pt-4 border-t space-y-4">
                    <h4 className="font-medium text-sm">Process Payment (EOB)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Approved Amount</Label>
                        <Input 
                          type="number" step="0.01" 
                          value={paidFormData.approved_amount} 
                          onChange={e => setPaidFormData({...paidFormData, approved_amount: e.target.value})} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Write-Off (Adjustment)</Label>
                        <Input 
                          type="number" step="0.01" 
                          value={paidFormData.write_off_amount} 
                          onChange={e => setPaidFormData({...paidFormData, write_off_amount: e.target.value})} 
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Cancel</Button>
                      <Button onClick={handleMarkAsPaid} className="bg-emerald-600 hover:bg-emerald-700">Mark as Paid</Button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
                  </div>
                )}

                {/* Document Attachments Section */}
                <div className="pt-4 border-t space-y-4">
                  <h4 className="font-medium text-sm">Document Attachments</h4>
                  
                  {selectedClaim.documents && selectedClaim.documents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedClaim.documents.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center space-x-3 overflow-hidden">
                            <div className="bg-blue-50 p-2 rounded">
                              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            </div>
                            <div className="truncate">
                              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline truncate block">
                                {doc.description}
                              </a>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteDocument(doc.id)} className="text-red-500 hover:text-red-700">
                            Delete
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No documents attached.</p>
                  )}

                  <form onSubmit={handleUploadDocument} className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Input
                      type="text"
                      placeholder="Description (e.g. X-Ray)"
                      value={docDescription}
                      onChange={(e) => setDocDescription(e.target.value)}
                      required
                      className="flex-1"
                    />
                    <Input
                      type="file"
                      onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                      required
                      className="flex-1"
                    />
                    <Button type="submit" disabled={uploadingDoc}>
                      {uploadingDoc ? 'Uploading...' : 'Upload'}
                    </Button>
                  </form>
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
            <div className="text-2xl font-bold text-emerald-900">{formatCurrency(stats.paid_amount)}</div>
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
                      <td className="px-4 py-3">{formatCurrency(claim.total_amount)}</td>
                      <td className="px-4 py-3">{formatCurrency(claim.claimed_amount)}</td>
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
