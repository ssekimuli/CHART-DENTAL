import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  withCredentials: true, 
});

export const insuranceApi = {
  getCompanies: () => api.get('/insurance/companies'),
  
  getPatientPolicies: (patientId: number) => 
    api.get(`/insurance/patients/${patientId}/policies`),
    
  attachPolicyToPatient: (patientId: number, data: any) => 
    api.post(`/insurance/patients/${patientId}/policies`, data),
    
  setPrimaryPolicy: (patientId: number, pivotId: number) => 
    api.patch(`/insurance/patients/${patientId}/policies/${pivotId}/primary`),
    
  getBillingEstimate: (patientPolicyId: number, procedures: Array<{procedure_id: number, quantity: number}>) => 
    api.post(`/insurance/billing/estimate/${patientPolicyId}`, { procedures }),
    
  createInsuredInvoice: (patientPolicyId: number, patientId: number, procedures: Array<{procedure_id: number, quantity: number}>) => 
    api.post(`/insurance/billing/invoice/${patientPolicyId}`, { patient_id: patientId, procedures }),
};
