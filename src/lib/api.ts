

import { 
    patients as allPatients,
    appointments as allAppointments,
    invoices as allInvoices,
    chartData,
    employees as allEmployees,
    payrolls as mockPayrolls,
    branches as mockBranches,
    inventory,
    labOrders as allLabOrders,
    treatments as allTreatments,
    attendance as allAttendance,
    leaveRequests as allLeaveRequests,
    staffAdvances as allStaffAdvances,
    expenses as allExpenses,
    roles as mockRoles
} from '@/lib/data';
import type { Patient, Appointment, Invoice, ChartData, Employee, Payroll, Branch, InventoryItem, LaboratoryOrder, BasePatient, InvoiceTreatment, OtherCharge, SystemTreatment, PaymentMethod, PaymentTransaction, AttendanceRecord, LeaveRequest, StaffAdvance, StaffAdvanceStatus, Expense, ExpenseCategory, RolePermissions, Permission, DentalRecord, PeriodontalRecord, OcclusalRecord, SoftTissueRecord, OrthodonticRecord, Treatment, DentalCondition, PatientImage, FinancialSummary, CurrentUser, ProfileData, AppointmentStatus, EmployeeRole } from '@/lib/types';
import type { DateRange } from 'react-day-picker';
import { format, parse } from "date-fns";
import { speak } from '@/ai/flows/speak';
import { clearCurrentUser, getAuthToken, setCurrentUser, currentUser as userDetails } from './user';
import customAxios from './axios';
import axios from 'axios';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


// --- READ OPERATIONS ---

export const login = async (email: string, password?: string): Promise<CurrentUser | null> => {
    console.log('API CALL: login', { email });
    
    try {
        const response = await customAxios.post('/login', { email, password });
        const { user, token } = response.data;
        setCurrentUser(user, token);
        return user;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Login failed:', error.response?.data);
        } else {
            console.error("An unexpected error occurred during login:", error);
        }
        clearCurrentUser();
        return null;
    }
}

export const logout = async (): Promise<void> => {
    console.log('API CALL: logout');
    try {
        await customAxios.post('/logout');
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Logout failed:', error.response?.data);
        } else {
            console.error('An unexpected error occurred during logout:', error);
        }
        // We still clear the local session even if server logout fails
    }
};

export const getProfileData = async (): Promise<ProfileData | null> => {
    console.log('API CALL: getProfileData');
    try {
        const response = await customAxios.get('/profile');
        const data = response.data;

        const employee: Employee = {
            id: String(data.id),
            name: data.name,
            avatar: data.avatar,
            email: data.email,
            role: data.role,
            status: data.status,
            salary: parseFloat(data.salary),
            hire_date: data.hire_date ? data.hire_date.split('T')[0] : '',
            branchId: String(data.branch_id),
            branch: data.branch,
        };

        const payrolls: Payroll[] = data.payrolls.map((p: any) => ({
            id: p.id,
            employeeId: p.employee_id,
            employeeName: p.employee_name,
            payPeriod: p.pay_period,
            grossPay: parseFloat(p.gross_pay),
            deductions: parseFloat(p.deductions),
            netPay: parseFloat(p.net_pay),
            payDate: p.pay_date ? p.pay_date.split('T')[0] : '',
            status: p.status,
            branchId: p.branch_id,
        }));

        return {
            employee: employee,
            stats: data.stats,
            payrolls: payrolls,
        };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to fetch profile data:', error.response?.data);
        } else {
            console.error("An unexpected error occurred during profile fetch:", error);
        }
        return null;
    }
}


export const getBranches = async (): Promise<Branch[]> => {
    console.log('API CALL: getBranches');
    try {
        const response = await customAxios.get('/all-branch');
        // The API returns 'id' as a number, which matches our updated type.
        return response.data.map((branch: any) => ({ ...branch, id: branch.id }));
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to fetch branches:', error.response?.data);
        } else {
            console.error("An unexpected error occurred while fetching branches:", error);
        }
        return []; // Return empty array on error
    }
}

export const getPatients = async (branchId?: string | number): Promise<Patient[]> => {
    console.log('API CALL: getPatients', { branchId });
    await delay(100);
    let localPatients = allPatients;
    if (branchId) {
        localPatients = localPatients.filter(p => String(p.branchId) === String(branchId));
    }
    return JSON.parse(JSON.stringify(localPatients));
}

export const getPatientById = async (id: string | number): Promise<Patient | undefined> => {
    console.log('API CALL: getPatientById', { id });
    await delay(100);
    return JSON.parse(JSON.stringify(allPatients.find(p => String(p.id) === String(id))));
}

export const getAppointments = async (): Promise<Appointment[]> => {
    console.log('API CALL: getAppointments');
    await delay(150);
    return JSON.parse(JSON.stringify(allAppointments));
}

type GetInvoicesFilters = {
    branchId?: string | number;
    searchQuery?: string;
    dateRange?: DateRange;
};

export const getInvoices = async (filters?: GetInvoicesFilters): Promise<Invoice[]> => {
    console.log('API CALL: getInvoices', { filters });
    await delay(200);
    let localInvoices = allInvoices;

    if (filters?.branchId) {
        localInvoices = localInvoices.filter(i => String(i.branchId) === String(filters.branchId));
    }
    
    if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        localInvoices = localInvoices.filter(invoice => 
            invoice.patientName.toLowerCase().includes(query) ||
            String(invoice.id).toLowerCase().includes(query)
        );
    }

    if (filters?.dateRange?.from) {
        localInvoices = localInvoices.filter(invoice => {
            const issueDate = new Date(invoice.issueDate);
            return issueDate >= filters.dateRange!.from!;
        });
    }
     if (filters?.dateRange?.to) {
        localInvoices = localInvoices.filter(invoice => {
            const issueDate = new Date(invoice.issueDate);
            return issueDate <= filters.dateRange!.to!;
        });
    }


    return JSON.parse(JSON.stringify(localInvoices));
}

export const getInvoiceById = async (id: string | number): Promise<Invoice | undefined> => {
    console.log('API CALL: getInvoiceById', { id });
    await delay(100);
    return JSON.parse(JSON.stringify(allInvoices.find(i => String(i.id) === String(id))));
}

export const getEmployees = async (branchId?: string | number): Promise<Employee[]> => {
    console.log('API CALL: getEmployees', { branchId });
    try {
        const params: { branch_id?: string | number } = {};
        if (branchId) {
            params.branch_id = branchId;
        }
        const response = await customAxios.get('/employees', { params });
        // Map API response to frontend type
        return response.data.map((emp: any) => ({
            id: String(emp.id),
            name: emp.name,
            avatar: emp.avatar,
            email: emp.email,
            role: emp.role,
            status: emp.status,
            salary: parseFloat(emp.salary),
            hire_date: emp.hire_date ? emp.hire_date.split('T')[0] : '', // Format date to YYYY-MM-DD
            branchId: String(emp.branch_id)
        }));
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to fetch employees:', error.response?.data);
        } else {
            console.error("An unexpected error occurred while fetching employees:", error);
        }
        return [];
    }
}

export const getEmployeeById = async (id: string | number): Promise<ProfileData | undefined> => {
    console.log('API CALL: getEmployeeById', { id });
    try {
        const response = await customAxios.get(`/employees/${id}`);
        const emp = response.data;
        if (!emp) return undefined;

        const employee: Employee = {
            id: String(emp.id),
            name: emp.name,
            avatar: emp.avatar,
            email: emp.email,
            role: emp.role,
            status: emp.status,
            salary: parseFloat(emp.salary),
            hire_date: emp.hire_date ? emp.hire_date.split('T')[0] : '',
            branchId: String(emp.branch_id),
            branchName: emp.branch?.name,
            branch: emp.branch
        };
        
        const payrolls: Payroll[] = emp.payrolls.map((p: any) => ({
            id: p.id,
            employeeId: p.employee_id,
            employeeName: p.employee_name,
            payPeriod: p.pay_period,
            grossPay: parseFloat(p.gross_pay),
            deductions: parseFloat(p.deductions),
            netPay: parseFloat(p.net_pay),
            payDate: p.pay_date ? p.pay_date.split('T')[0] : '',
            status: p.status,
            branchId: p.branch_id,
        }));

        return {
            employee,
            payrolls,
            stats: emp.stats
        };

    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status !== 404) {
            console.error(`Failed to fetch employee ${id}:`, error.response?.data);
        } else if (!axios.isAxiosError(error)) {
             console.error("An unexpected error occurred while fetching employee:", error);
        }
        return undefined;
    }
}

export const getPayrolls = async (branchId?: string | number): Promise<Payroll[]> => {
    console.log('API CALL: getPayrolls', { branchId });
     try {
        const params: { branch_id?: string | number } = {};
        if (branchId) {
            params.branch_id = branchId;
        }
        const response = await customAxios.get('/management/payrolls', { params });
        // Map API response to frontend type
        return response.data.map((p: any) => ({
            id: p.id,
            employeeId: p.employee_id,
            employeeName: p.employee_name,
            payPeriod: p.pay_period,
            grossPay: parseFloat(p.gross_pay),
            deductions: parseFloat(p.deductions),
            netPay: parseFloat(p.net_pay),
            payDate: p.pay_date ? p.pay_date.split('T')[0] : '',
            status: p.status,
            branchId: p.branch_id,
        }));
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to fetch payrolls:', error.response?.data);
        } else {
            console.error("An unexpected error occurred while fetching payrolls:", error);
        }
        return [];
    }
}

export const getInventory = async (branchId?: string | number): Promise<InventoryItem[]> => {
    console.log('API CALL: getInventory', { branchId });
    await delay(100);
    let localInventory = inventory;
    if (branchId) {
        localInventory = localInventory.filter(i => String(i.branchId) === String(branchId));
    }
    return JSON.parse(JSON.stringify(localInventory));
}

export const getLabOrders = async (branchId?: string | number): Promise<LaboratoryOrder[]> => {
    console.log('API CALL: getLabOrders', { branchId });
    await delay(150);
    let localLabOrders = allLabOrders;
    if (branchId) {
        localLabOrders = localLabOrders.filter(l => String(l.branchId) === String(branchId));
    }
    return JSON.parse(JSON.stringify(localLabOrders));
}

export const getChartData = async (): Promise<ChartData[]> => {
    console.log('API CALL: getChartData');
    await delay(300);
    return JSON.parse(JSON.stringify(chartData));
}

export const getTreatments = async (): Promise<SystemTreatment[]> => {
    console.log('API CALL: getTreatments');
    await delay(50);
    return JSON.parse(JSON.stringify(allTreatments));
}

export const getAttendance = async (branchId?: string | number): Promise<AttendanceRecord[]> => {
    console.log('API CALL: getAttendance', { branchId });
    await delay(150);
    let localAttendance = allAttendance;
    if (branchId) {
        localAttendance = localAttendance.filter(a => String(a.branchId) === String(branchId));
    }
    return JSON.parse(JSON.stringify(localAttendance));
}

export const getLeaveRequests = async (branchId?: string | number): Promise<LeaveRequest[]> => {
    console.log('API CALL: getLeaveRequests', { branchId });
    await delay(150);
    let localLeaveRequests = allLeaveRequests;
    if (branchId) {
        localLeaveRequests = localLeaveRequests.filter(l => String(l.branchId) === String(branchId));
    }
    return JSON.parse(JSON.stringify(localLeaveRequests));
}

export const getStaffAdvances = async (branchId?: string | number): Promise<StaffAdvance[]> => {
    console.log('API CALL: getStaffAdvances', { branchId });
    await delay(150);
    let localAdvances = allStaffAdvances;
    if (branchId) {
        localAdvances = localAdvances.filter(s => String(s.branchId) === String(branchId));
    }
    return JSON.parse(JSON.stringify(localAdvances));
}

export const getExpenses = async (branchId?: string | number): Promise<Expense[]> => {
    console.log('API CALL: getExpenses', { branchId });
    await delay(150);
    let localExpenses = allExpenses;
    if (branchId) {
        localExpenses = localExpenses.filter(e => String(e.branchId) === String(branchId));
    }
    return JSON.parse(JSON.stringify(localExpenses));
}

export const getRoles = async (): Promise<RolePermissions[]> => {
    console.log('API CALL: getRoles');
    try {
        const response = await customAxios.get('/settings/roles');
        return response.data.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to fetch roles:', error.response?.data);
        } else {
            console.error("An unexpected error occurred while fetching roles:", error);
        }
        // Fallback to mock data on error
        return JSON.parse(JSON.stringify(mockRoles));
    }
}

export const getRolesList = async (): Promise<{id: string, name: string}[]> => {
    console.log('API CALL: getRolesList');
     try {
        const response = await customAxios.get('/roles');
        if (response.data && Array.isArray(response.data.data)) {
            return response.data.data.map((role: any) => ({ ...role, id: String(role.id) }));
        }
        return [];
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to fetch roles list:', error.response?.data);
        } else {
            console.error("An unexpected error occurred while fetching roles list:", error);
        }
        return [];
    }
}


export const getFinancialSummary = async (branchId: string | number): Promise<FinancialSummary> => {
    console.log('API CALL: getFinancialSummary', { branchId });
    await delay(300);

    const branchInvoices = allInvoices.filter(i => String(i.branchId) === String(branchId));
    const branchPayrolls = mockPayrolls.filter(p => String(p.branch_id) === String(branchId));
    const branchExpenses = allExpenses.filter(e => String(e.branchId) === String(branchId));
    
    const paidInvoices = branchInvoices.filter(i => i.status === 'Paid');
    const totalIncome = paidInvoices.reduce((sum, i) => sum + i.amount, 0);

    const payrollExpenses = branchPayrolls.reduce((sum, p) => sum + Number(p.gross_pay), 0);
    const otherExpenses = branchExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = payrollExpenses + otherExpenses;

    const netProfit = totalIncome - totalExpenses;

    const financialsByMonth: Record<string, { income: number, expense: number }> = {};

    paidInvoices.forEach(invoice => {
        const monthKey = format(new Date(invoice.issueDate), "yyyy-MM");
        if (!financialsByMonth[monthKey]) financialsByMonth[monthKey] = { income: 0, expense: 0 };
        financialsByMonth[monthKey].income += invoice.amount;
    });

    branchPayrolls.forEach(payroll => {
        const payDate = payroll.pay_date.split('T')[0];
        const monthKey = format(new Date(payDate), "yyyy-MM");
        if (!financialsByMonth[monthKey]) financialsByMonth[monthKey] = { income: 0, expense: 0 };
        financialsByMonth[monthKey].expense += Number(payroll.gross_pay);
    });

    branchExpenses.forEach(expense => {
        const monthKey = format(new Date(expense.date), "yyyy-MM");
        if (!financialsByMonth[monthKey]) financialsByMonth[monthKey] = { income: 0, expense: 0 };
        financialsByMonth[monthKey].expense += expense.amount;
    });

    const monthlyFinancials = Object.keys(financialsByMonth)
        .sort()
        .slice(-6)
        .map(monthKey => ({
            month: format(parse(monthKey, 'yyyy-MM', new Date()), 'MMM'),
            income: financialsByMonth[monthKey].income,
            expense: financialsByMonth[monthKey].expense,
        }));

    return { totalIncome, totalExpenses, netProfit, monthlyFinancials };
}

export const getTodaysQueue = async (filters: { branchId: string | number; doctorId?: string | number }): Promise<Appointment[]> => {
    console.log('API CALL: getTodaysQueue', { filters });
    await delay(150);
    const today = format(new Date(), "yyyy-MM-dd");
    let filtered = allAppointments.filter(
      (a) =>
        String(a.branchId) === String(filters.branchId) &&
        a.date === today &&
        a.status !== 'Cancelled' &&
        a.status !== 'Scheduled'
    );
  
    if (filters.doctorId) {
      filtered = filtered.filter((a) => String(a.doctorId) === String(filters.doctorId));
    }
  
    // sort by token number's numeric part
    const sorted = filtered.sort((a, b) => {
      const numA = parseInt(a.tokenNumber.replace(/\D/g, ''), 10);
      const numB = parseInt(b.tokenNumber.replace(/\D/g, ''), 10);
      return numA - numB;
    });
  
    return JSON.parse(JSON.stringify(sorted));
};


// --- WRITE OPERATIONS ---

// Patients
export const createPatient = async (data: BasePatient & { branchId: string | number }): Promise<Patient> => {
    console.log('API CALL: createPatient', { data });
    await delay(200);
    const newPatient: Patient = {
        ...data,
        id: `p${allPatients.length + 1}`,
        dentalRecords: [],
        treatmentPlans: [],
        imaging: [],
        lastVisit: new Date().toISOString().split('T')[0],
        periodontalRecords: [],
        occlusalRecords: { overbite: 0, overjet: 0, crossbite: 'None', openbite: 'None', malocclusion: 'Class I' },
        softTissueRecords: [],
        orthodonticRecords: [],
    };
    allPatients.push(newPatient);
    return newPatient;
}

export const updatePatient = async (id: string | number, data: Partial<Patient>): Promise<Patient | undefined> => {
    console.log('API CALL: updatePatient', { id, data });
    await delay(200);
    const patientIndex = allPatients.findIndex(p => String(p.id) === String(id));
    if (patientIndex > -1) {
        allPatients[patientIndex] = { ...allPatients[patientIndex], ...data };
        return allPatients[patientIndex];
    }
    return undefined;
}

export const deletePatient = async (id: string | number): Promise<{ success: boolean }> => {
    console.log('API CALL: deletePatient', { id });
    await delay(200);
    const initialLength = allPatients.length;
    const newPatients = allPatients.filter(p => String(p.id) !== String(id));
    allPatients.length = 0;
    Array.prototype.push.apply(allPatients, newPatients);
    return { success: allPatients.length < initialLength };
}

export const addImageToPatient = async (patientId: string | number, image: Omit<PatientImage, 'date'>): Promise<Patient | undefined> => {
    console.log('API CALL: addImageToPatient', { patientId, image });
    await delay(200);
    const patientIndex = allPatients.findIndex(p => String(p.id) === String(patientId));
    if (patientIndex > -1) {
        const patient = allPatients[patientIndex];
        const newImage: PatientImage = {
            ...image,
            date: new Date().toISOString().split('T')[0],
        }
        patient.imaging.push(newImage);
        return patient;
    }
    return undefined;
}

export const saveDentalRecord = async (patientId: string | number, record: DentalRecord): Promise<Patient | undefined> => {
    console.log('API CALL: saveDentalRecord. Request Body:', { patientId, record });
    await delay(150);
    const patientIndex = allPatients.findIndex(p => String(p.id) === String(patientId));
    if (patientIndex > -1) {
        const patient = allPatients[patientIndex];
        const recordIndex = patient.dentalRecords.findIndex(r => r.toothId === record.toothId);
        const newRecords = [...patient.dentalRecords];
        if (recordIndex > -1) {
            newRecords[recordIndex] = record;
        } else {
            newRecords.push(record);
        }
        allPatients[patientIndex] = { ...patient, dentalRecords: newRecords };
        return allPatients[patientIndex];
    }
    return undefined;
}

export const savePeriodontalRecord = async (patientId: string | number, records: PeriodontalRecord): Promise<Patient | undefined> => {
    console.log('API CALL: savePeriodontalRecord', { patientId, recordsCount: records.length });
    await delay(150);
    const patientIndex = allPatients.findIndex(p => String(p.id) === String(patientId));
    if (patientIndex > -1) {
        allPatients[patientIndex].periodontalRecords = records;
        return allPatients[patientIndex];
    }
    return undefined;
}

export const saveOcclusalRecord = async (patientId: string | number, record: OcclusalRecord): Promise<Patient | undefined> => {
    console.log('API CALL: saveOcclusalRecord', { patientId, record });
    await delay(150);
    const patientIndex = allPatients.findIndex(p => String(p.id) === String(patientId));
    if (patientIndex > -1) {
        allPatients[patientIndex].occlusalRecords = record;
        return allPatients[patientIndex];
    }
    return undefined;
};

export const addTreatment = async (patientId: string | number, treatmentData: Omit<Treatment, 'id' | 'date'>, condition?: DentalCondition): Promise<Patient | undefined> => {
    console.log('API CALL: addTreatment', { patientId, treatmentData, condition });
    await delay(200);
    const patientIndex = allPatients.findIndex(p => String(p.id) === String(patientId));
    if (patientIndex > -1) {
        const patient = allPatients[patientIndex];
        const newPlan: Treatment = {
            ...treatmentData,
            id: `t${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
        };

        if (condition && treatmentData.tooth) {
            const newRecord: DentalRecord = { toothId: treatmentData.tooth, condition: condition, notes: `Condition related to treatment: ${treatmentData.procedure}` };
            const recordIndex = patient.dentalRecords.findIndex(r => r.toothId === treatmentData.tooth);
            if (recordIndex > -1) {
                patient.dentalRecords[recordIndex] = newRecord;
            } else {
                patient.dentalRecords.push(newRecord);
            }
        }
        patient.treatmentPlans.push(newPlan);
        return patient;
    }
    return undefined;
}

export const updateTreatment = async (patientId: string | number, treatment: Treatment): Promise<Patient | undefined> => {
    console.log('API CALL: updateTreatment', { patientId, treatment });
    await delay(200);
    const patientIndex = allPatients.findIndex(p => String(p.id) === String(patientId));
    if (patientIndex > -1) {
        const patient = allPatients[patientIndex];
        const treatmentIndex = patient.treatmentPlans.findIndex(t => String(t.id) === String(treatment.id));
        if (treatmentIndex > -1) {
            patient.treatmentPlans[treatmentIndex] = treatment;
        }
        return patient;
    }
    return undefined;
}

export const deleteTreatment = async (patientId: string | number, treatmentId: string | number): Promise<Patient | undefined> => {
    console.log('API CALL: deleteTreatment', { patientId, treatmentId });
    await delay(200);
    const patientIndex = allPatients.findIndex(p => String(p.id) === String(patientId));
    if (patientIndex > -1) {
        const patient = allPatients[patientIndex];
        patient.treatmentPlans = patient.treatmentPlans.filter(t => String(t.id) !== String(treatmentId));
        return patient;
    }
    return undefined;
}

export const saveOrthodonticRecord = async (patientId: string | number, recordData: Omit<OrthodonticRecord, 'id'>): Promise<Patient | undefined> => {
    console.log('API CALL: saveOrthodonticRecord', { patientId, recordData });
    await delay(200);
    const patientIndex = allPatients.findIndex(p => String(p.id) === String(patientId));
    if (patientIndex > -1) {
        const patient = allPatients[patientIndex];
        const newRecord: OrthodonticRecord = {
            ...recordData,
            id: `ortho${Date.now()}`,
        };
        patient.orthodonticRecords.push(newRecord);
        patient.orthodonticRecords.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return patient;
    }
    return undefined;
}

export const updateOrthodonticRecord = async (patientId: string | number, record: OrthodonticRecord): Promise<Patient | undefined> => {
    console.log('API CALL: updateOrthodonticRecord', { patientId, record });
    await delay(200);
    const patientIndex = allPatients.findIndex(p => String(p.id) === String(patientId));
    if (patientIndex > -1) {
        const patient = allPatients[patientIndex];
        const recordIndex = patient.orthodonticRecords.findIndex(r => String(r.id) === String(record.id));
        if (recordIndex > -1) {
            patient.orthodonticRecords[recordIndex] = record;
            patient.orthodonticRecords.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
        return patient;
    }
    return undefined;
}

export const deleteOrthodonticRecord = async (patientId: string | number, recordId: string | number): Promise<Patient | undefined> => {
    console.log('API CALL: deleteOrthodonticRecord', { patientId, recordId });
    await delay(200);
    const patientIndex = allPatients.findIndex(p => String(p.id) === String(patientId));
    if (patientIndex > -1) {
        const patient = allPatients[patientIndex];
        patient.orthodonticRecords = patient.orthodonticRecords.filter(r => String(r.id) !== String(recordId));
        return patient;
    }
    return undefined;
}

export const saveSoftTissueRecord = async (patientId: string | number, recordData: Omit<SoftTissueRecord, 'id'>): Promise<Patient | undefined> => {
    console.log('API CALL: saveSoftTissueRecord', { patientId, recordData });
    await delay(200);
    const patientIndex = allPatients.findIndex(p => String(p.id) === String(patientId));
    if (patientIndex > -1) {
        const patient = allPatients[patientIndex];
        const newRecord: SoftTissueRecord = {
            ...recordData,
            id: `soft${Date.now()}`,
        };
        patient.softTissueRecords.push(newRecord);
        patient.softTissueRecords.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return patient;
    }
    return undefined;
}

export const updateSoftTissueRecord = async (patientId: string | number, record: SoftTissueRecord): Promise<Patient | undefined> => {
    console.log('API CALL: updateSoftTissueRecord', { patientId, record });
    await delay(200);
    const patientIndex = allPatients.findIndex(p => String(p.id) === String(patientId));
    if (patientIndex > -1) {
        const patient = allPatients[patientIndex];
        const recordIndex = patient.softTissueRecords.findIndex(r => String(r.id) === String(record.id));
        if (recordIndex > -1) {
            patient.softTissueRecords[recordIndex] = record;
            patient.softTissueRecords.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
        return patient;
    }
    return undefined;
}

export const deleteSoftTissueRecord = async (patientId: string | number, recordId: string | number): Promise<Patient | undefined> => {
    console.log('API CALL: deleteSoftTissueRecord', { patientId, recordId });
    await delay(200);
    const patientIndex = allPatients.findIndex(p => String(p.id) === String(patientId));
    if (patientIndex > -1) {
        const patient = allPatients[patientIndex];
        patient.softTissueRecords = patient.softTissueRecords.filter(r => String(r.id) !== String(recordId));
        return patient;
    }
    return undefined;
}


// Appointments
export const createAppointment = async (data: Omit<Appointment, 'id'>): Promise<Appointment> => {
    console.log('API CALL: createAppointment', { data });
    await delay(200);
    const newAppointment: Appointment = {
        ...data,
        id: `a${allAppointments.length + 1}`,
    };
    allAppointments.push(newAppointment);
    return newAppointment;
}

export const updateAppointment = async (id: string | number, data: Partial<Appointment>): Promise<Appointment | undefined> => {
    console.log('API CALL: updateAppointment', { id, data });
    await delay(200);
    const appointmentIndex = allAppointments.findIndex(a => String(a.id) === String(id));
    if (appointmentIndex > -1) {
        allAppointments[appointmentIndex] = { ...allAppointments[appointmentIndex], ...data };
        return allAppointments[appointmentIndex];
    }
    return undefined;
}

export const deleteAppointment = async (id: string | number): Promise<{ success: boolean }> => {
    console.log('API CALL: deleteAppointment', { id });
    await delay(200);
    const initialLength = allAppointments.length;
    const newAppointments = allAppointments.filter(a => String(a.id) !== String(id));
    allAppointments.length = 0;
    Array.prototype.push.apply(allAppointments, newAppointments);
    return { success: allAppointments.length < initialLength };
}

// Invoices
export const createInvoice = async (data: Omit<Invoice, 'id' | 'amount' | 'paidAmount' | 'patientName'> & { branchId: string | number, treatments: InvoiceTreatment[] }): Promise<Invoice> => {
    console.log('API CALL: createInvoice', { data });
    await delay(200);
    const patient = allPatients.find(p => String(p.id) === String(data.patientId));
    if (!patient) throw new Error("Patient not found");

    const treatmentsTotal = data.treatments.reduce((sum, t) => sum + t.cost, 0);
    const otherChargesTotal = (data.otherCharges || []).reduce((sum, charge) => sum + charge.amount, 0);
    const amount = treatmentsTotal + otherChargesTotal;

    const newInvoice: Invoice = {
        ...data,
        id: `inv${allInvoices.length + 1}`,
        patientName: patient.name,
        amount,
        paidAmount: 0,
        transactions: [],
    };
    allInvoices.unshift(newInvoice);

    // Mark treatments in patient's plan as billed
    patient.treatmentPlans.forEach(tp => {
        if (data.treatments.some(it => it.procedure === tp.procedure && !tp.invoiceId)) {
            tp.invoiceId = newInvoice.id;
        }
    });

    return newInvoice;
}

export const updateInvoice = async (id: string | number, data: Partial<Omit<Invoice, 'amount' | 'id'>>): Promise<Invoice | undefined> => {
    console.log('API CALL: updateInvoice', { id, data });
    await delay(200);
    const invoiceIndex = allInvoices.findIndex(i => String(i.id) === String(id));

    if (invoiceIndex > -1) {
        const originalInvoice = allInvoices[invoiceIndex];
        const treatments = data.treatments || originalInvoice.treatments;
        const treatmentsTotal = treatments.reduce((sum, t) => sum + t.cost, 0);
        
        const otherCharges = data.otherCharges ?? originalInvoice.otherCharges ?? [];
        const otherChargesTotal = otherCharges.reduce((sum, charge) => sum + charge.amount, 0);
        const amount = treatmentsTotal + otherChargesTotal;

        const updatedInvoice = { ...originalInvoice, ...data, amount, treatments, otherCharges };
        allInvoices[invoiceIndex] = updatedInvoice;
        return updatedInvoice;
    }
    return undefined;
}

export const processPayment = async (invoiceId: string | number, paymentAmount: number, method: string): Promise<Invoice | undefined> => {
    console.log('API CALL: processPayment', { invoiceId, paymentAmount, method });
    await delay(300);
    const invoiceIndex = allInvoices.findIndex(i => String(i.id) === String(invoiceId));
    if (invoiceIndex > -1) {
        const originalInvoice = allInvoices[invoiceIndex];
        const newPaidAmount = originalInvoice.paidAmount + paymentAmount;
        const newStatus = newPaidAmount >= originalInvoice.amount ? 'Paid' : 'Pending';
        
        const newTransaction: PaymentTransaction = {
            id: `txn_${(originalInvoice.transactions?.length || 0) + 1}_${originalInvoice.id}`,
            date: new Date().toISOString().split('T')[0],
            amount: paymentAmount,
            method: method as PaymentMethod
        };

        const updatedTransactions = [...(originalInvoice.transactions || []), newTransaction];

        const updatedInvoice = { 
            ...originalInvoice, 
            paidAmount: newPaidAmount,
            status: newStatus,
            paymentMethod: method as any,
            transactions: updatedTransactions
        };
        allInvoices[invoiceIndex] = updatedInvoice;
        return updatedInvoice;
    }
    return undefined;
}

export const deleteInvoice = async (id: string | number): Promise<{ success: boolean }> => {
    console.log('API CALL: deleteInvoice', { id });
    await delay(200);
    const initialLength = allInvoices.length;
    const newInvoices = allInvoices.filter(i => String(i.id) !== String(id));
    allInvoices.length = 0;
    Array.prototype.push.apply(allInvoices, newInvoices);
    return { success: allInvoices.length < initialLength };
}


// Employees
export const createEmployee = async (data: Omit<Employee, 'id'>): Promise<Employee> => {
    console.log('API CALL: createEmployee', { data });
    const requestBody = {
        name: data.name,
        avatar: data.avatar,
        email: data.email,
        role_id: parseInt(data.role as string, 10),
        salary: data.salary,
        hire_date: data.hire_date,
        branch_id: data.branchId,
    };
    try {
        const response = await customAxios.post('/employees', requestBody);
        const newEmployee = response.data;
        
        const feEmployee: Employee = {
            id: String(newEmployee.id),
            name: newEmployee.name,
            avatar: newEmployee.avatar,
            email: newEmployee.email,
            role: newEmployee.role,
            status: newEmployee.status,
            salary: parseFloat(newEmployee.salary),
            hire_date: newEmployee.hire_date.split('T')[0],
            branchId: String(newEmployee.branch_id),
        };
        
        allEmployees.push(feEmployee);
        return feEmployee;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to create employee:', error.response?.data);
            // Optionally re-throw or handle validation errors
            throw new Error(error.response?.data?.message || "Failed to create employee");
        } else {
            console.error("An unexpected error occurred during employee creation:", error);
            throw error;
        }
    }
}


export const updateEmployee = async (id: string | number, data: Partial<Employee>): Promise<Employee | undefined> => {
    console.log('API CALL: updateEmployee', { id, data });
    
    // Create a mutable copy of the data to avoid modifying the original object
    const requestData: Partial<Employee> & { role_id?: number, branch_id?: number } = { ...data };

    // Remap frontend keys to backend keys
    const requestBody: { [key: string]: any } = {};
    if (requestData.branchId) {
        requestBody.branch_id = parseInt(String(requestData.branchId), 10);
        delete requestData.branchId;
    }
    if (requestData.role) {
        requestBody.role_id = parseInt(requestData.role as string, 10);
        delete requestData.role;
    }
    
    // Copy the rest of the properties
    Object.assign(requestBody, requestData);
    
    try {
        const response = await customAxios.put(`/employees/${id}`, requestBody);
        const updatedEmployeeData = response.data;
        
        // Map the response back to the frontend Employee type
        const feEmployee: Employee = {
            id: String(updatedEmployeeData.id),
            name: updatedEmployeeData.name,
            avatar: updatedEmployeeData.avatar,
            email: updatedEmployeeData.email,
            role: updatedEmployeeData.role,
            status: updatedEmployeeData.status,
            salary: parseFloat(updatedEmployeeData.salary),
            hire_date: updatedEmployeeData.hire_date ? updatedEmployeeData.hire_date.split('T')[0] : '',
            branchId: String(updatedEmployeeData.branch_id),
        };

        // Update the local cache
        const employeeIndex = allEmployees.findIndex(e => String(e.id) === String(id));
        if (employeeIndex > -1) {
            allEmployees[employeeIndex] = feEmployee;
        } else {
            allEmployees.push(feEmployee);
        }

        return feEmployee;

    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Failed to update employee ${id}:`, error.response?.data);
            throw new Error(error.response?.data?.message || "Failed to update employee");
        } else {
            console.error("An unexpected error occurred during employee update:", error);
            throw error;
        }
    }
}

export const deleteEmployee = async (id: string | number): Promise<{ success: boolean }> => {
    console.log('API CALL: deleteEmployee', { id });
    try {
        const response = await customAxios.delete(`/employees/${id}`);
        if (response.data.success) {
            // Also remove from local mock array to keep UI in sync without a full re-fetch
            const employeeIndex = allEmployees.findIndex(e => String(e.id) === String(id));
            if (employeeIndex > -1) {
                allEmployees.splice(employeeIndex, 1);
            }
        }
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Failed to delete employee ${id}:`, error.response?.data);
        } else {
            console.error("An unexpected error occurred during employee deletion:", error);
        }
        return { success: false };
    }
}


// Branches
export const createBranch = async (data: Omit<Branch, 'id'>): Promise<Branch> => {
    console.log('API CALL: createBranch', { data });
    await delay(200);
    const newBranch: Branch = {
        ...data,
        id: mockBranches.length + 1
    };
    mockBranches.push(newBranch);
    return newBranch;
}

// Inventory
export const createInventoryItem = async (data: Omit<InventoryItem, 'id' | 'status'>): Promise<InventoryItem> => {
    console.log('API CALL: createInventoryItem', { data });
    await delay(200);
    const newItem: InventoryItem = {
        ...data,
        id: `item${inventory.length + 1}`,
        status: data.stock > data.reorderLevel ? 'In Stock' : data.stock > 0 ? 'Low Stock' : 'Out of Stock'
    };
    inventory.push(newItem);
    return newItem;
}

// Lab Orders
export const createLabOrder = async (data: Omit<LaboratoryOrder, 'id'>): Promise<LaboratoryOrder> => {
    console.log('API CALL: createLabOrder', { data });
    await delay(200);
    const newOrder: LaboratoryOrder = {
        ...data,
        id: `lab${allLabOrders.length + 1}`,
    };
    allLabOrders.push(newOrder);
    return newOrder;
}

// Payroll
export const createPayroll = async (data: Omit<Payroll, 'id' | 'employeeName'>): Promise<Payroll> => {
    console.log('API CALL: createPayroll', { data });

    const requestBody = {
        employee_id: data.employeeId,
        gross_pay: data.grossPay,
        deductions: data.deductions,
        net_pay: data.netPay,
        pay_date: data.payDate,
        pay_period: data.payPeriod,
        branch_id: data.branchId
    };

    try {
        const response = await customAxios.post('/management/payrolls', requestBody);
        const newPayrollData = response.data;
        
        const fePayroll: Payroll = {
            id: newPayrollData.id,
            employeeId: newPayrollData.employee_id,
            employeeName: newPayrollData.employee_name,
            payPeriod: newPayrollData.pay_period,
            grossPay: parseFloat(newPayrollData.gross_pay),
            deductions: parseFloat(newPayrollData.deductions),
            netPay: parseFloat(newPayrollData.net_pay),
            payDate: newPayrollData.pay_date.split('T')[0],
            status: newPayrollData.status,
            branchId: newPayrollData.branch_id,
        };

        mockPayrolls.unshift(fePayroll); // Add to local mock data for UI update
        return fePayroll;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to create payroll:', error.response?.data);
            throw new Error(error.response?.data?.message || "Failed to create payroll");
        } else {
            console.error("An unexpected error occurred during payroll creation:", error);
            throw error;
        }
    }
}


// Attendance
export const markAttendance = async(data: Omit<AttendanceRecord, 'id' | 'employeeName'>): Promise<AttendanceRecord> => {
    console.log('API CALL: markAttendance', { data });
    await delay(200);
    const employee = allEmployees.find(e => String(e.id) === String(data.employeeId));
    if (!employee) throw new Error("Employee not found");

    const existingIndex = allAttendance.findIndex(
        att => att.employeeId === data.employeeId && att.date === data.date
    );

    if (existingIndex > -1) {
        const updatedRecord = { ...allAttendance[existingIndex], ...data, employeeName: employee.name };
        allAttendance[existingIndex] = updatedRecord;
        return updatedRecord;
    } else {
        const newRecord: AttendanceRecord = {
            ...data,
            id: `att${allAttendance.length + 1}`,
            employeeName: employee.name,
        };
        allAttendance.push(newRecord);
        return newRecord;
    }
}

// Leave
export const createLeaveRequest = async (data: Omit<LeaveRequest, 'id' | 'employeeName' | 'status'>): Promise<LeaveRequest> => {
    console.log('API CALL: createLeaveRequest', { data });
    await delay(200);
    const employee = allEmployees.find(e => String(e.id) === String(data.employeeId));
    if (!employee) throw new Error("Employee not found");

    const newRequest: LeaveRequest = {
        ...data,
        id: `leave${allLeaveRequests.length + 1}`,
        employeeName: employee.name,
        status: 'Pending',
    };
    allLeaveRequests.push(newRequest);
    return newRequest;
}

export const updateLeaveRequestStatus = async (id: string | number, status: LeaveRequest['status']): Promise<LeaveRequest | undefined> => {
    console.log('API CALL: updateLeaveRequestStatus', { id, status });
    await delay(200);
    const requestIndex = allLeaveRequests.findIndex(req => String(req.id) === String(id));
    if (requestIndex > -1) {
        allLeaveRequests[requestIndex] = { ...allLeaveRequests[requestIndex], status };
        return allLeaveRequests[requestIndex];
    }
    return undefined;
}

// Staff Advances
export const createStaffAdvance = async (data: Omit<StaffAdvance, 'id' | 'employeeName' | 'status'>): Promise<StaffAdvance> => {
    console.log('API CALL: createStaffAdvance', { data });
    await delay(200);
    const employee = allEmployees.find(e => String(e.id) === String(data.employeeId));
    if (!employee) throw new Error("Employee not found");

    const newAdvance: StaffAdvance = {
        ...data,
        id: `adv${allStaffAdvances.length + 1}`,
        employeeName: employee.name,
        status: 'Pending',
    };
    allStaffAdvances.push(newAdvance);
    return newAdvance;
}

export const updateStaffAdvanceStatus = async (id: string | number, status: StaffAdvanceStatus): Promise<StaffAdvance | undefined> => {
    console.log('API CALL: updateStaffAdvanceStatus', { id, status });
    await delay(200);
    const advanceIndex = allStaffAdvances.findIndex(adv => String(adv.id) === String(id));
    if (advanceIndex > -1) {
        allStaffAdvances[advanceIndex] = { ...allStaffAdvances[advanceIndex], status };
        return allStaffAdvances[advanceIndex];
    }
    return undefined;
}

// Expenses
export const createExpense = async (data: Omit<Expense, 'id'>): Promise<Expense> => {
    console.log('API CALL: createExpense', { data });
    await delay(200);
    const newExpense: Expense = {
        ...data,
        id: `exp${allExpenses.length + 1}`,
    };
    allExpenses.unshift(newExpense);
    return newExpense;
}


// Roles
export const updateRole = async (roleId: string | number, permissions: Permission[]): Promise<RolePermissions | undefined> => {
    console.log('API CALL: updateRole', { roleId, permissions });
    try {
        const response = await customAxios.put(`/settings/roles/${roleId}`, { permissions });
        return response.data.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Failed to update role ${roleId}:`, error.response?.data);
        } else {
            console.error("An unexpected error occurred during role update:", error);
        }
        return undefined;
    }
}

export const createRole = async (name: string): Promise<{id: string, name: string}> => {
    console.log('API CALL: createRole', { name });
    // This is a mock implementation
    await delay(200);
    const newRole = { id: `role${mockRoles.length + 1}`, name };
    mockRoles.push({ ...newRole, permissions: [] });
    return newRole;
}

export const updateRoleName = async (id: string | number, name: string): Promise<{id: string | number, name: string}> => {
    console.log('API CALL: updateRoleName', { id, name });
    // This is a mock implementation
    await delay(200);
    const role = mockRoles.find(r => r.id === id);
    if(role) {
        role.name = name;
        return { id: role.id, name: role.name };
    }
    throw new Error("Role not found");
}

export const deleteRole = async (id: string | number): Promise<boolean> => {
    console.log('API CALL: deleteRole', { id });
     // This is a mock implementation
    await delay(200);
    const index = mockRoles.findIndex(r => r.id === id);
    if(index > -1) {
        mockRoles.splice(index, 1);
        return true;
    }
    return false;
}

// Queue
export const announcePatientInQueue = async (appointmentId: string | number): Promise<{audio_url?: string}> => {
    console.log('API CALL: announcePatientInQueue', { appointmentId });
    const appointment = allAppointments.find(a => String(a.id) === String(appointmentId));
    if (!appointment) {
        throw new Error("Appointment not found");
    }

    const announcementText = `Token number ${appointment.tokenNumber.split('').join(' ')}, please proceed to the doctor's room.`;
    const audio = await speak(announcementText);

    return { audio_url: audio.media };
}






