"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const InsuranceClaims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch from your Laravel API:
    // fetch('/api/insurance-claims').then(res => res.json()).then(setClaims)
    
    // Using mock data for immediate visual feedback
    setTimeout(() => {
      setClaims([
        { id: 1, claim_number: 'CLM-001', patient: 'John Doe', total_amount: 500, claimed_amount: 400, status: 'pending' },
        { id: 2, claim_number: 'CLM-002', patient: 'Jane Smith', total_amount: 1200, claimed_amount: 1000, status: 'submitted' },
        { id: 3, claim_number: 'CLM-003', patient: 'Bob Brown', total_amount: 300, claimed_amount: 250, status: 'paid' },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

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
        <Button>+ New Claim</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-white shadow-sm border-indigo-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-indigo-800">Total Claims Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-900">124</div>
            <p className="text-xs text-indigo-600/80">+14% from last month</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-white shadow-sm border-emerald-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Paid Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">$45,231.00</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-white shadow-sm border-amber-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">12</div>
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
                      <td className="px-4 py-3 font-medium">{claim.patient}</td>
                      <td className="px-4 py-3">${claim.total_amount.toFixed(2)}</td>
                      <td className="px-4 py-3">${claim.claimed_amount.toFixed(2)}</td>
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
