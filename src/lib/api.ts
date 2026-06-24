
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

type GetPatientsFilters = {
    branchId?: string | number;
    status?: 'Active' | 'Inactive';
    gender?: 'Male' | 'Female' | 'Other';
};

export const getPatients = async (filters?: string | number | GetPatientsFilters): Promise<Patient[]> => {
    console.log('API CALL: getPatients', { filters });

    try {
        const params: { branch_id?: number; status?: string; gender?: string } = {};

        // Handle backward compatibility - if filters is a string or number, treat it as branchId
        if (typeof filters === 'number' || typeof filters === 'string') {
            params.branch_id = parseInt(String(filters), 10);
        } else if (filters) {
            if (filters.branchId) {
                params.branch_id = parseInt(String(filters.branchId), 10);
            }
            if (filters.status) {
                params.status = filters.status;
            }
            if (filters.gender) {
                params.gender = filters.gender;
            }
        }

        const response = await customAxios.get('/patients', { params });

        // Handle both response.data and response.data.data formats
        const dataArray = Array.isArray(response.data) ? response.data : (response.data.data || []);

        // Map API response to frontend type
        return dataArray.map((patient: any) => ({
            id: String(patient.id),
            first_name: patient.first_name,
            last_name: patient.last_name,
            avatar: patient.avatar || '',
            email: patient.email,
            phone: patient.phone,
            address: patient.address,
            gender: patient.gender,
            dateOfBirth: patient.date_of_birth ? patient.date_of_birth.split('T')[0] : patient.date_of_birth,
            lastVisit: patient.last_visit ? patient.last_visit.split('T')[0] : patient.last_visit,
            status: patient.status,
            history: patient.history || '',
            branchId: String(patient.branch_id),
            dentalRecords: patient.dental_records || [],
            treatmentPlans: patient.treatment_plans || [],
            imaging: patient.images || patient.imaging || [], // Backend returns 'images', not 'imaging'
            periodontalRecords: patient.periodontal_records || [],
            occlusalRecords: typeof patient.occlusal_records === 'string'
                ? JSON.parse(patient.occlusal_records)
                : (patient.occlusal_records || { overbite: 0, overjet: 0, crossbite: 'None', openbite: 'None', malocclusion: 'Class I' }),
            softTissueRecords: patient.soft_tissue_records || [],
            orthodonticRecords: patient.orthodontic_records || [],
        }));
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to fetch patients:', error.response?.data);
        } else {
            console.error("An unexpected error occurred while fetching patients:", error);
        }
        return [];
    }
}

export const getPatientList = async (filters?: string | number | GetPatientsFilters): Promise<BasePatient[]> => {
    console.log('API CALL: getPatientList', { filters });
    
    try {
        const params: { branch_id?: number; status?: string; gender?: string } = {};

        // Handle backward compatibility - if filters is a string or number, treat it as branchId
        if (typeof filters === 'number' || typeof filters === 'string') {
            params.branch_id = parseInt(String(filters), 10);
        } else if (filters) {
            if (filters.branchId) {
                params.branch_id = parseInt(String(filters.branchId), 10);
            }
            if (filters.status) {
                params.status = filters.status;
            }
            if (filters.gender) {
                params.gender = filters.gender;
            }
        }

        // ✅ ACTUAL API CALL
        const response = await customAxios.get('/patients-list', { params });
        
        // Handle different response formats
        let patientData = response.data;
        if (patientData?.data && Array.isArray(patientData.data)) {
            patientData = patientData.data;
        } else if (!Array.isArray(patientData)) {
            console.error('Unexpected response format:', patientData);
            return [];
        }

        // ✅ Map the response to BasePatient type
        const patients: BasePatient[] = patientData.map((patient: any) => ({
            id: patient.id || patient.patient_id,
            name: patient.name || patient.patient_name || 'Unknown',
            email: patient.email || '',
            phone: patient.phone || patient.phone_number || '',
            gender: patient.gender || '',
            dateOfBirth: patient.date_of_birth || patient.dob || patient.dateOfBirth || '',
            status: patient.status || 'Active',
            branchId: patient.branch_id || patient.branchId,
            // Keep any additional fields
            ...patient,
        }));

        console.log('Fetched patients:', patients);
        return patients;

    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to fetch patient list:', error.response?.data);
        } else {
            console.error("An unexpected error occurred while fetching patient list:", error);
        }
        return [];
    }
};



export const getPatientById = async (id: string | number): Promise<Patient | undefined> => {
    console.log('API CALL: getPatientById', { id });

    try {
        const response = await customAxios.get(`/patients/${id}`);
        const patient = response.data;

        // Map API response to frontend type
        return {
            id: String(patient.id),
            first_name: patient.first_name,
            last_name: patient.last_name,
            avatar: patient.avatar || '',
            email: patient.email,
            phone: patient.phone,
            address: patient.address,
            gender: patient.gender,
            dateOfBirth: patient.date_of_birth ? patient.date_of_birth.split('T')[0] : patient.date_of_birth,
            lastVisit: patient.last_visit ? patient.last_visit.split('T')[0] : patient.last_visit,
            status: patient.status,
            history: patient.history || '',
            branchId: String(patient.branch_id),
            dentalRecords: (patient.dental_records || []).map((record: any) => ({
                toothId: record.tooth_id,
                condition: record.condition,
                notes: record.notes || '',
            })),
            treatmentPlans: (patient.treatment_plans || []).map((plan: any) => ({
                id: String(plan.id),
                procedure: plan.procedure,
                tooth: plan.tooth,
                status: plan.status,
                cost: parseFloat(plan.cost),
                date: plan.date,
                invoiceId: plan.invoice_id,
            })),
            imaging: patient.images || patient.imaging || [], // Backend returns 'images', not 'imaging'
            periodontalRecords: patient.periodontal_records || [],
            occlusalRecords: typeof patient.occlusal_records === 'string'
                ? JSON.parse(patient.occlusal_records)
                : (patient.occlusal_records || { overbite: 0, overjet: 0, crossbite: 'None', openbite: 'None', malocclusion: 'Class I' }),
            softTissueRecords: patient.soft_tissue_records || [],
            orthodonticRecords: patient.orthodontic_records || [],
        };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 404) {
                console.error(`Patient ${id} not found`);
                return undefined;
            }
            console.error(`Failed to fetch patient ${id}:`, error.response?.data);
        } else {
            console.error("An unexpected error occurred while fetching patient:", error);
        }
        return undefined;
    }
}

export const getAppointments = async (): Promise<Appointment[]> => {
    console.log('API CALL: getAppointments');
    await delay(150);
    return JSON.parse(JSON.stringify(allAppointments));
}

export const getInvoices = async (filters?: any) => {
    console.log('API CALL: getInvoices', { filters });

    // ✅ Build params exactly as backend expects
    const params: any = {};

    if (filters?.branchId) params.branch_id = filters.branchId;
    if (filters?.status) params.status = filters.status;

    try {
        // ✅ API CALL
        const response = await customAxios.get('/invoices', { params });

        let invoices = response.data.map((inv: any) => ({
            ...inv,

            // ✅ FIX TYPES
            amount: Number(inv.amount),
            paidAmount: Number(inv.paid_amount),

            // ✅ FIX FIELD NAMES (VERY IMPORTANT)
            patientName: inv.patient_name,
            patientId: inv.patient_id ?? inv.patientId,
            issueDate: inv.issue_date,
            branchId: inv.branch_id,
        }));

        console.log('Fetched invoices from API:', invoices);

        // ✅ Frontend filters (search + date)
        if (filters?.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            invoices = invoices.filter((inv: any) =>
                inv.patient_name.toLowerCase().includes(query) ||
                String(inv.id).toLowerCase().includes(query)
            );
        }

        if (filters?.dateRange?.from) {
            invoices = invoices.filter((inv: any) =>
                new Date(inv.issue_date) >= filters.dateRange.from
            );
        }

        if (filters?.dateRange?.to) {
            invoices = invoices.filter((inv: any) =>
                new Date(inv.issue_date) <= filters.dateRange.to
            );
        }

        return invoices;

    } catch (error) {
        console.error('Error fetching invoices:', error);
        return [];
    }
};

export const getInvoiceById = async (id: string | number): Promise<Invoice | undefined> => {
    console.log('API CALL: getInvoiceById', { id });
    
    try {
        const response = await customAxios.get(`/invoices/${id}`);
        let invoiceData = response.data;
        
        console.log('Fetched invoice data from API:', invoiceData);
        
        // Handle different response formats (if your API wraps data in a data property)
        if (invoiceData?.data) {
            invoiceData = invoiceData.data;
        }
        
        if (!invoiceData) {
            console.error('No invoice found with ID:', id);
            return undefined;
        }

        // ✅ Map the API response to match your Invoice type
        const invoice: Invoice = {
            ...invoiceData,
            // Convert string amounts to numbers
            amount: Number(invoiceData.amount) || 0,
            paidAmount: Number(invoiceData.paid_amount) || 0,
            // Map field names from API to your component expectations
            patientName: invoiceData.patient_name || invoiceData.patientName || 'Unknown',
            patientId: invoiceData.patient_id ?? invoiceData.patientId ?? '',
            issueDate: invoiceData.issue_date || invoiceData.issueDate || new Date().toISOString(),
            branchId: invoiceData.branch_id || invoiceData.branchId,
            // Keep original fields for reference (optional)
            patient_name: invoiceData.patient_name,
            patient_id: invoiceData.patient_id,
            issue_date: invoiceData.issue_date,
            paid_amount: invoiceData.paid_amount,
            branch_id: invoiceData.branch_id,
        };
        
        console.log('Mapped invoice:', invoice);
        return invoice;
        
    } catch (error) {
        console.error('Error fetching invoice by ID:', error);
        return undefined;
    }
};


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
            gender: emp.gender,
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
    try {
        const response = await customAxios.get('/procedures');
        
        // Handle both array and wrapped response formats
        const treatmentData = Array.isArray(response.data) ? response.data : (response.data.data || []);
        
        // Map API response to SystemTreatment type
        return treatmentData.map((treatment: any) => ({
            id: treatment.id,
            procedure: treatment.procedure || treatment.name || '',
            cost: parseFloat(treatment.cost || treatment.price || '0'),
            description: treatment.description || '',
            category: treatment.category || '',
        }));
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to fetch treatments:', error.response?.data);
        } else {
            console.error("An unexpected error occurred while fetching treatments:", error);
        }
        // Fallback to mock data on error
        return [];
    }
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

type GetLeaveRequestsFilters = {
    branchId?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
};

export const getLeaveRequests = async (filters?: number | GetLeaveRequestsFilters): Promise<LeaveRequest[]> => {
    console.log('API CALL: getLeaveRequests', { filters });
    try {
        const params: { branch_id?: number; status?: string; start_date?: string; end_date?: string } = {};

        // Handle backward compatibility - if filters is a number, treat it as branchId
        if (typeof filters === 'number') {
            params.branch_id = filters;
        } else if (filters) {
            if (filters.branchId) {
                params.branch_id = filters.branchId;
            }
            if (filters.status) {
                params.status = filters.status;
            }
            if (filters.startDate) {
                params.start_date = filters.startDate;
            }
            if (filters.endDate) {
                params.end_date = filters.endDate;
            }
        }

        const response = await customAxios.get('/management/get-leave-requests', { params });

        // Handle both response.data and response.data.data formats
        const dataArray = Array.isArray(response.data) ? response.data : response.data.data;

        // Map API response to frontend type
        return dataArray.map((item: any) => ({
            id: item.id,
            employeeId: String(item.employee_id),
            employeeName: item.employee_name,
            leaveType: item.leave_type,
            startDate: item.start_date ? item.start_date.split('T')[0] : item.start_date,
            endDate: item.end_date ? item.end_date.split('T')[0] : item.end_date,
            reason: item.reason,
            status: item.status,
            branchId: item.branch_id,
        }));
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to fetch leave requests:', error.response?.data);
        } else {
            console.error("An unexpected error occurred while fetching leave requests:", error);
        }
        return [];
    }
}

type GetStaffAdvancesFilters = {
    branchId?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
};

export const getStaffAdvances = async (filters?: number | string | GetStaffAdvancesFilters): Promise<StaffAdvance[]> => {
    console.log('API CALL: getStaffAdvances', { filters });
    try {
        const params: { branch_id?: number; status?: string; start_date?: string; end_date?: string } = {};

        // Handle backward compatibility - if filters is a number or string, treat it as branchId
        if (typeof filters === 'number') {
            params.branch_id = filters;
        } else if (typeof filters === 'string') {
            params.branch_id = parseInt(filters, 10);
        } else if (filters) {
            if (filters.branchId) {
                params.branch_id = filters.branchId;
            }
            if (filters.status) {
                params.status = filters.status;
            }
            if (filters.startDate) {
                params.start_date = filters.startDate;
            }
            if (filters.endDate) {
                params.end_date = filters.endDate;
            }
        }

        const response = await customAxios.get('/management/staff-advances', { params });

        // Handle both response.data and response.data.data formats
        const dataArray = Array.isArray(response.data) ? response.data : response.data.data;

        // Map API response to frontend type
        return dataArray.map((item: any) => ({
            id: item.id,
            employeeId: String(item.employee_id),
            employeeName: item.employee_name,
            amount: parseFloat(item.amount),
            date: item.date ? item.date.split('T')[0] : item.date,
            reason: item.reason,
            status: item.status,
            branchId: item.branch_id,
        }));
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to fetch staff advances:', error.response?.data);
        } else {
            console.error("An unexpected error occurred while fetching staff advances:", error);
        }
        return [];
    }
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
    const branchPayrolls = mockPayrolls.filter(p => String(p.branchId) === String(branchId));
    const branchExpenses = allExpenses.filter(e => String(e.branchId) === String(branchId));

    const paidInvoices = branchInvoices.filter(i => i.status === 'Paid');
    const totalIncome = paidInvoices.reduce((sum, i) => sum + i.amount, 0);

    const payrollExpenses = branchPayrolls.reduce((sum, p) => sum + Number(p.grossPay), 0);
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
        const payDate = payroll.payDate.split('T')[0];
        const monthKey = format(new Date(payDate), "yyyy-MM");
        if (!financialsByMonth[monthKey]) financialsByMonth[monthKey] = { income: 0, expense: 0 };
        financialsByMonth[monthKey].expense += Number(payroll.grossPay);
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

    const requestBody = {
        first_name: data.first_name,
        last_name: data.last_name,
        avatar: data.avatar || undefined,
        email: data.email,
        phone: data.phone || undefined,
        address: data.address || undefined,
        gender: data.gender || undefined,
        date_of_birth: data.dateOfBirth,
        last_visit: data.lastVisit || undefined,
        status: data.status,
        branch_id: parseInt(String(data.branchId), 10),
        history: data.history || undefined,
    };

    try {
        const response = await customAxios.post('/patients', requestBody);
        const newPatient = response.data.data || response.data;

        const fePatient: Patient = {
            id: String(newPatient.id),
            first_name: newPatient.first_name,
            last_name: newPatient.last_name,
            avatar: newPatient.avatar || '',
            email: newPatient.email,
            phone: newPatient.phone,
            address: newPatient.address,
            gender: newPatient.gender,
            dateOfBirth: newPatient.date_of_birth ? newPatient.date_of_birth.split('T')[0] : newPatient.date_of_birth,
            lastVisit: newPatient.last_visit ? newPatient.last_visit.split('T')[0] : newPatient.last_visit,
            status: newPatient.status,
            history: newPatient.history || '',
            branchId: String(newPatient.branch_id),
            dentalRecords: newPatient.dental_records || [],
            treatmentPlans: newPatient.treatment_plans || [],
            imaging: newPatient.images || newPatient.imaging || [], // Backend returns 'images', not 'imaging'
            periodontalRecords: newPatient.periodontal_records || [],
            occlusalRecords: typeof newPatient.occlusal_records === 'string'
                ? JSON.parse(newPatient.occlusal_records)
                : (newPatient.occlusal_records || { overbite: 0, overjet: 0, crossbite: 'None', openbite: 'None', malocclusion: 'Class I' }),
            softTissueRecords: newPatient.soft_tissue_records || [],
            orthodonticRecords: newPatient.orthodontic_records || [],
        };

        allPatients.push(fePatient);
        return fePatient;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to create patient:', error.response?.data);
            throw new Error(error.response?.data?.message || "Failed to create patient");
        } else {
            console.error("An unexpected error occurred during patient creation:", error);
            throw error;
        }
    }
}

export const updatePatient = async (id: string | number, data: Partial<Patient>): Promise<Patient | undefined> => {
    console.log('API CALL: updatePatient', { id, data });

    // Build request body - only include fields that are provided
    const requestBody: any = {};

    if (data.first_name !== undefined) requestBody.first_name = data.first_name;
    if (data.last_name !== undefined) requestBody.last_name = data.last_name;
    if (data.avatar !== undefined) requestBody.avatar = data.avatar;
    if (data.email !== undefined) requestBody.email = data.email;
    if (data.phone !== undefined) requestBody.phone = data.phone;
    if (data.address !== undefined) requestBody.address = data.address;
    if (data.gender !== undefined) requestBody.gender = data.gender;
    if (data.dateOfBirth !== undefined) requestBody.date_of_birth = data.dateOfBirth;
    if (data.lastVisit !== undefined) requestBody.last_visit = data.lastVisit;
    if (data.status !== undefined) requestBody.status = data.status;
    if (data.branchId !== undefined) requestBody.branch_id = parseInt(String(data.branchId), 10);
    if (data.history !== undefined) requestBody.history = data.history;
    if (data.occlusalRecords !== undefined) {
        requestBody.occlusal_records = typeof data.occlusalRecords === 'string'
            ? data.occlusalRecords
            : JSON.stringify(data.occlusalRecords);
    }

    try {
        const response = await customAxios.put(`/patients/${id}`, requestBody);
        const updatedPatient = response.data.data || response.data;

        const fePatient: Patient = {
            id: String(updatedPatient.id),
            first_name: updatedPatient.first_name,
            last_name: updatedPatient.last_name,
            avatar: updatedPatient.avatar || '',
            email: updatedPatient.email,
            phone: updatedPatient.phone,
            address: updatedPatient.address,
            gender: updatedPatient.gender,
            dateOfBirth: updatedPatient.date_of_birth ? updatedPatient.date_of_birth.split('T')[0] : updatedPatient.date_of_birth,
            lastVisit: updatedPatient.last_visit ? updatedPatient.last_visit.split('T')[0] : updatedPatient.last_visit,
            status: updatedPatient.status,
            history: updatedPatient.history || '',
            branchId: String(updatedPatient.branch_id),
            dentalRecords: updatedPatient.dental_records || [],
            treatmentPlans: updatedPatient.treatment_plans || [],
            imaging: updatedPatient.images || updatedPatient.imaging || [],
            periodontalRecords: updatedPatient.periodontal_records || [],
            occlusalRecords: typeof updatedPatient.occlusal_records === 'string'
                ? JSON.parse(updatedPatient.occlusal_records)
                : (updatedPatient.occlusal_records || { overbite: 0, overjet: 0, crossbite: 'None', openbite: 'None', malocclusion: 'Class I' }),
            softTissueRecords: updatedPatient.soft_tissue_records || [],
            orthodonticRecords: updatedPatient.orthodontic_records || [],
        };

        // Update local cache
        const patientIndex = allPatients.findIndex(p => String(p.id) === String(id));
        if (patientIndex > -1) {
            allPatients[patientIndex] = fePatient;
        }

        return fePatient;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to update patient:', error.response?.data);
            if (error.response?.status === 404) {
                throw new Error("Patient not found");
            }
            throw new Error(error.response?.data?.message || "Failed to update patient");
        } else {
            console.error("An unexpected error occurred during patient update:", error);
            throw error;
        }
    }
}

export const deletePatient = async (id: string | number): Promise<{ success: boolean }> => {
    console.log('API CALL: deletePatient', { id });

    try {
        await customAxios.delete(`/patients/${id}`);

        // Update local cache - remove the deleted patient
        const patientIndex = allPatients.findIndex(p => String(p.id) === String(id));
        if (patientIndex > -1) {
            allPatients.splice(patientIndex, 1);
        }

        return { success: true };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to delete patient:', error.response?.data);
            if (error.response?.status === 404) {
                throw new Error("Patient not found");
            }
            throw new Error(error.response?.data?.message || "Failed to delete patient");
        } else {
            console.error("An unexpected error occurred during patient deletion:", error);
            throw error;
        }
    }
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

export const getOdontogramRecords = async (patientId: string | number): Promise<DentalRecord[]> => {
    console.log('API CALL: getOdontogramRecords', { patientId });

    try {
        const response = await customAxios.get(`/patients/${patientId}/odontogram-records`);
        const records = response.data;

        // Map API response to frontend type
        return (records || []).map((record: any) => ({
            toothId: record.tooth_id,
            condition: record.condition,
            notes: record.notes || '',
        }));
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to fetch odontogram records:', error.response?.data);
            if (error.response?.status === 404) {
                console.error(`Patient ${patientId} not found`);
                return [];
            }
        } else {
            console.error("An unexpected error occurred while fetching odontogram records:", error);
        }
        return [];
    }
};

export const saveDentalRecord = async (patientId: string | number, record: DentalRecord): Promise<DentalRecord> => {
    console.log('API CALL: saveDentalRecord. Request Body:', { patientId, record });

    // Build request body - convert camelCase to snake_case
    const requestBody = {
        tooth_id: record.toothId,
        condition: record.condition,
        notes: record.notes || undefined,
    };

    try {
        const response = await customAxios.post(`/patients/${patientId}/odontogram-records`, requestBody);
        const savedRecord = response.data.data || response.data;

        // Map API response back to frontend type
        const feRecord: DentalRecord = {
            toothId: savedRecord.tooth_id,
            condition: savedRecord.condition,
            notes: savedRecord.notes || '',
        };

        // Update local cache - find the patient and update their dental records
        const patientIndex = allPatients.findIndex(p => String(p.id) === String(patientId));
        if (patientIndex > -1) {
            const patient = allPatients[patientIndex];
            const recordIndex = patient.dentalRecords.findIndex(r => r.toothId === feRecord.toothId);

            if (recordIndex > -1) {
                // Update existing record
                patient.dentalRecords[recordIndex] = feRecord;
            } else {
                // Add new record
                patient.dentalRecords.push(feRecord);
            }
        }

        return feRecord;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to save dental record:', error.response?.data);
            if (error.response?.status === 404) {
                throw new Error("Patient not found");
            }
            throw new Error(error.response?.data?.message || "Failed to save dental record");
        } else {
            console.error("An unexpected error occurred during dental record save:", error);
            throw error;
        }
    }
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

export const addTreatment = async (patientId: string | number, treatmentData: Omit<Treatment, 'id' | 'date'>, condition?: DentalCondition): Promise<Treatment> => {
    console.log('API CALL: addTreatment', { patientId, treatmentData, condition });

    // Build request body - convert camelCase to snake_case
    const requestBody = {
        procedure_id: treatmentData.procedureId,
        procedure: treatmentData.procedure,
        tooth: treatmentData.tooth || undefined,
        tooth_id: treatmentData.tooth || undefined,
        status: treatmentData.status,
        cost: treatmentData.cost,
        invoice_id: treatmentData.invoiceId || undefined,
        condition: condition || undefined,
    };

    try {
        // The odontogram-records endpoint creates/updates dental records
        const response = await customAxios.post(`/patients/${patientId}/odontogram-records`, requestBody);
        const savedRecord = response.data.data || response.data;

        // Create a treatment object with generated ID and current date
        // The API returns dental record data, not treatment data
        const feTreatment: Treatment = {
            id: `t${Date.now()}`, // Generate temporary ID
            procedureId: treatmentData.procedureId,
            procedure: treatmentData.procedure,
            tooth: treatmentData.tooth,
            status: treatmentData.status,
            cost: treatmentData.cost,
            date: new Date().toISOString().split('T')[0],
            invoiceId: treatmentData.invoiceId,
        };

        // Update local cache - find the patient and update both treatment plans and dental records
        const patientIndex = allPatients.findIndex(p => String(p.id) === String(patientId));
        if (patientIndex > -1) {
            const patient = allPatients[patientIndex];

            // Add treatment to treatment plans
            patient.treatmentPlans.push(feTreatment);

            // Update dental record from API response
            if (savedRecord.tooth_id) {
                const newRecord: DentalRecord = {
                    toothId: savedRecord.tooth_id,
                    condition: savedRecord.condition,
                    notes: savedRecord.notes || ''
                };
                const recordIndex = patient.dentalRecords.findIndex(r => r.toothId === savedRecord.tooth_id);
                if (recordIndex > -1) {
                    patient.dentalRecords[recordIndex] = newRecord;
                } else {
                    patient.dentalRecords.push(newRecord);
                }
            }
        }

        return feTreatment;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to add treatment:', error.response?.data);
            if (error.response?.status === 404) {
                throw new Error("Patient not found");
            }
            throw new Error(error.response?.data?.message || "Failed to add treatment");
        } else {
            console.error("An unexpected error occurred during treatment addition:", error);
            throw error;
        }
    }
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
export const createNewInvoice = async (data: Omit<Invoice, 'id' | 'amount' | 'paidAmount'> & { branchId: string | number; treatments: InvoiceTreatment[]; notes?: string }): Promise<Invoice> => {
    console.log('API CALL: createInvoice', { data });
    
    try {
        // ✅ Calculate totals
        const treatmentsTotal = data.treatments.reduce((sum, t) => sum + (Number(t.cost) || 0), 0);
        const otherChargesTotal = (data.otherCharges || []).reduce((sum, charge) => sum + (Number(charge.amount) || 0), 0);
        const amount = treatmentsTotal + otherChargesTotal;

        // ✅ Prepare payload for API
        const payload = {
            patient_id: data.patientId,
            patient_name: data.patientName,
            amount: amount,
            issue_date: data.issueDate,
            due_date: data.dueDate,
            status: data.status || 'Pending',
            branch_id: data.branchId,
            treatments: data.treatments.map(t => {
                const notes = (t as any).notes;
                const tooth = (t as any).tooth;
                const payload: any = {
                    procedure_id: t.procedureId,
                    procedure: t.procedure,
                    cost: Number(t.cost) || 0,
                };
                if (tooth !== undefined) {
                    payload.tooth = tooth;
                }
                if (notes) {
                    payload.notes = notes;
                }
                return payload;
            }),
            other_charges: (data.otherCharges || []).map(charge => ({
                description: charge.description,
                amount: Number(charge.amount) || 0
            })),
            notes: data.notes || '',
            payment_method: data.paymentMethod || null,
        };

        // ✅ Make API call
        const response = await customAxios.post('/invoices', payload);
        
        // Handle different response formats
        let invoiceData = response.data;
        if (invoiceData?.data) {
            invoiceData = invoiceData.data;
        }
        
        if (!invoiceData) {
            throw new Error('No invoice data returned from API');
        }

        // ✅ Map response to Invoice type
        const invoice = {
            id: invoiceData.id || invoiceData.invoice_id,
            patientId: invoiceData.patient_id || invoiceData.patientId || data.patientId,
            patientName: invoiceData.patient_name || invoiceData.patientName || '',
            issueDate: invoiceData.issue_date || invoiceData.issueDate || data.issueDate,
            dueDate: invoiceData.due_date || invoiceData.dueDate || data.dueDate,
            status: invoiceData.status || data.status || 'Pending',
            amount: Number(invoiceData.amount) || amount,
            paidAmount: Number(invoiceData.paid_amount) || 0,
            branchId: invoiceData.branch_id || invoiceData.branchId || data.branchId,
            treatments: (invoiceData.treatments || data.treatments || []).map((t: any) => ({
                procedure: t.procedure || t.procedure_name,
                cost: Number(t.cost) || 0,
                notes: t.notes || '',
            })),
            otherCharges: (invoiceData.other_charges || invoiceData.otherCharges || data.otherCharges || []).map((c: any) => ({
                description: c.description || c.name,
                amount: Number(c.amount) || 0,
            })),
            transactions: invoiceData.transactions || [],
            paymentMethod: invoiceData.payment_method || invoiceData.paymentMethod || data.paymentMethod,
            notes: invoiceData.notes || data.notes || '',
        };

        console.log('Created invoice:', invoice);
        return invoice;

    } catch (error) {
        console.error('Error creating invoice:', error);
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.message || 'Failed to create invoice');
        }
        throw error;
    }
};
type InvoiceUpdateData = Partial<Omit<Invoice, 'amount' | 'id'>> & { notes?: string };
type InvoiceWithNotes = Invoice & { notes?: string };

export const updateInvoice = async (id: string | number, data: InvoiceUpdateData): Promise<Invoice | undefined> => {
    console.log('API CALL: updateInvoice', { id, data });
    
    try {
        // ✅ Calculate totals if treatments or otherCharges are being updated
        const treatments = data.treatments || [];
        const treatmentsTotal = treatments.reduce((sum, t) => sum + (Number(t.cost) || 0), 0);
        
        const otherCharges = data.otherCharges || [];
        const otherChargesTotal = otherCharges.reduce((sum, charge) => sum + (Number(charge.amount) || 0), 0);
        const amount = treatmentsTotal + otherChargesTotal;

        // ✅ Prepare payload for API
        const payload: any = {};
        
        // Only include fields that are being updated
        if (data.patientId !== undefined) payload.patient_id = data.patientId;
        if (data.issueDate !== undefined) payload.issue_date = data.issueDate;
        if (data.dueDate !== undefined) payload.due_date = data.dueDate;
        if (data.status !== undefined) payload.status = data.status;
        if (data.branchId !== undefined) payload.branch_id = data.branchId;
        if (data.paymentMethod !== undefined) payload.payment_method = data.paymentMethod;
        if (data.notes !== undefined) payload.notes = data.notes;
        
        // Handle treatments
        if (data.treatments !== undefined) {
            payload.treatments = data.treatments.map(t => {
                const treatmentPayload: any = {
                    procedure_id: t.procedureId,
                    procedure: t.procedure,
                    cost: Number(t.cost) || 0,
                };
                if (t.tooth !== undefined) {
                    treatmentPayload.tooth = t.tooth;
                }
                const notes = (t as any).notes;
                if (notes !== undefined) {
                    treatmentPayload.notes = notes;
                }
                return treatmentPayload;
            });
        }
        
        // Handle other charges
        if (data.otherCharges !== undefined) {
            payload.other_charges = data.otherCharges.map(charge => ({
                description: charge.description,
                amount: Number(charge.amount) || 0
            }));
        }

        // ✅ If amount was calculated, include it
        if (data.treatments !== undefined || data.otherCharges !== undefined) {
            payload.amount = amount;
        }

        // ✅ Make API call
        const response = await customAxios.put(`/invoices/${id}`, payload);
        
        // Handle different response formats
        let invoiceData = response.data;
        if (invoiceData?.data) {
            invoiceData = invoiceData.data;
        }
        
        if (!invoiceData) {
            console.error('No invoice data returned from API');
            return undefined;
        }

        // ✅ Map response to Invoice type
        const invoice: InvoiceWithNotes = {
            id: invoiceData.id || invoiceData.invoice_id || String(id),
            patientId: invoiceData.patient_id || invoiceData.patientId || data.patientId || '',
            patientName: invoiceData.patient_name || invoiceData.patientName || '',
            issueDate: invoiceData.issue_date || invoiceData.issueDate || data.issueDate || new Date().toISOString(),
            dueDate: invoiceData.due_date || invoiceData.dueDate || data.dueDate || new Date().toISOString(),
            status: invoiceData.status || data.status || 'Pending',
            amount: Number(invoiceData.amount) || amount || 0,
            paidAmount: Number(invoiceData.paid_amount) || 0,
            branchId: invoiceData.branch_id || invoiceData.branchId || data.branchId || '',
            treatments: (invoiceData.treatments || data.treatments || []).map((t: any) => ({
                procedure: t.procedure || t.procedure_name,
                cost: Number(t.cost) || 0,
                notes: t.notes || '',
            })),
            otherCharges: (invoiceData.other_charges || invoiceData.otherCharges || data.otherCharges || []).map((c: any) => ({
                description: c.description || c.name,
                amount: Number(c.amount) || 0,
            })),
            transactions: invoiceData.transactions || [],
            paymentMethod: invoiceData.payment_method || invoiceData.paymentMethod || data.paymentMethod,
            notes: invoiceData.notes || data.notes || '',
        };

        console.log('Updated invoice:', invoice);
        return invoice;

    } catch (error) {
        console.error('Error updating invoice:', error);
        if (axios.isAxiosError(error)) {
            console.error('API Error:', error.response?.data);
        }
        return undefined;
    }
};

export const processPayment = async (invoiceId: string | number, paymentAmount: number, method: string): Promise<(Invoice & { notes?: string }) | undefined> => {
    console.log('API CALL: processPayment', { invoiceId, paymentAmount, method });
    
    try {
        // ✅ Validate payment amount
        if (paymentAmount <= 0) {
            throw new Error('Payment amount must be greater than 0');
        }

        // ✅ Validate payment method
        const validMethods = ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Insurance', 'Other'];
        if (!validMethods.includes(method)) {
            console.warn(`Unknown payment method: ${method}, using 'Other'`);
            // You might want to use a default or throw an error
        }

        // ✅ Prepare payload for API
        const payload = {
            amount: Number(paymentAmount),
            method: method,
            payment_date: new Date().toISOString(),
            // Optional additional fields
            notes: `Payment of ${paymentAmount} via ${method}`,
        };

        // ✅ Make API call to process payment
        const response = await customAxios.post(`/invoices/${invoiceId}/payments`, payload);
        
        // Handle different response formats
        let invoiceData = response.data;
        if (invoiceData?.data) {
            invoiceData = invoiceData.data;
        }
        
        if (!invoiceData) {
            throw new Error('No invoice data returned from payment API');
        }

        // ✅ Map response to Invoice type
        const invoice: Invoice & { notes?: string } = {
            id: invoiceData.id || invoiceData.invoice_id || String(invoiceId),
            patientId: invoiceData.patient_id || invoiceData.patientId || '',
            patientName: invoiceData.patient_name || invoiceData.patientName || '',
            issueDate: invoiceData.issue_date || invoiceData.issueDate || new Date().toISOString(),
            dueDate: invoiceData.due_date || invoiceData.dueDate || new Date().toISOString(),
            status: invoiceData.status || 'Pending',
            amount: Number(invoiceData.amount) || 0,
            paidAmount: Number(invoiceData.paid_amount) || 0,
            branchId: invoiceData.branch_id || invoiceData.branchId || '',
            treatments: (invoiceData.treatments || []).map((t: any) => ({
                procedureId: t.procedure_id || t.procedureId,
                procedure: t.procedure || t.procedure_name,
                cost: Number(t.cost) || 0,
                notes: t.notes || '',
            })),
            otherCharges: (invoiceData.other_charges || invoiceData.otherCharges || []).map((c: any) => ({
                description: c.description || c.name,
                amount: Number(c.amount) || 0,
            })),
            transactions: (invoiceData.transactions || []).map((t: any) => ({
                id: t.id || t.transaction_id || `txn_${Date.now()}`,
                date: t.date || t.payment_date || new Date().toISOString().split('T')[0],
                amount: Number(t.amount) || 0,
                method: t.method || t.payment_method || method,
            })),
            paymentMethod: invoiceData.payment_method || invoiceData.paymentMethod || method,
            notes: invoiceData.notes || '',
        };

        console.log('Payment processed successfully:', invoice);
        return invoice;

    } catch (error) {
        console.error('Error processing payment:', error);
        
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.message;
            
            console.error(`API Error (${status}):`, message);
            
            // Handle specific error cases
            switch (status) {
                case 404:
                    console.error(`Invoice ${invoiceId} not found`);
                    break;
                case 400:
                    console.error('Invalid payment request:', message);
                    break;
                case 409:
                    console.error('Payment conflict:', message);
                    break;
                case 422:
                    console.error('Validation error:', message);
                    break;
                default:
                    console.error('Unexpected error:', message);
            }
        }
        
        
        return undefined;
    }
};

export const deleteInvoice = async (id: string | number): Promise<{ success: boolean }> => {
    console.log('API CALL: deleteInvoice', { id });
    
    try {
        // ✅ Make API call
        const response = await customAxios.delete(`/invoices/${id}`);
        
        // Check if deletion was successful
        if (response.status === 200 || response.status === 204) {
            console.log(`Invoice ${id} deleted successfully`);
            return { success: true };
        }
        
        console.error('Unexpected response status:', response.status);
        return { success: false };
        
    } catch (error) {
        console.error('Error deleting invoice:', error);
        
        if (axios.isAxiosError(error)) {
            console.error('API Error:', error.response?.data);
            
            // Handle specific error cases
            if (error.response?.status === 404) {
                console.error(`Invoice ${id} not found`);
                return { success: false };
            }
            if (error.response?.status === 403) {
                console.error('Permission denied to delete invoice');
                return { success: false };
            }
        }
        
        return { success: false };
    }
};


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
        gender: data.gender,
        branch_id: parseInt(String(data.branchId), 10),
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
            gender: newEmployee.gender,
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
            gender: updatedEmployeeData.gender,
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
export const createPayroll = async (data: Omit<Payroll, 'id'>): Promise<Payroll> => {
    console.log('API CALL: createPayroll', { data });

    const requestBody = {
        employee_id: parseInt(String(data.employeeId), 10),
        employee_name: data.employeeName,
        pay_period: data.payPeriod,
        gross_pay: data.grossPay,
        deductions: data.deductions,
        net_pay: data.netPay,
        pay_date: data.payDate,
        branch_id: parseInt(String(data.branchId), 10),
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


// Attendance - Single or Multiple employees
export const markAttendance = async(data: {
    employeeId: (string | number) | (string | number)[];
    date: string;
    status: AttendanceRecord['status'];
    checkIn?: string;
    checkOut?: string;
    branchId: string | number;
    employeeName?: string;
}): Promise<AttendanceRecord[]> => {
    console.log('API CALL: markAttendance', { data });

    // Convert employeeId to array format for API
    const employeeIds = Array.isArray(data.employeeId) ? data.employeeId : [data.employeeId];

    const requestBody = {
        employee_id: employeeIds.length === 1
            ? parseInt(String(employeeIds[0]), 10)
            : employeeIds.map(id => parseInt(String(id), 10)),
        employee_name: data.employeeName || undefined,
        date: data.date,
        status: data.status,
        check_in: data.checkIn || undefined,
        check_out: data.checkOut || undefined,
        branch_id: parseInt(String(data.branchId), 10),
    };

    try {
        const response = await customAxios.post('/management/attendance', requestBody);

        // API returns array of attendance records
        const attendanceDataArray = Array.isArray(response.data) ? response.data : [response.data];

        const feAttendanceRecords: AttendanceRecord[] = attendanceDataArray.map((attendanceData: any) => ({
            id: attendanceData.id,
            employeeId: String(attendanceData.employee_id),
            employeeName: attendanceData.employee_name,
            date: attendanceData.date,
            status: attendanceData.status,
            checkIn: attendanceData.check_in,
            checkOut: attendanceData.check_out,
            branchId: attendanceData.branch_id,
        }));

        // Update local cache for all records
        feAttendanceRecords.forEach(feAttendance => {
            const existingIndex = allAttendance.findIndex(
                att => String(att.employeeId) === String(feAttendance.employeeId) && att.date === feAttendance.date
            );

            if (existingIndex > -1) {
                allAttendance[existingIndex] = feAttendance;
            } else {
                allAttendance.push(feAttendance);
            }
        });

        return feAttendanceRecords;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to mark attendance:', error.response?.data);
            throw new Error(error.response?.data?.message || "Failed to mark attendance");
        } else {
            console.error("An unexpected error occurred during attendance marking:", error);
            throw error;
        }
    }
}

// Leave
export const createLeaveRequest = async (data: Omit<LeaveRequest, 'id' | 'status'>): Promise<LeaveRequest> => {
    console.log('API CALL: createLeaveRequest', { data });
    const requestBody = {
      employee_id: parseInt(String(data.employeeId), 10),
      employee_name: data.employeeName,
      leave_type: data.leaveType,
      start_date: data.startDate,
      end_date: data.endDate,
      reason: data.reason,
      branch_id: String(data.branchId),
    };
  
    try {
      const response = await customAxios.post('/management/leave-requests', requestBody);
      const newRequestData = response.data;
  
      const feRequest: LeaveRequest = {
        id: newRequestData.id,
        employeeId: newRequestData.employee_id,
        employeeName: data.employeeName, // employeeName is passed from the component
        leaveType: newRequestData.leave_type,
        startDate: newRequestData.start_date,
        endDate: newRequestData.end_date,
        reason: newRequestData.reason,
        status: newRequestData.status,
        branchId: newRequestData.branch_id,
      };
      allLeaveRequests.push(feRequest);
      return feRequest;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Failed to create leave request:', error.response?.data);
        throw new Error(error.response?.data?.message || "Failed to create leave request");
      } else {
        console.error("An unexpected error occurred during leave request creation:", error);
        throw error;
      }
    }
  };
  

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

    const requestBody = {
        employeeId: parseInt(String(data.employeeId), 10),
        amount: data.amount,
        reason: data.reason,
        branchId: parseInt(String(data.branchId), 10),
        date: data.date,
    };

    try {
        const response = await customAxios.post('/management/staff-advances', requestBody);
        const newAdvanceData = response.data;

        const feAdvance: StaffAdvance = {
            id: newAdvanceData.id,
            employeeId: String(newAdvanceData.employee_id),
            employeeName: newAdvanceData.employee_name,
            amount: parseFloat(newAdvanceData.amount),
            date: newAdvanceData.date ? newAdvanceData.date.split('T')[0] : newAdvanceData.date,
            reason: newAdvanceData.reason,
            status: newAdvanceData.status,
            branchId: newAdvanceData.branch_id,
        };

        allStaffAdvances.push(feAdvance);
        return feAdvance;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to create staff advance:', error.response?.data);
            throw new Error(error.response?.data?.message || "Failed to create staff advance");
        } else {
            console.error("An unexpected error occurred during staff advance creation:", error);
            throw error;
        }
    }
}

export const updateStaffAdvanceStatus = async (id: string | number, status: StaffAdvanceStatus): Promise<StaffAdvance | undefined> => {
    console.log('API CALL: updateStaffAdvanceStatus', { id, status });

    const requestBody = {
        status: status,
    };

    try {
        const response = await customAxios.patch(`/management/staff-advances/${id}`, requestBody);
        const updatedAdvanceData = response.data;

        const feAdvance: StaffAdvance = {
            id: updatedAdvanceData.id,
            employeeId: String(updatedAdvanceData.employee_id),
            employeeName: updatedAdvanceData.employee_name,
            amount: parseFloat(updatedAdvanceData.amount),
            date: updatedAdvanceData.date ? updatedAdvanceData.date.split('T')[0] : updatedAdvanceData.date,
            reason: updatedAdvanceData.reason,
            status: updatedAdvanceData.status,
            branchId: updatedAdvanceData.branch_id,
        };

        // Update local cache
        const advanceIndex = allStaffAdvances.findIndex(adv => String(adv.id) === String(id));
        if (advanceIndex > -1) {
            allStaffAdvances[advanceIndex] = feAdvance;
        }

        return feAdvance;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 404) {
                console.error(`Staff advance ${id} not found:`, error.response?.data);
                return undefined;
            }
            console.error('Failed to update staff advance status:', error.response?.data);
            throw new Error(error.response?.data?.error || "Failed to update staff advance status");
        } else {
            console.error("An unexpected error occurred during staff advance status update:", error);
            throw error;
        }
    }
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
