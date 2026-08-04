import customAxios from '../../lib/axios';

export const insuranceApi = {
  getCompanies: (search?: string) => customAxios.get('/insurance/companies', { params: { search } }),
  
  addCompany: (data: { name: string, code: string, email?: string, phone?: string }) => 
    customAxios.post('/insurance/companies', data),
    
  updateCompany: (id: number, data: { name: string, code: string, email?: string, phone?: string }) => 
    customAxios.put(`/insurance/companies/${id}`, data),
    
  deleteCompany: (id: number) => 
    customAxios.delete(`/insurance/companies/${id}`),
  
  updateCompanyStatus: (id: number, status: string) =>
    customAxios.patch(`/insurance/companies/${id}/status`, { status }),

  getPackages: (companyId?: number) => 
    customAxios.get('/insurance/packages', { params: { company_id: companyId } }),
    
  addPackage: (data: any) => 
    customAxios.post('/insurance/packages', data),
    
  updatePackage: (id: number, data: any) => 
    customAxios.put(`/insurance/packages/${id}`, data),
    
  deletePackage: (id: number) => 
    customAxios.delete(`/insurance/packages/${id}`),
    
  updatePackageStatus: (id: number, status: string) =>
    customAxios.patch(`/insurance/packages/${id}/status`, { status }),
    
  getPackageTreatments: (packageId: number) => 
    customAxios.get(`/insurance/packages/${packageId}/treatments`),
    
  addPackageTreatment: (packageId: number, data: any) => 
    customAxios.post(`/insurance/packages/${packageId}/treatments`, data),
    
  removePackageTreatment: (packageId: number, id: number) => 
    customAxios.delete(`/insurance/packages/${packageId}/treatments/${id}`),
    
  getPolicies: (packageId?: number) => 
    customAxios.get('/insurance/policies', { params: { package_id: packageId } }),
    
  addPolicy: (data: any) => 
    customAxios.post('/insurance/policies', data),
    
  updatePolicy: (id: number, data: any) => 
    customAxios.put(`/insurance/policies/${id}`, data),
    
  deletePolicy: (id: number) => 
    customAxios.delete(`/insurance/policies/${id}`),
    
  updatePolicyStatus: (id: number, status: string) =>
    customAxios.patch(`/insurance/policies/${id}/status`, { status }),
    
  getProcedures: () => 
    customAxios.get('/procedures'),
  
  
  getPatientPolicies: (patientId: number) => 
    customAxios.get(`/insurance/patients/${patientId}/policies`),
    
  attachPolicyToPatient: (patientId: number, data: any) => 
    customAxios.post(`/insurance/patients/${patientId}/policies`, data),

  removePolicyFromPatient: (patientId: number, pivotId: number) => 
    customAxios.delete(`/insurance/patients/${patientId}/policies/${pivotId}`),
    
  setPrimaryPolicy: (patientId: number, pivotId: number) => 
    customAxios.patch(`/insurance/patients/${patientId}/policies/${pivotId}/primary`),
    
  getBillingEstimate: (patientPolicyId: number, procedures: Array<{procedure_id: number, quantity: number}>) => 
    customAxios.post(`/insurance/billing/estimate/${patientPolicyId}`, { procedures }),
    
  createInsuredInvoice: (patientPolicyId: number, patientId: number, procedures: Array<{procedure_id: number, quantity: number}>) => 
    customAxios.post(`/insurance/billing/invoice/${patientPolicyId}`, { patient_id: patientId, procedures }),
};
