

import { 
    patients as allPatients,
    appointments as allAppointments,
    invoices as allInvoices,
    chartData,
    employees as allEmployees,
    payrolls as allPayrolls,
    branches,
    inventory,
    labOrders as allLabOrders,
    treatments as allTreatments,
    attendance as allAttendance,
    leaveRequests as allLeaveRequests,
    staffAdvances as allStaffAdvances,
    expenses as allExpenses,
    roles as mockRoles
} from '@/lib/data';
import type { Patient, Appointment, Invoice, ChartData, Employee, Payroll, Branch, InventoryItem, LaboratoryOrder, BasePatient, InvoiceTreatment, OtherCharge, SystemTreatment, PaymentMethod, PaymentTransaction, AttendanceRecord, LeaveRequest, StaffAdvance, StaffAdvanceStatus, Expense, ExpenseCategory, RolePermissions, Permission, DentalRecord, PeriodontalRecord, OcclusalRecord, SoftTissueRecord, OrthodonticRecord, Treatment, DentalCondition, PatientImage, FinancialSummary, CurrentUser, ProfileData, AppointmentStatus } from '@/lib/types';
import type { DateRange } from 'react-day-picker';
import { format, parse } from "date-fns";
import { speak } from '@/ai/flows/speak';
import { clearCurrentUser, getAuthToken, setCurrentUser } from './user';
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
        return response.data;
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
    await delay(50);
    return JSON.parse(JSON.stringify(branches));
}

export const getPatients = async (branchId?: string): Promise<Patient[]> => {
    console.log('API CALL: getPatients', { branchId });
    await delay(100);
    let localPatients = allPatients;
    if (branchId) {
        localPatients = localPatients.filter(p => p.branchId === branchId);
    }
    return JSON.parse(JSON.stringify(localPatients));
}

export const getPatientById = async (id: string): Promise<Patient | undefined> => {
    console.log('API CALL: getPatientById', { id });
    await delay(100);
    return JSON.parse(JSON.stringify(allPatients.find(p => p.id === id)));
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
        localInvoices = localInvoices.filter(i => i.branchId === filters.branchId);
    }
    
    if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        localInvoices = localInvoices.filter(invoice => 
            invoice.patientName.toLowerCase().includes(query) ||
            invoice.id.toString().toLowerCase().includes(query)
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

export const getInvoiceById = async (id: string): Promise<Invoice | undefined> => {
    console.log('API CALL: getInvoiceById', { id });
    await delay(100);
    return JSON.parse(JSON.stringify(allInvoices.find(i => i.id.toString() === id)));
}

export const getEmployees = async (branchId?: string | number): Promise<Employee[]> => {
    console.log('API CALL: getEmployees', { branchId });
    await delay(100);
    let localEmployees = allEmployees;
    if (branchId) {
        localEmployees = localEmployees.filter(e => e.branch_id === branchId);
    }
    return JSON.parse(JSON.stringify(localEmployees));
}

export const getEmployeeById = async (id: string): Promise<Employee | undefined> => {
    console.log('API CALL: getEmployeeById', { id });
    await delay(100);
    // Find by ID or email for profile page lookup
    return JSON.parse(JSON.stringify(allEmployees.find(e => e.id.toString() === id || e.email === id)));
}

export const getPayrolls = async (branchId?: string | number): Promise<Payroll[]> => {
    console.log('API CALL: getPayrolls', { branchId });
    await delay(250);
    let localPayrolls = allPayrolls;
    if (branchId) {
        localPayrolls = localPayrolls.filter(p => p.branch_id === branchId);
    }
    return JSON.parse(JSON.stringify(localPayrolls));
}

export const getInventory = async (branchId?: string | number): Promise<InventoryItem[]> => {
    console.log('API CALL: getInventory', { branchId });
    await delay(100);
    let localInventory = inventory;
    if (branchId) {
        localInventory = localInventory.filter(i => i.branchId === branchId);
    }
    return JSON.parse(JSON.stringify(localInventory));
}

export const getLabOrders = async (branchId?: string | number): Promise<LaboratoryOrder[]> => {
    console.log('API CALL: getLabOrders', { branchId });
    await delay(150);
    let localLabOrders = allLabOrders;
    if (branchId) {
        localLabOrders = localLabOrders.filter(l => l.branchId === branchId);
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
        localAttendance = localAttendance.filter(a => a.branchId === branchId);
    }
    return JSON.parse(JSON.stringify(localAttendance));
}

export const getLeaveRequests = async (branchId?: string | number): Promise<LeaveRequest[]> => {
    console.log('API CALL: getLeaveRequests', { branchId });
    await delay(150);
    let localLeaveRequests = allLeaveRequests;
    if (branchId) {
        localLeaveRequests = localLeaveRequests.filter(l => l.branchId.toString() === branchId.toString());
    }
    return JSON.parse(JSON.stringify(localLeaveRequests));
}

export const getStaffAdvances = async (branchId?: string | number): Promise<StaffAdvance[]> => {
    console.log('API CALL: getStaffAdvances', { branchId });
    await delay(150);
    let localAdvances = allStaffAdvances;
    if (branchId) {
        localAdvances = localAdvances.filter(s => s.branchId.toString() === branchId.toString());
    }
    return JSON.parse(JSON.stringify(localAdvances));
}

export const getExpenses = async (branchId?: string | number): Promise<Expense[]> => {
    console.log('API CALL: getExpenses', { branchId });
    await delay(150);
    let localExpenses = allExpenses;
    if (branchId) {
        localExpenses = localExpenses.filter(e => e.branchId === branchId);
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


export const getFinancialSummary = async (branchId: string | number): Promise<FinancialSummary> => {
    console.log('API CALL: getFinancialSummary', { branchId });
    await delay(300);

    const branchInvoices = allInvoices.filter(i => i.branchId.toString() === branchId.toString());
    const branchPayrolls = allPayrolls.filter(p => p.branch_id.toString() === branchId.toString());
    const branchExpenses = allExpenses.filter(e => e.branchId.toString() === branchId.toString());
    
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
        const monthKey = format(new Date(payroll.pay_date), "yyyy-MM");
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
        a.branchId.toString() === filters.branchId.toString() &&
        a.date === today &&
        a.status !== 'Cancelled' &&
        a.status !== 'Scheduled'
    );
  
    if (filters.doctorId) {
      filtered = filtered.filter((a) => a.doctorId.toString() === filters.doctorId!.toString());
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
    const patientIndex = allPatients.findIndex(p => p.id.toString() === id.toString());
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
    const newPatients = allPatients.filter(p => p.id.toString() !== id.toString());
    allPatients.length = 0;
    Array.prototype.push.apply(allPatients, newPatients);
    return { success: allPatients.length < initialLength };
}

export const addImageToPatient = async (patientId: string | number, image: Omit<PatientImage, 'date'>): Promise<Patient | undefined> => {
    console.log('API CALL: addImageToPatient', { patientId, image });
    await delay(200);
    const patientIndex = allPatients.findIndex(p => p.id.toString() === patientId.toString());
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
    const patientIndex = allPatients.findIndex(p => p.id.toString() === patientId.toString());
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
    const patientIndex = allPatients.findIndex(p => p.id.toString() === patientId.toString());
    if (patientIndex > -1) {
        allPatients[patientIndex].periodontalRecords = records;
        return allPatients[patientIndex];
    }
    return undefined;
}

export const saveOcclusalRecord = async (patientId: string | number, record: OcclusalRecord): Promise<Patient | undefined> => {
    console.log('API CALL: saveOcclusalRecord', { patientId, record });
    await delay(150);
    const patientIndex = allPatients.findIndex(p => p.id.toString() === patientId.toString());
    if (patientIndex > -1) {
        allPatients[patientIndex].occlusalRecords = record;
        return allPatients[patientIndex];
    }
    return undefined;
};

export const addTreatment = async (patientId: string | number, treatmentData: Omit<Treatment, 'id' | 'date'>, condition?: DentalCondition): Promise<Patient | undefined> => {
    console.log('API CALL: addTreatment', { patientId, treatmentData, condition });
    await delay(200);
    const patientIndex = allPatients.findIndex(p => p.id.toString() === patientId.toString());
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
    const patientIndex = allPatients.findIndex(p => p.id.toString() === patientId.toString());
    if (patientIndex > -1) {
        const patient = allPatients[patientIndex];
        const treatmentIndex = patient.treatmentPlans.findIndex(t => t.id === treatment.id);
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
    const patientIndex = allPatients.findIndex(p => p.id.toString() === patientId.toString());
    if (patientIndex > -1) {
        const patient = allPatients[patientIndex];
        patient.treatmentPlans = patient.treatmentPlans.filter(t => t.id.toString() !== treatmentId.toString());
        return patient;
    }
    return undefined;
}

export const saveOrthodonticRecord = async (patientId: string | number, recordData: Omit<OrthodonticRecord, 'id'>): Promise<Patient | undefined> => {
    console.log('API CALL: saveOrthodonticRecord', { patientId, recordData });
    await delay(200);
    const patientIndex = allPatients.findIndex(p => p.id.toString() === patientId.toString());
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
    const patientIndex = allPatients.findIndex(p => p.id.toString() === patientId.toString());
    if (patientIndex > -1) {
        const patient = allPatients[patientIndex];
        const recordIndex = patient.orthodonticRecords.findIndex(r => r.id === record.id);
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
    const patientIndex = allPatients.findIndex(p => p.id.toString() === patientId.toString());
    if (patientIndex > -1) {
        const patient = allPatients[patientIndex];
        patient.orthodonticRecords = patient.orthodonticRecords.filter(r => r.id.toString() !== recordId.toString());
        return patient;
    }
    return undefined;
}

export const saveSoftTissueRecord = async (patientId: string | number, recordData: Omit<SoftTissueRecord, 'id'>): Promise<Patient | undefined> => {
    console.log('API CALL: saveSoftTissueRecord', { patientId, recordData });
    await delay(200);
    const patientIndex = allPatients.findIndex(p => p.id.toString() === patientId.toString());
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
    const patientIndex = allPatients.findIndex(p => p.id.toString() === patientId.toString());
    if (patientIndex > -1) {
        const patient = allPatients[patientIndex];
        const recordIndex = patient.softTissueRecords.findIndex(r => r.id === record.id);
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
    const patientIndex = allPatients.findIndex(p => p.id.toString() === patientId.toString());
    if (patientIndex > -1) {
        const patient = allPatients[patientIndex];
        patient.softTissueRecords = patient.softTissueRecords.filter(r => r.id.toString() !== recordId.toString());
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
    const appointmentIndex = allAppointments.findIndex(a => a.id.toString() === id.toString());
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
    const newAppointments = allAppointments.filter(a => a.id.toString() !== id.toString());
    allAppointments.length = 0;
    Array.prototype.push.apply(allAppointments, newAppointments);
    return { success: allAppointments.length < initialLength };
}

// Invoices
export const createInvoice = async (data: Omit<Invoice, 'id' | 'amount' | 'paidAmount' | 'patientName'> & { branchId: string | number, treatments: InvoiceTreatment[] }): Promise<Invoice> => {
    console.log('API CALL: createInvoice', { data });
    await delay(200);
    const patient = allPatients.find(p => p.id === data.patientId);
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
    const invoiceIndex = allInvoices.findIndex(i => i.id.toString() === id.toString());

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
    const invoiceIndex = allInvoices.findIndex(i => i.id.toString() === invoiceId.toString());
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
    const newInvoices = allInvoices.filter(i => i.id.toString() !== id.toString());
    allInvoices.length = 0;
    Array.prototype.push.apply(allInvoices, newInvoices);
    return { success: allInvoices.length < initialLength };
}


// Employees
export const createEmployee = async (data: Omit<Employee, 'id'>): Promise<Employee> => {
    console.log('API CALL: createEmployee', { data });
    await delay(200);
    const newEmployee: Employee = {
        ...data,
        id: `emp${allEmployees.length + 1}`,
    };
    allEmployees.push(newEmployee);
    return newEmployee;
}

export const updateEmployee = async (id: string | number, data: Partial<Employee>): Promise<Employee | undefined> => {
    console.log('API CALL: updateEmployee', { id, data });
    await delay(200);
    const employeeIndex = allEmployees.findIndex(e => e.id.toString() === id.toString());
    if (employeeIndex > -1) {
        allEmployees[employeeIndex] = { ...allEmployees[employeeIndex], ...data };
        return allEmployees[employeeIndex];
    }
    return undefined;
}

export const deleteEmployee = async (id: string | number): Promise<{ success: boolean }> => {
    console.log('API CALL: deleteEmployee', { id });
    await delay(200);
    const initialLength = allEmployees.length;
    const newEmployees = allEmployees.filter(e => e.id.toString() !== id.toString());
    allEmployees.length = 0;
    Array.prototype.push.apply(allEmployees, newEmployees);
    return { success: allEmployees.length < initialLength };
}


// Branches
export const createBranch = async (data: Omit<Branch, 'id'>): Promise<Branch> => {
    console.log('API CALL: createBranch', { data });
    await delay(200);
    const newBranch: Branch = {
        ...data,
        id: `b${branches.length + 1}`
    };
    branches.push(newBranch);
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
export const createPayroll = async (data: Omit<Payroll, 'id'>): Promise<Payroll> => {
    console.log('API CALL: createPayroll', { data });
    await delay(200);
    const newPayroll: Payroll = {
        ...data,
        id: `pay${allPayrolls.length + 1}`,
    };
    allPayrolls.unshift(newPayroll);
    return newPayroll;
}


// Attendance
export const markAttendance = async(data: Omit<AttendanceRecord, 'id' | 'employeeName'>): Promise<AttendanceRecord> => {
    console.log('API CALL: markAttendance', { data });
    await delay(200);
    const employee = allEmployees.find(e => e.id === data.employeeId);
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
    const employee = allEmployees.find(e => e.id === data.employeeId);
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
    const requestIndex = allLeaveRequests.findIndex(req => req.id.toString() === id.toString());
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
    const employee = allEmployees.find(e => e.id === data.employeeId);
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
    const advanceIndex = allStaffAdvances.findIndex(adv => adv.id.toString() === id.toString());
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
    await delay(200);
    const roleIndex = mockRoles.findIndex(r => r.id === roleId);
    if (roleIndex > -1) {
        mockRoles[roleIndex] = { ...mockRoles[roleIndex], permissions };
        return mockRoles[roleIndex];
    }
    return undefined;
}

// Queue
export const announcePatientInQueue = async (appointmentId: string | number): Promise<{audio_url?: string}> => {
    console.log('API CALL: announcePatientInQueue', { appointmentId });
    const appointment = allAppointments.find(a => a.id.toString() === appointmentId.toString());
    if (!appointment) {
        throw new Error("Appointment not found");
    }

    const announcementText = `Token number ${appointment.tokenNumber.split('').join(' ')}, please proceed to the doctor's room.`;
    const audio = await speak(announcementText);

    return { audio_url: audio.media };
}
