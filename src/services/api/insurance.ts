import customAxios from '../../lib/axios';

export const insuranceApi = {
  getCompanies: () => customAxios.get('/insurance/companies'),
  
  addCompany: (data: { name: string, code: string, email?: string, phone?: string }) => 
    customAxios.post('/insurance/companies', data),
  
  getPackages: (companyId?: number) => 
    customAxios.get('/insurance/packages', { params: { company_id: companyId } }),
    
  addPackage: (data: any) => 
    customAxios.post('/insurance/packages', data),
    
  getPolicies: (packageId?: number) => 
    customAxios.get('/insurance/policies', { params: { package_id: packageId } }),
    
  addPolicy: (data: any) => 
    customAxios.post('/insurance/policies', data),
  
  
  getPatientPolicies: (patientId: number) => 
    customAxios.get(`/insurance/patients/${patientId}/policies`),
    
  attachPolicyToPatient: (patientId: number, data: any) => 
    customAxios.post(`/insurance/patients/${patientId}/policies`, data),
    
  setPrimaryPolicy: (patientId: number, pivotId: number) => 
    customAxios.patch(`/insurance/patients/${patientId}/policies/${pivotId}/primary`),
    
  getBillingEstimate: (patientPolicyId: number, procedures: Array<{procedure_id: number, quantity: number}>) => 
    customAxios.post(`/insurance/billing/estimate/${patientPolicyId}`, { procedures }),
    
  createInsuredInvoice: (patientPolicyId: number, patientId: number, procedures: Array<{procedure_id: number, quantity: number}>) => 
    customAxios.post(`/insurance/billing/invoice/${patientPolicyId}`, { patient_id: patientId, procedures }),
};
