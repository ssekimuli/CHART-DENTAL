"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import customAxios from '@/lib/axios';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const InsuranceClaims = () => {
  const [claims, setClaims] = useState<any[]>([]);
  const [stats, setStats] = useState({ total_claims: 0, paid_amount: 0, pending_count: 0 });
  const [insurances, setInsurances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    patient_insurance_id: '',
    claim_number: '',
    total_amount: '',
    claimed_amount: '',
    status: 'pending'
  });

  useEffect(() => {
    const fetchClaimsAndStats = async () => {
      try {
        const [claimsRes, statsRes, insurancesRes] = await Promise.all([
          customAxios.get('/insurance-claims'),
          customAxios.get('/insurance-claims/stats'),
          customAxios.get('/patient-insurances')
        ]);
        setClaims(claimsRes.data);
        setStats(statsRes.data);
        setInsurances(insurancesRes.data);
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
        claim_number: '',
        total_amount: '',
        claimed_amount: '',
        status: 'pending'
      });
    } catch (error) {
      console.error("Failed to create claim:", error);
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
                        <Button variant="ghost" size="sm">View</Button>
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
