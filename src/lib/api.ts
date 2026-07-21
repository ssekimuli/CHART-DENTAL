
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
    roles as mockRoles,
    businesses as mockBusinesses
} from '@/lib/data';
import type { Business, PaginatedArray, Patient, Appointment, Invoice, ChartData, PracticeTrendPoint, Employee, Payroll, Branch, InventoryItem, LaboratoryOrder, BasePatient, InvoiceTreatment, OtherCharge, SystemTreatment, PaymentMethod, PaymentTransaction, AttendanceRecord, LeaveRequest, StaffAdvance, StaffAdvanceStatus, Expense, ExpenseCategory, ExpenseSummary, IncomeRecord, RolePermissions, Permission, DentalRecord, PeriodontalRecord, OcclusalRecord, SoftTissueRecord, OrthodonticRecord, Treatment, DentalCondition, PatientImage, FinancialSummary, CurrentUser, ProfileData, AppointmentStatus, DashboardSummary, EmployeeRole, ReportsOverview, Medicine, MedicineUnit, Prescription, PrescriptionItem, InvoiceMedicine, EndodonticRecord, RestorativeRecord } from '@/lib/types';
import { format, parse } from "date-fns";
import { speak } from '@/ai/flows/speak';
import { clearCurrentUser, setCurrentUser } from './user';
import customAxios from './axios';
import axios from 'axios';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Static configs in-memory cache
let branchesCache: Branch[] | null = null;
let treatmentsCache: SystemTreatment[] | null = null;
let rolesCache: RolePermissions[] | null = null;
let rolesListCache: any[] | null = null;
let businessesCache: Business[] | null = null;


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
            console.error('Login failed:', error.response?.data || error.message || error);
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

export const forgotPassword = async (identifier: string): Promise<{ success: boolean; message: string; debug_otp?: string }> => {
    console.log('API CALL: forgotPassword', { identifier });
    try {
        const response = await customAxios.post('/forgot-password', { identifier });
        return {
            success: true,
            message: response.data.message || 'OTP sent successfully.',
            debug_otp: response.data.debug_otp,
        };
    } catch (error) {
        let message = 'An error occurred while sending OTP.';
        if (axios.isAxiosError(error) && error.response?.data?.message) {
            message = error.response.data.message;
        }
        return { success: false, message };
    }
};

export const verifyOTP = async (identifier: string, otp: string): Promise<{ success: boolean; message: string }> => {
    console.log('API CALL: verifyOTP', { identifier, otp });
    try {
        const response = await customAxios.post('/verify-otp', { identifier, otp });
        return {
            success: true,
            message: response.data.message || 'OTP verified successfully.',
        };
    } catch (error) {
        let message = 'Invalid or expired OTP.';
        if (axios.isAxiosError(error) && error.response?.data?.message) {
            message = error.response.data.message;
        }
        return { success: false, message };
    }
};

export const resendEmployeePassword = async (id: string | number): Promise<{ success: boolean; message: string }> => {
    console.log('API CALL: resendEmployeePassword', { id });
    try {
        const response = await customAxios.post(`/employees/${id}/resend-password`);
        return {
            success: true,
            message: response.data.message || 'Password resent successfully.',
        };
    } catch (error) {
        let message = 'An error occurred while resending password.';
        if (axios.isAxiosError(error) && error.response?.data?.error) {
            message = error.response.data.error;
        } else if (axios.isAxiosError(error) && error.response?.data?.message) {
            message = error.response.data.message;
        }
        return { success: false, message };
    }
};

export const resetPassword = async (identifier: string, password?: string): Promise<{ success: boolean; message: string }> => {
    console.log('API CALL: resetPassword', { identifier });
    try {
        const response = await customAxios.post('/reset-password', { identifier, password });
        return {
            success: true,
            message: response.data.message || 'Password reset successfully.',
        };
    } catch (error) {
        let message = 'An error occurred while resetting password.';
        if (axios.isAxiosError(error) && error.response?.data?.message) {
            message = error.response.data.message;
        }
        return { success: false, message };
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

export const getBusinesses = async (): Promise<Business[]> => {
    console.log('API CALL: getBusinesses');
    try {
        const response = await customAxios.get('/businesses');
        businessesCache = response.data.map((business: any) => ({ ...business, id: String(business.id) }));
        return businessesCache || [];
    } catch (error) {
        console.error("Failed to fetch businesses:", error);
        return [];
    }
}

export const addBusiness = async (data: Omit<Business, 'id'>): Promise<Business> => {
    console.log('API CALL: addBusiness', data);
    try {
        const response = await customAxios.post('/businesses', data);
        const newBusiness = { ...response.data, id: String(response.data.id) };
        if (!businessesCache) businessesCache = [];
        businessesCache.push(newBusiness);
        return newBusiness;
    } catch (error) {
        console.error("Failed to add business:", error);
        throw error;
    }
}
export const getBranches = async (): Promise<Branch[]> => {
    if (branchesCache) return branchesCache;
    console.log('API CALL: getBranches');
    try {
        const response = await customAxios.get('/all-branch');
        // The API returns 'id' as a number, which matches our updated type.
        branchesCache = response.data.map((branch: any) => ({ ...branch, id: branch.id }));
        return branchesCache || [];
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to fetch branches:', error.response?.data);
        } else {
            console.error("An unexpected error occurred while fetching branches:", error);
        }
        return []; // Return empty array on error
    }
}

export const getCurrencies = async (): Promise<any[]> => {
    console.log('API CALL: getCurrencies');
    try {
        const response = await customAxios.get('/currencies');
        return response.data;
    } catch (error) {
        console.error('Failed to fetch currencies:', error);
        return [];
    }
}

const mapPeriodontalRecords = (records: any[]): PeriodontalRecord => {
    return (records || []).map((record: any) => ({
        toothId: Number(record.tooth_id || record.toothId),
        pockets: record.pockets || {},
        recession: record.recession !== undefined && record.recession !== null ? Number(record.recession) : undefined,
        mobility: record.mobility || undefined,
        furcation: record.furcation || undefined,
        conditions: record.conditions || {},
    }));
};

const mapEndodonticRecords = (records: any[]): EndodonticRecord[] => {
    return (records || []).map((record: any) => ({
        id: String(record.id),
        date: record.date || record.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        toothId: Number(record.tooth_id),
        pulpalDiagnosis: record.pulpal_diagnosis,
        periapicalDiagnosis: record.periapical_diagnosis,
        canals: record.canals || [],
        obturationMaterial: record.obturation_material,
        postType: record.post_type,
        notes: record.notes || '',
    }));
};

type GetPatientsFilters = {
    branchId?: string | number;
    status?: 'Active' | 'Inactive';
    gender?: 'Male' | 'Female' | 'Other';
    page?: number;
    perPage?: number;
};

export const mapOrthodonticRecords = (records: any): OrthodonticRecord[] => {
    if (!records || !Array.isArray(records)) return [];
    return records.map((record: any) => ({
        id: record.id,
        appliance: record.appliance,
        applianceLocation: record.appliance_location || record.applianceLocation,
        treatmentPhase: record.treatment_phase || record.treatmentPhase,
        wireSize: record.wire_size || record.wireSize,
        wireSizeUpper: record.wire_size_upper || record.wireSizeUpper,
        wireSizeLower: record.wire_size_lower || record.wireSizeLower,
        archwireMaterial: record.archwire_material || record.archwireMaterial,
        elastics: record.elastics,
        compliance: record.compliance,
        oralHygiene: record.oral_hygiene || record.oralHygiene,
        bracketChanges: record.bracket_changes || record.bracketChanges || [],
        brokenBrackets: record.broken_brackets || record.brokenBrackets || [],
        nextVisitGoals: record.next_visit_goals || record.nextVisitGoals,
        monthsInTreatment: record.months_in_treatment ?? record.monthsInTreatment ?? 0,
        notes: record.notes || '',
        date: record.date || record.created_at || new Date().toISOString().split('T')[0],
    }));
};

export const getPatients = async (filters?: string | number | GetPatientsFilters): Promise<PaginatedArray<Patient>> => {
    console.log('API CALL: getPatients', { filters });

    try {
        const params: { branch_id?: number; status?: string; gender?: string; page?: number; per_page?: number } = {};

        if (typeof filters === 'number' || typeof filters === 'string') {
            const parsed = parseInt(String(filters), 10);
            if (!isNaN(parsed) && parsed > 0) {
                params.branch_id = parsed;
            }
        } else if (filters) {
            if (filters.branchId) {
                const parsed = parseInt(String(filters.branchId), 10);
                if (!isNaN(parsed) && parsed > 0) {
                    params.branch_id = parsed;
                }
            }
            if (filters.status) {
                params.status = filters.status;
            }
            if (filters.gender) {
                params.gender = filters.gender;
            }
            if (filters.page) {
                params.page = filters.page;
            }
            if (filters.perPage) {
                params.per_page = filters.perPage;
            }
        }

        const response = await customAxios.get('/patients', { params });

        // Handle both response.data and response.data.data formats
        const dataArray = Array.isArray(response.data) ? response.data : (response.data.data || []);

        // Map API response to frontend type
        const patientsList: PaginatedArray<Patient> = dataArray.map((patient: any) => ({
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
            nextVisit: patient.next_visit ? patient.next_visit.split('T')[0] : patient.next_visit,
            status: patient.status,
            history: patient.history || '',
            branchId: String(patient.branch_id),
            dentalRecords: patient.dental_records || [],
            treatmentPlans: patient.treatment_plans || [],
            imaging: patient.images || patient.imaging || [], // Backend returns 'images', not 'imaging'
            periodontalRecords: mapPeriodontalRecords(patient.periodontal_records),
            occlusalRecords: typeof patient.occlusal_records === 'string'
                ? JSON.parse(patient.occlusal_records)
                : (patient.occlusal_records || { overbite: 0, overjet: 0, crossbite: 'None', openbite: 'None', malocclusion: 'Class I' }),
            softTissueRecords: patient.soft_tissue_records || [],
            orthodonticRecords: mapOrthodonticRecords(patient.orthodontic_records),
            endodonticRecords: mapEndodonticRecords(patient.endodontic_records || patient.endodonticRecords),
        }));

        if (response.data && response.data.meta) {
            patientsList.meta = response.data.meta;
        }

        return patientsList;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to fetch patients:', error.response?.data);
        } else {
            console.error("An unexpected error occurred while fetching patients:", error);
        }
        const emptyArray: PaginatedArray<Patient> = [];
        return emptyArray;
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
            nextVisit: patient.next_visit ? patient.next_visit.split('T')[0] : patient.next_visit,
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
            periodontalRecords: mapPeriodontalRecords(patient.periodontal_records),
            occlusalRecords: typeof patient.occlusal_records === 'string'
                ? JSON.parse(patient.occlusal_records)
                : (patient.occlusal_records || { overbite: 0, overjet: 0, crossbite: 'None', openbite: 'None', malocclusion: 'Class I' }),
            softTissueRecords: patient.soft_tissue_records || [],
            orthodonticRecords: mapOrthodonticRecords(patient.orthodontic_records),
            endodonticRecords: mapEndodonticRecords(patient.endodontic_records || patient.endodonticRecords),
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

export const getPatientInvoices = async (patientId: string | number): Promise<Invoice[]> => {
    console.log('API CALL: getPatientInvoices', { patientId });
    try {
        const response = await customAxios.get(`/patients/${patientId}/invoices`);
        const rawInvoices = Array.isArray(response.data) ? response.data : [];
        return rawInvoices.map((inv: any) => ({
            ...inv,
            id: String(inv.id),
            amount: Number(inv.amount),
            paidAmount: Number(inv.paid_amount),
            patientName: inv.patient_name,
            patientId: inv.patient_id ?? inv.patientId,
            issueDate: inv.issue_date,
            dueDate: inv.due_date,
            branchId: inv.branch_id,
        }));
    } catch (error) {
        console.error('Failed to fetch patient invoices:', error);
        return [];
    }
};

export const getDoctors = async (branchId?: string | number): Promise<Employee[]> => {
    console.log('API CALL: getDoctors', { branchId });
    try {
        const params: { branch_id?: string | number } = {}; 
        if (branchId) {
            params.branch_id = branchId;
        }

        const response = await customAxios.get('/doctors', { params });
        const doctorData = Array.isArray(response.data)
            ? response.data
            : (response.data?.data ?? []);

        return doctorData.map((emp: any) => ({
            id: emp.id,
            name: emp.name,
            avatar: emp.avatar || '',
            email: emp.email || '',
            role: emp.role,
            status: emp.status || 'Active',
            branchId: String(emp.branch_id ?? emp.branch?.id ?? ''),
            branch: emp.branch ? {
                id: emp.branch.id,
                name: emp.branch.name,
                address: emp.branch.address,
            } : undefined,
        }));
    } catch (error) {
        console.error('Error fetching doctors:', error);
        return [];
    }
};

export const getAppointments = async (filters?: {
    patient_id?: string | number;
    doctor_id?: string | number;
    branch_id?: string | number;
    status?: string;
    date?: string; // YYYY-MM-DD
    date_from?: string; // YYYY-MM-DD
    date_to?: string; // YYYY-MM-DD
    search?: string;
    page?: number;
    perPage?: number;
}): Promise<PaginatedArray<Appointment>> => {
    console.log('API CALL: getAppointments', { filters });
    
    try {
        // ✅ Build query parameters
        const params: any = {};
        
        if (filters?.patient_id) params.patient_id = filters.patient_id;
        if (filters?.doctor_id) params.doctor_id = filters.doctor_id;
        if (filters?.branch_id) params.branch_id = filters.branch_id;
        if (filters?.status) params.status = filters.status;
        if (filters?.date) params.date = filters.date;
        if (filters?.date_from) params.date_from = filters.date_from;
        if (filters?.date_to) params.date_to = filters.date_to;
        if (filters?.search) params.search = filters.search;
        if (filters?.page) params.page = filters.page;
        if (filters?.perPage) params.per_page = filters.perPage;

        // ✅ Make API call
        const response = await customAxios.get('/appointments', { params });
        
        // Handle different response formats
        let appointmentData = response.data;
        if (appointmentData?.data && Array.isArray(appointmentData.data)) {
            appointmentData = appointmentData.data;
        } else if (!Array.isArray(appointmentData)) {
            console.error('Unexpected response format:', appointmentData);
            const emptyArray: PaginatedArray<Appointment> = [];
            return emptyArray;
        }

        console.log(`Fetched ${appointmentData.length} appointments`);

        // Normalize to frontend Appointment type
        const mapped: PaginatedArray<Appointment> = appointmentData.map((a: any) => ({
            id: a.id,
            patientName: a.patient_name ?? a.patientName ?? (a.patient && (a.patient.first_name + ' ' + (a.patient.last_name || '')) ) ?? '',
            patientId: a.patient_id ?? a.patientId ?? (a.patient && a.patient.id) ?? '',
            doctorName: a.doctor_name ?? a.doctorName ?? (a.doctor && a.doctor.name) ?? '',
            doctorId: a.doctor_id ?? a.doctorId ?? (a.doctor && a.doctor.id) ?? '',
            treatment: a.treatment ?? a.procedure ?? '',
            status: a.status ?? 'Scheduled',
            // API returns date as ISO string (e.g. 2024-07-20T00:00:00.000000Z)
            // Normalize to YYYY-MM-DD so frontend date filters match
            date: (() => {
                const raw = a.date ?? a.appointment_date ?? '';
                if (typeof raw === 'string' && raw.includes('T')) return raw.split('T')[0];
                return raw;
            })(),
            time: a.time ?? a.appointment_time ?? '',
            branchId: a.branch_id ?? a.branchId ?? (a.branch && a.branch.id) ?? '',
            tokenNumber: a.token_number ?? a.tokenNumber ?? '',
        }));

        if (response.data && response.data.meta) {
            mapped.meta = response.data.meta;
        }

        return mapped;

    } catch (error) {
        console.error('Error fetching appointments:', error);
        
        if (axios.isAxiosError(error)) {
            console.error('API Error:', error.response?.data);
            
            if (error.response?.status === 403) {
                console.error('Permission denied to fetch appointments');
                const emptyArray: PaginatedArray<Appointment> = [];
                return emptyArray;
            }
            if (error.response?.status === 404) {
                console.warn('Appointments endpoint not found');
                const emptyArray: PaginatedArray<Appointment> = [];
                return emptyArray;
            }
        }
        
        return [];
    }
};

type CreateAppointmentPayload = {
    patient_name: string;
    patient_id: string | number;
    doctor_name: string;
    doctor_id: string | number;
    treatment: string;
    date: string; // YYYY-MM-DD
    time: string; // e.g., "10:00 AM"
    branch_id: string | number;
};

export const createAppointment = async (appointment: CreateAppointmentPayload): Promise<Appointment> => {
    console.log('API CALL: createAppointment', { appointment });
    
    try {
        // ✅ Validate required fields
        const requiredFields = ['patient_name', 'patient_id', 'doctor_name', 'doctor_id', 'treatment', 'date', 'time', 'branch_id'];
        for (const field of requiredFields) {
            if (!appointment[field as keyof CreateAppointmentPayload]) {
                throw new Error(`Field "${field}" is required`);
            }
        }

        // ✅ Make API call with the exact payload structure expected by backend
        const response = await customAxios.post('/appointments', {
            patient_name: appointment.patient_name,
            patient_id: appointment.patient_id,
            doctor_name: appointment.doctor_name,
            doctor_id: appointment.doctor_id,
            treatment: appointment.treatment,
            date: appointment.date,
            time: appointment.time,
            branch_id: appointment.branch_id,
        });
        
        // Handle response
        let appointmentData: any = response.data;
        if (appointmentData?.data) {
            appointmentData = appointmentData.data;
        }
        
        if (!appointmentData) {
            throw new Error('No appointment data returned from API');
        }

        const mappedAppointment: Appointment = {
            id: appointmentData.id,
            patientName: appointmentData.patient_name ?? appointmentData.patientName ?? appointment.patient_name,
            patientId: appointmentData.patient_id ?? appointmentData.patientId ?? appointment.patient_id,
            doctorName: appointmentData.doctor_name ?? appointmentData.doctorName ?? appointment.doctor_name,
            doctorId: appointmentData.doctor_id ?? appointmentData.doctorId ?? appointment.doctor_id,
            treatment: appointmentData.treatment ?? appointment.treatment,
            status: appointmentData.status ?? 'Scheduled',
            date: (() => {
                const raw = appointmentData.date ?? appointment.date ?? '';
                if (typeof raw === 'string' && raw.includes('T')) return raw.split('T')[0];
                return raw;
            })(),
            time: appointmentData.time ?? appointment.time,
            branchId: appointmentData.branch_id ?? appointmentData.branchId ?? appointment.branch_id,
            tokenNumber: appointmentData.token_number ?? appointmentData.tokenNumber ?? '',
        };

        console.log('Created appointment:', mappedAppointment);
        return mappedAppointment;

    } catch (error) {
        console.error('Error creating appointment:', error);
        
        if (axios.isAxiosError(error)) {
            // Handle validation errors (422)
            if (error.response?.status === 422) {
                const errors = error.response?.data?.errors;
                if (errors) {
                    const errorMessages = Object.values(errors).flat().join(', ');
                    throw new Error(`Validation failed: ${errorMessages}`);
                }
                throw new Error('Validation failed. Please check your input.');
            }
            
            // Handle other errors
            throw new Error(error.response?.data?.message || 'Failed to create appointment');
        }
        
        throw error;
    }
};


export const getInvoices = async (filters?: {
    branchId?: string | number;
    status?: string;
    searchQuery?: string;
    dateRange?: { from?: Date; to?: Date };
    page?: number;
    perPage?: number;
}): Promise<PaginatedArray<Invoice>> => {
    console.log('API CALL: getInvoices', { filters });

    // ✅ Build params exactly as backend expects
    const params: any = {};

    if (filters?.branchId) params.branch_id = filters.branchId;
    if (filters?.status) params.status = filters.status;
    if (filters?.page) params.page = filters.page;
    if (filters?.perPage) params.per_page = filters.perPage;

    try {
        // ✅ API CALL
        const response = await customAxios.get('/invoices', { params });

        const rawInvoices = Array.isArray(response.data) ? response.data : (response.data.data || []);

        let invoices: PaginatedArray<Invoice> = rawInvoices.map((inv: any) => ({
            ...inv,

            // ✅ FIX TYPES
            amount: Number(inv.amount),
            paidAmount: Number(inv.paid_amount),

            // ✅ FIX FIELD NAMES (VERY IMPORTANT)
            patientName: inv.patient_name,
            patientId: inv.patient_id ?? inv.patientId,
            issueDate: inv.issue_date,
            branchId: inv.branch_id,
            discount: Number(inv.discount || 0),
            tax: Number(inv.tax || 0),
            insuranceCoverage: Number(inv.insurance_coverage || 0),
            branch: inv.branch ? {
                id: inv.branch.id,
                name: inv.branch.name,
                currency: inv.branch.currency || 'USD',
                address: inv.branch.address || ''
            } : undefined,
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

        const dateFrom = filters?.dateRange?.from;
        if (dateFrom) {
            invoices = invoices.filter((inv: any) =>
                new Date(inv.issue_date) >= dateFrom
            );
        }

        const dateTo = filters?.dateRange?.to;
        if (dateTo) {
            invoices = invoices.filter((inv: any) =>
                new Date(inv.issue_date) <= dateTo
            );
        }

        if (response.data && response.data.meta) {
            invoices.meta = response.data.meta;
        }

        return invoices;

    } catch (error) {
        console.error('Error fetching invoices:', error);
        const emptyArray: PaginatedArray<Invoice> = [];
        return emptyArray;
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
            dueDate: invoiceData.due_date || invoiceData.dueDate || new Date().toISOString(),
            paymentMethod: invoiceData.payment_method || invoiceData.paymentMethod || null,
            discount: Number(invoiceData.discount || 0),
            tax: Number(invoiceData.tax || 0),
            insuranceCoverage: Number(invoiceData.insurance_coverage || 0),
            branchId: invoiceData.branch_id || invoiceData.branchId,
            branch: invoiceData.branch ? {
                id: invoiceData.branch.id,
                name: invoiceData.branch.name,
                currency: invoiceData.branch.currency || 'USD',
                address: invoiceData.branch.address || ''
            } : undefined,
            otherCharges: (invoiceData.other_charges || invoiceData.otherCharges || []).map((charge: any) => ({
                description: charge.description,
                amount: Number(charge.amount) || 0
            })),
            transactions: (invoiceData.transactions || []).map((tx: any) => ({
                id: tx.id,
                date: tx.date || tx.created_at,
                amount: Number(tx.amount) || 0,
                method: tx.method
            })),
            treatments: (invoiceData.treatments || []).map((t: any) => ({
                procedureId: t.procedure_id || t.id || '',
                procedure: t.procedure || '',
                cost: Number(t.cost) || 0,
                tooth: t.tooth
            })),
            // Keep original fields for reference (optional)
            patient_name: invoiceData.patient_name,
            patient_id: invoiceData.patient_id,
            issue_date: invoiceData.issue_date,
            paid_amount: invoiceData.paid_amount,
            branch_id: invoiceData.branch_id,
            medicines: invoiceData.medicines || [],
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
            approvalStatus: p.approval_status,
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

export const getInventory = async (branchId?: string | number, page?: number, perPage?: number): Promise<PaginatedArray<InventoryItem>> => {
    console.log('API CALL: getInventory', { branchId, page, perPage });
    try {
        const params: any = {};
        if (branchId !== undefined && branchId !== null) {
            params.branch_id = branchId;
        }
        if (page) params.page = page;
        if (perPage) params.per_page = perPage;

        const response = await customAxios.get('/management/inventory', { params });
        const rawItems = Array.isArray(response.data) ? response.data : (response.data.data || []);
        
        const items: PaginatedArray<InventoryItem> = rawItems.map((item: any) => ({
            id: item.id,
            name: item.name,
            supplier: item.supplier,
            stock: item.stock,
            reorderLevel: item.reorder_level || item.reorderLevel,
            price: parseFloat(item.price),
            status: item.status,
            branchId: String(item.branch_id),
        }));

        if (response.data && response.data.meta) {
            items.meta = response.data.meta;
        }
        return items;
    } catch (error) {
        console.error('Error fetching inventory:', error);
        const emptyArray: PaginatedArray<InventoryItem> = [];
        return emptyArray;
    }
}

export const getLabOrders = async (branchId?: string | number, page?: number, perPage?: number): Promise<PaginatedArray<LaboratoryOrder>> => {
    console.log('API CALL: getLabOrders', { branchId, page, perPage });
    try {
        const params: any = {};
        if (branchId !== undefined && branchId !== null) {
            params.branch_id = branchId;
        }
        if (page) params.page = page;
        if (perPage) params.per_page = perPage;

        const response = await customAxios.get('/management/lab-orders', { params });
        const rawOrders = Array.isArray(response.data) ? response.data : (response.data.data || []);
        
        const orders: PaginatedArray<LaboratoryOrder> = rawOrders.map((order: any) => ({
            id: order.id,
            patientId: String(order.patient_id),
            patientName: order.patient_name || (order.patient ? `${order.patient.first_name} ${order.patient.last_name}` : ''),
            lab: order.lab,
            item: order.item,
            tooth: order.tooth,
            status: order.status,
            sentDate: order.sent_date ? order.sent_date.split('T')[0] : '',
            dueDate: order.due_date ? order.due_date.split('T')[0] : '',
            branchId: String(order.branch_id),
        }));

        if (response.data && response.data.meta) {
            orders.meta = response.data.meta;
        }
        return orders;
    } catch (error) {
        console.error('Error fetching lab orders:', error);
        const emptyArray: PaginatedArray<LaboratoryOrder> = [];
        return emptyArray;
    }
}

export const getChartData = async (): Promise<ChartData[]> => {
    console.log('API CALL: getChartData');
    try {
        const response = await customAxios.get('/management/chart-data');
        return response.data;
    } catch (error) {
        console.error('Error fetching chart data:', error);
        return [];
    }
}

export const getPracticeTrends = async (branchId?: string | number): Promise<PracticeTrendPoint[]> => {
    console.log('API CALL: getPracticeTrends', { branchId });
    try {
        const params: Record<string, string | number> = {};
        if (branchId !== undefined && branchId !== null) {
            params.branch_id = branchId;
        }

        const response = await customAxios.get('/practice-trends', { params });
        let data: any = response.data;
        if (data?.data) {
            data = data.data;
        }
        if (!data?.trend || !Array.isArray(data.trend)) {
            console.warn('Unexpected practice trends response', data);
            return [];
        }

        return data.trend.map((point: any) => ({
            date: point.date,
            revenue: Number(point.revenue) || 0,
            appointments: Number(point.appointments) || 0,
            newPatients: Number(point.new_patients) || 0,
        }));
    } catch (error) {
        console.error('Failed to fetch practice trends:', error);
        return [];
    }
};

export const getDashboardSummary = async (branchId?: string | number): Promise<DashboardSummary | null> => {
    console.log('API CALL: getDashboardSummary', { branchId });

    try {
        const params: any = {};
        if (branchId) params.branch_id = branchId;

        const response = await customAxios.get('/dashboard-summary', { params });
        let data: any = response.data;
        if (data?.data) {
            data = data.data;
        }

        if (!data) {
            console.error('Dashboard summary API returned no data');
            return null;
        }

        return {
            totalRevenue: Number(data.total_revenue) || 0,
            activePatients: Number(data.active_patients) || 0,
            appointmentsLast30Days: Number(data.appointments_last_30_days) || 0,
            newPatientsLast30Days: Number(data.new_patients_last_30_days) || 0,
            practiceOverview: data.practice_overview || '',
            upcomingAppointments: Array.isArray(data.upcoming_appointments)
                ? data.upcoming_appointments.map((item: any) => ({
                    id: item.id,
                    patientName: item.patient_name,
                    doctorName: item.doctor_name,
                    date: item.date,
                    time: item.time,
                    status: item.status,
                    treatment: item.treatment ?? item.procedure ?? undefined,
                    tokenNumber: item.token_number ?? item.tokenNumber ?? undefined,
                }))
                : [],
            recentPatients: Array.isArray(data.recent_patients)
                ? data.recent_patients.map((item: any) => ({
                    id: item.id,
                    firstName: item.first_name,
                    lastName: item.last_name,
                    lastVisit: item.last_visit,
                }))
                : [],
        };
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        if (axios.isAxiosError(error)) {
            console.error('API Error:', error.response?.data);
        }
        return null;
    }
};

export const getTreatments = async (params?: { search?: string, category?: string }): Promise<SystemTreatment[]> => {
    // Only use cache if no params are provided
    if (!params?.search && !params?.category && treatmentsCache) return treatmentsCache;
    console.log('API CALL: getTreatments', params);
    try {
        const response = await customAxios.get('/procedures', { params });
        
        // Handle both array and wrapped response formats
        const treatmentData = Array.isArray(response.data) ? response.data : (response.data.data || []);
        
        // Map API response to SystemTreatment type
        const results = treatmentData.map((treatment: any) => ({
            id: treatment.id,
            procedure: treatment.procedure || treatment.name || '',
            cost: parseFloat(treatment.cost || treatment.price || '0'),
            description: treatment.description || '',
            category: treatment.category || '',
        }));
        
        if (!params?.search && !params?.category) {
            treatmentsCache = results;
        }
        return results;
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

export const createSystemTreatment = async (data: Omit<SystemTreatment, 'id'>): Promise<SystemTreatment> => {
    const response = await customAxios.post('/procedures', data);
    treatmentsCache = null; // invalidate cache
    return response.data;
}

export const updateSystemTreatment = async (id: string | number, data: Partial<SystemTreatment>): Promise<SystemTreatment> => {
    const response = await customAxios.put(`/procedures/${id}`, data);
    treatmentsCache = null; // invalidate cache
    return response.data;
}

export const deleteSystemTreatment = async (id: string | number): Promise<void> => {
    await customAxios.delete(`/procedures/${id}`);
    treatmentsCache = null; // invalidate cache
}

export const getAttendance = async (branchId?: string | number): Promise<AttendanceRecord[]> => {
    console.log('API CALL: getAttendance', { branchId });
    try {
        const params: any = {};
        if (branchId !== undefined && branchId !== null) {
            params.branch_id = branchId;
        }
        const response = await customAxios.get('/management/attendance', { params });
        const records = response.data;
        return records.map((record: any) => ({
            id: record.id,
            employeeId: String(record.employee_id),
            employeeName: record.employee_name || (record.employee ? record.employee.name : ''),
            date: record.date,
            status: record.status,
            checkIn: record.check_in,
            checkOut: record.check_out,
            branchId: String(record.branch_id),
        }));
    } catch (error) {
        console.error('Error fetching attendance:', error);
        return [];
    }
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


export const getRoles = async (): Promise<RolePermissions[]> => {
    if (rolesCache) return rolesCache;
    console.log('API CALL: getRoles');
    try {
        const response = await customAxios.get('/settings/roles');
        rolesCache = response.data.data;
        return rolesCache || [];
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
    if (rolesListCache) return rolesListCache;
    console.log('API CALL: getRolesList');
     try {
        const response = await customAxios.get('/roles');
        if (response.data && Array.isArray(response.data.data)) {
            rolesListCache = response.data.data.map((role: any) => ({ ...role, id: String(role.id) }));
            return rolesListCache || [];
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


export const getFinancialSummary = async (filters?: { branchId?: string | number; dateFrom?: string; dateTo?: string }): Promise<FinancialSummary> => {
    console.log('API CALL: getFinancialSummary', { filters });

    try {
        const params: Record<string, string | number> = {};
        if (filters?.branchId !== undefined && filters?.branchId !== null) {
            params.branch_id = filters.branchId;
        }
        if (filters?.dateFrom) params.date_from = filters.dateFrom;
        if (filters?.dateTo) params.date_to = filters.dateTo;

        const response = await customAxios.get('/financial-summary', { params });
        let data: any = response.data;
        if (data?.data) {
            data = data.data;
        }

        const monthlyFinancials = Array.isArray(data.financial_summary)
            ? data.financial_summary.map((item: any) => ({
                month: item.month,
                income: Number(item.income) || 0,
                expense: Number(item.expenses ?? item.expense) || 0,
                netProfit: Number(item.net_profit) || 0,
            }))
            : [];

        return {
            branchId: data.branch_id,
            from: data.from,
            to: data.to,
            totalIncome: Number(data.total_income) || 0,
            totalExpenses: Number(data.total_expenses) || 0,
            netProfit: Number(data.net_profit) || 0,
            monthlyFinancials,
        };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to fetch financial summary:', error.response?.data);
        } else {
            console.error('An unexpected error occurred while fetching financial summary:', error);
        }

        // Fallback to mocked summary if the real API call fails.
        await delay(300);

        const branchId = filters?.branchId;
        const branchInvoices = branchId ? allInvoices.filter(i => String(i.branchId) === String(branchId)) : allInvoices;
        const branchPayrolls = branchId ? mockPayrolls.filter(p => String(p.branchId) === String(branchId)) : mockPayrolls;
        const branchExpenses = branchId ? allExpenses.filter(e => String(e.branchId) === String(branchId)) : allExpenses;

        const paidInvoices = branchInvoices.filter(i => i.status === 'Paid');
        const totalIncome = paidInvoices.reduce((sum, i) => sum + i.amount, 0);

        const payrollExpenses = branchPayrolls.reduce((sum, p) => sum + Number(p.grossPay), 0);
        const otherExpenses = branchExpenses.reduce((sum, e) => sum + e.amount, 0);
        const totalExpenses = payrollExpenses + otherExpenses;
        const netProfit = totalIncome - totalExpenses;

        const financialsByMonth: Record<string, { income: number; expense: number; netProfit: number }> = {};

        paidInvoices.forEach(invoice => {
            const monthKey = format(new Date(invoice.issueDate), 'yyyy-MM');
            if (!financialsByMonth[monthKey]) financialsByMonth[monthKey] = { income: 0, expense: 0, netProfit: 0 };
            financialsByMonth[monthKey].income += invoice.amount;
            financialsByMonth[monthKey].netProfit += invoice.amount;
        });

        branchPayrolls.forEach(payroll => {
            const payDate = payroll.payDate.split('T')[0];
            const monthKey = format(new Date(payDate), 'yyyy-MM');
            if (!financialsByMonth[monthKey]) financialsByMonth[monthKey] = { income: 0, expense: 0, netProfit: 0 };
            financialsByMonth[monthKey].expense += Number(payroll.grossPay);
            financialsByMonth[monthKey].netProfit -= Number(payroll.grossPay);
        });

        branchExpenses.forEach(expense => {
            const monthKey = format(new Date(expense.date), 'yyyy-MM');
            if (!financialsByMonth[monthKey]) financialsByMonth[monthKey] = { income: 0, expense: 0, netProfit: 0 };
            financialsByMonth[monthKey].expense += expense.amount;
            financialsByMonth[monthKey].netProfit -= expense.amount;
        });

        const monthlyFinancials = Object.keys(financialsByMonth)
            .sort()
            .slice(-6)
            .map(monthKey => ({
                month: format(parse(monthKey, 'yyyy-MM', new Date()), 'MMM'),
                income: financialsByMonth[monthKey].income,
                expense: financialsByMonth[monthKey].expense,
                netProfit: financialsByMonth[monthKey].netProfit,
            }));

        return { branchId, from: undefined, to: undefined, totalIncome, totalExpenses, netProfit, monthlyFinancials };
    }
}

export const getReportsOverview = async (
    branchId?: string | number,
    startDate?: string,
    endDate?: string
): Promise<ReportsOverview | null> => {
    console.log('API CALL: getReportsOverview', { branchId, startDate, endDate });

    try {
        const params: Record<string, string | number> = {};
        if (branchId !== undefined && branchId !== null && branchId !== '') {
            params.branch_id = branchId;
        }
        if (startDate) {
            params.start_date = startDate;
        }
        if (endDate) {
            params.end_date = endDate;
        }

        const response = await customAxios.get('/reports/overview', { params });
        const data = response.data;

        return {
            categories: data.categories,
            financial_summary: {
                total_income: Number(data.financial_summary?.total_income) || 0,
                total_expenses: Number(data.financial_summary?.total_expenses) || 0,
                net_profit: Number(data.financial_summary?.net_profit) || 0,
            },
            appointment_summary: {
                total_appointments: Number(data.appointment_summary?.total_appointments) || 0,
                status_distribution: data.appointment_summary?.status_distribution || {},
            },
            patient_summary: {
                total_patients: Number(data.patient_summary?.total_patients) || 0,
                status_distribution: data.patient_summary?.status_distribution || {},
                gender_distribution: data.patient_summary?.gender_distribution || {},
                age_distribution: data.patient_summary?.age_distribution || {},
            },
        };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to fetch reports overview:', error.response?.data);
        } else {
            console.error('An unexpected error occurred while fetching reports overview:', error);
        }
        return null;
    }
}

export const getExpenses = async (filters?: string | number | {
    branchId?: string | number;
    category?: string;
    status?: string;
    dateFrom?: string; // YYYY-MM-DD
    dateTo?: string; // YYYY-MM-DD
    search?: string;
    minAmount?: number;
    maxAmount?: number;
    page?: number;
    perPage?: number;
}): Promise<PaginatedArray<Expense>> => {
    console.log('API CALL: getExpenses', { filters });
    
    try {
        // ✅ Build query parameters
        const params: any = {};
        
        if (typeof filters === 'string' || typeof filters === 'number') {
            params.branch_id = filters;
        } else if (filters) {
            if (filters.branchId) params.branch_id = filters.branchId;
            if (filters.category) params.category = filters.category;
            if (filters.status) params.status = filters.status;
            if (filters.dateFrom) params.date_from = filters.dateFrom;
            if (filters.dateTo) params.date_to = filters.dateTo;
            if (filters.search) params.search = filters.search;
            if (filters.minAmount) params.min_amount = filters.minAmount;
            if (filters.maxAmount) params.max_amount = filters.maxAmount;
            if (filters.page) params.page = filters.page;
            if (filters.perPage) params.per_page = filters.perPage;
        }

        // ✅ Make API call to /expense-records
        const response = await customAxios.get('/expense-records', { params });
        
        // Handle different response formats
        let expenseData = response.data;
        if (expenseData?.data && Array.isArray(expenseData.data)) {
            expenseData = expenseData.data;
        }

        if (expenseData && Array.isArray(expenseData.records)) {
            expenseData = expenseData.records;
        }

        if (!Array.isArray(expenseData)) {
            console.error('Unexpected response format:', response.data);
            const emptyArray: PaginatedArray<Expense> = [];
            return emptyArray;
        }

        const expenses: PaginatedArray<Expense> = expenseData.map((expense: any) => {
            if (expense.type === 'payroll') {
                return {
                    id: expense.id || expense.employee_id,
                    branchId: expense.branch_id || expense.branchId,
                    date: expense.pay_date || expense.date || new Date().toISOString().split('T')[0],
                    category: 'Payroll',
                    description: expense.employee_name ? `Payroll for ${expense.employee_name}` : expense.pay_period || 'Payroll',
                    amount: Number(expense.net_pay) || Number(expense.amount) || 0,
                    type: 'payroll',
                    employeeName: expense.employee_name,
                    payPeriod: expense.pay_period,
                    netPay: Number(expense.net_pay) || 0,
                    deductions: Number(expense.deductions) || 0,
                };
            }

            return {
                id: expense.id || expense.expense_id,
                branchId: expense.branch_id || expense.branchId,
                date: expense.date || expense.expense_date || new Date().toISOString().split('T')[0],
                category: expense.category || 'Other',
                description: expense.description || '',
                amount: Number(expense.amount) || 0,
                type: 'operation',
            };
        });

        if (response.data && response.data.meta) {
            expenses.meta = response.data.meta;
        }

        console.log(`Fetched ${expenses.length} expenses`);
        return expenses;

    } catch (error) {
        console.error('Error fetching expenses:', error);
        
        if (axios.isAxiosError(error)) {
            console.error('API Error:', error.response?.data);
            
            if (error.response?.status === 403) {
                console.error('Permission denied to fetch expenses');
                const emptyArray: PaginatedArray<Expense> = [];
                return emptyArray;
            }
            if (error.response?.status === 404) {
                console.warn('Expenses endpoint not found');
                const emptyArray: PaginatedArray<Expense> = [];
                return emptyArray;
            }
        }
        
        const emptyArray: PaginatedArray<Expense> = [];
        return emptyArray;
    }
};

export const getExpenseSummary = async (filters?: { branchId?: string | number; dateFrom?: string; dateTo?: string }): Promise<ExpenseSummary | null> => {
    console.log('API CALL: getExpenseSummary', { filters });

    try {
        const params: Record<string, string | number> = {};
        if (filters?.branchId !== undefined && filters?.branchId !== null) {
            params.branch_id = filters.branchId;
        }
        if (filters?.dateFrom) params.date_from = filters.dateFrom;
        if (filters?.dateTo) params.date_to = filters.dateTo;

        const response = await customAxios.get('/expense-records', { params });
        let data: any = response.data;
        if (data?.data) {
            data = data.data;
        }

        if (!data) {
            console.error('Expense summary API returned no data');
            return null;
        }

        const records = Array.isArray(data.records) ? data.records : [];

        return {
            branch: data.branch ?? null,
            total: Number(data.total) || 0,
            totalPayroll: Number(data.total_payroll) || 0,
            totalOperationalExpenses: Number(data.total_operational_expenses) || 0,
            records: records.map((expense: any) => {
                if (expense.type === 'payroll') {
                    return {
                        id: expense.id,
                        branchId: expense.branch_id || expense.branchId,
                        date: expense.pay_date || expense.date || '',
                        category: 'Payroll',
                        description: expense.pay_period || `Payroll for ${expense.employee_name}`,
                        amount: Number(expense.net_pay) || Number(expense.amount) || 0,
                        type: 'payroll',
                        employeeName: expense.employee_name,
                        payPeriod: expense.pay_period,
                        netPay: Number(expense.net_pay) || 0,
                        deductions: Number(expense.deductions) || 0,
                        branch: expense.branch ? {
                            id: expense.branch.id,
                            name: expense.branch.name,
                            address: expense.branch.address || '',
                        } : undefined,
                    };
                }

                return {
                    id: expense.id,
                    branchId: expense.branch_id || expense.branchId,
                    date: expense.date || expense.expense_date || '',
                    category: expense.category || 'Other',
                    description: expense.description || '',
                    amount: Number(expense.amount) || 0,
                    type: 'operation',
                    branch: expense.branch ? {
                        id: expense.branch.id,
                        name: expense.branch.name,
                        address: expense.branch.address || '',
                    } : undefined,
                };
            }),
        };
    } catch (error) {
        console.error('Failed to fetch expense summary:', error);
        return null;
    }
};

export const getIncomeRecords = async (filters?: { branchId?: string | number; dateFrom?: string; dateTo?: string; search?: string }): Promise<IncomeRecord[]> => {
    console.log('API CALL: getIncomeRecords', { filters }); 
    try {
        const params: any = {};
        if (filters?.branchId) params.branch_id = filters.branchId;
        if (filters?.dateFrom) params.date_from = filters.dateFrom;
        if (filters?.dateTo) params.date_to = filters.dateTo;
        if (filters?.search) params.search = filters.search;
        
        const response = await customAxios.get('/income-records', { params });

        let incomeData = response.data;
        if (incomeData?.data && Array.isArray(incomeData.data)) {
            incomeData = incomeData.data;
        }
        if (incomeData?.records && Array.isArray(incomeData.records)) {
            incomeData = incomeData.records;
        }
        if (!Array.isArray(incomeData)) {
            console.error('Unexpected response format:', incomeData);
            return [];
        }

        return incomeData.map((item: any) => ({
            id: item.id,
            branchId: item.branch_id || item.branchId || item.branch?.id,
            date: item.issue_date ? String(item.issue_date).split('T')[0] : item.date || item.invoice_date || '',
            patientName: item.patient_name || item.patientName || [item.patient?.first_name, item.patient?.last_name].filter(Boolean).join(' ') || '',
            amount: Number(item.paid_amount || item.amount || item.total) || 0,
            status: item.status || item.payment_status || 'Paid',
            invoiceNumber: item.invoice_number || item.invoiceNo || item.number || '',
        }));
    } catch (error) {
        console.error('Error fetching income records:', error);
        return [];
    }
};

export const getTodaysQueue = async (filters: { 
    branchId: string | number; 
    doctorId?: string | number;
    status?: string;
}): Promise<Appointment[]> => {
    console.log('API CALL: getTodaysQueue', { filters });
    
    try {
        // ✅ Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // ✅ Build query parameters for appointments API
        const params: any = {
            date: today, // Filter by today's date
            branch_id: filters.branchId,
        };
        
        if (filters.doctorId) {
            params.doctor_id = filters.doctorId;
        }
        
        // Handle status filtering only when explicitly requested
        if (filters.status) {
            params.status = filters.status;
        }

        // ✅ Make API call to appointments endpoint with date filter
        const response = await customAxios.get('/appointments', { params });
        
        // Handle different response formats
        let appointmentsData: any = response.data;
        if (appointmentsData?.data && Array.isArray(appointmentsData.data)) {
            appointmentsData = appointmentsData.data;
        }
        if (!Array.isArray(appointmentsData)) {
            console.error('Unexpected response format:', appointmentsData);
            return [];
        }

        const normalizeStatus = (status?: string): AppointmentStatus => {
            if (!status) return 'Scheduled';
            switch (status) {
                case 'Confirmed':
                    return 'Waiting';
                case 'In Progress':
                    return 'In Session';
                case 'No Show':
                    return 'Cancelled';
                default:
                    return status as AppointmentStatus;
            }
        };

        const normalizedAppointments: Appointment[] = appointmentsData.map((item: any) => ({
            id: item.id,
            patientName: item.patient_name || item.patientName || (item.patient ? [item.patient.first_name, item.patient.last_name].filter(Boolean).join(' ') : '') || '',
            patientId: item.patient_id || item.patientId || item.patient?.id || '',
            doctorName: item.doctor_name || item.doctorName || item.doctor?.name || '',
            doctorId: item.doctor_id || item.doctorId || item.doctor?.id || '',
            treatment: item.treatment || item.procedure || item.service || '',
            status: normalizeStatus(item.status || item.appointment_status || item.state),
            date: item.date || item.appointment_date || item.appointmentDate || today,
            time: item.time || item.appointment_time || item.time_of_day || '',
            branchId: item.branch_id || item.branchId,
            tokenNumber: item.token_number || item.tokenNumber || '',
        }));

        // ✅ Filter appointments for today's queue
        const queueAppointments = normalizedAppointments.filter((appointment) => {
            if (appointment.status === 'Cancelled') return false;
            if (!filters.status && appointment.status === 'Scheduled') return false;
            return true;
        });

        // ✅ Sort by token number (numeric part)
        const sorted = queueAppointments.sort((a, b) => {
            const tokenA = a.tokenNumber || 'T0000';
            const tokenB = b.tokenNumber || 'T0000';
            const numA = parseInt(tokenA.replace(/\D/g, ''), 10) || 0;
            const numB = parseInt(tokenB.replace(/\D/g, ''), 10) || 0;
            return numA - numB;
        });

        console.log(`Fetched ${sorted.length} appointments for today's queue (${today})`);
        return sorted;

    } catch (error) {
        console.error('Error fetching today\'s queue:', error);
        
        if (axios.isAxiosError(error)) {
            console.error('API Error:', error.response?.data);
            
            if (error.response?.status === 403) {
                console.error('Permission denied to fetch appointments');
            }
            if (error.response?.status === 404) {
                console.warn('Appointments endpoint not found');
            }
        }
        
        
        return [];
    }
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
        next_visit: data.nextVisit || undefined,
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
            nextVisit: newPatient.next_visit ? newPatient.next_visit.split('T')[0] : newPatient.next_visit,
            status: newPatient.status,
            history: newPatient.history || '',
            branchId: String(newPatient.branch_id),
            dentalRecords: newPatient.dental_records || [],
            treatmentPlans: newPatient.treatment_plans || [],
            imaging: newPatient.images || newPatient.imaging || [], // Backend returns 'images', not 'imaging'
            periodontalRecords: mapPeriodontalRecords(newPatient.periodontal_records),
            occlusalRecords: typeof newPatient.occlusal_records === 'string'
                ? JSON.parse(newPatient.occlusal_records)
                : (newPatient.occlusal_records || { overbite: 0, overjet: 0, crossbite: 'None', openbite: 'None', malocclusion: 'Class I' }),
            softTissueRecords: newPatient.soft_tissue_records || [],
            orthodonticRecords: mapOrthodonticRecords(newPatient.orthodontic_records),
            endodonticRecords: mapEndodonticRecords(newPatient.endodontic_records || newPatient.endodonticRecords),
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

export const updateNextVisit = async (id: string | number, date: string | null): Promise<Patient | undefined> => {
    console.log('API CALL: updateNextVisit', { id, date });
    try {
        const response = await customAxios.put(`/patients/${id}/next-visit`, { next_visit: date });
        const updatedPatient = response.data;

        const fePatient: Patient = {
            id: updatedPatient.id,
            first_name: updatedPatient.first_name,
            last_name: updatedPatient.last_name,
            email: updatedPatient.email,
            phone: updatedPatient.phone,
            address: updatedPatient.address,
            gender: updatedPatient.gender,
            dateOfBirth: updatedPatient.dateOfBirth || updatedPatient.date_of_birth,
            lastVisit: updatedPatient.lastVisit || updatedPatient.last_visit,
            nextVisit: updatedPatient.nextVisit || updatedPatient.next_visit,
            status: updatedPatient.status,
            branchId: updatedPatient.branchId || updatedPatient.branch_id,
            avatar: updatedPatient.avatar,
            dentalRecords: updatedPatient.dental_records || updatedPatient.dentalRecords || [],
            treatmentPlans: updatedPatient.treatment_plans || updatedPatient.treatmentPlans || [],
            imaging: updatedPatient.patient_images || updatedPatient.imaging || [],
            periodontalRecords: mapPeriodontalRecords(updatedPatient.periodontal_records),
            occlusalRecords: typeof updatedPatient.occlusal_records === 'string'
                ? JSON.parse(updatedPatient.occlusal_records)
                : (updatedPatient.occlusal_records || { overbite: 0, overjet: 0, crossbite: 'None', openbite: 'None', malocclusion: 'Class I' }),
            softTissueRecords: updatedPatient.soft_tissue_records || [],
            orthodonticRecords: mapOrthodonticRecords(updatedPatient.orthodontic_records),
            endodonticRecords: mapEndodonticRecords(updatedPatient.endodontic_records || updatedPatient.endodonticRecords),
        };

        // Update local cache
        const patientIndex = allPatients.findIndex(p => String(p.id) === String(id));
        if (patientIndex !== -1) {
            allPatients[patientIndex] = fePatient;
        }

        return fePatient;
    } catch (error) {
        console.error("Error updating next visit:", error);
        return undefined;
    }
};

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
    if (data.nextVisit !== undefined) requestBody.next_visit = data.nextVisit;
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
            nextVisit: updatedPatient.next_visit ? updatedPatient.next_visit.split('T')[0] : updatedPatient.next_visit,
            status: updatedPatient.status,
            history: updatedPatient.history || '',
            branchId: String(updatedPatient.branch_id),
            dentalRecords: updatedPatient.dental_records || [],
            treatmentPlans: updatedPatient.treatment_plans || [],
            imaging: updatedPatient.images || updatedPatient.imaging || [],
            periodontalRecords: mapPeriodontalRecords(updatedPatient.periodontal_records),
            occlusalRecords: typeof updatedPatient.occlusal_records === 'string'
                ? JSON.parse(updatedPatient.occlusal_records)
                : (updatedPatient.occlusal_records || { overbite: 0, overjet: 0, crossbite: 'None', openbite: 'None', malocclusion: 'Class I' }),
            softTissueRecords: updatedPatient.soft_tissue_records || [],
            orthodonticRecords: mapOrthodonticRecords(updatedPatient.orthodontic_records),
            endodonticRecords: mapEndodonticRecords(updatedPatient.endodontic_records || updatedPatient.endodonticRecords),
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
    try {
        const response = await customAxios.post(`/patients/${patientId}/images`, {
            url: image.url,
            description: image.description,
        });
        const updatedPatient = response.data;

        // Map API response to frontend type
        return {
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
            nextVisit: updatedPatient.next_visit ? updatedPatient.next_visit.split('T')[0] : updatedPatient.next_visit,
            status: updatedPatient.status,
            history: updatedPatient.history || '',
            branchId: String(updatedPatient.branch_id),
            dentalRecords: (updatedPatient.dental_records || []).map((record: any) => ({
                toothId: record.tooth_id,
                condition: record.condition,
                notes: record.notes || '',
            })),
            treatmentPlans: (updatedPatient.treatment_plans || []).map((plan: any) => ({
                id: String(plan.id),
                procedure: plan.procedure,
                tooth: plan.tooth,
                status: plan.status,
                cost: parseFloat(plan.cost),
                date: plan.date,
                invoiceId: plan.invoice_id,
            })),
            imaging: updatedPatient.images || updatedPatient.imaging || [], // Backend returns 'images', not 'imaging'
            periodontalRecords: mapPeriodontalRecords(updatedPatient.periodontal_records),
            occlusalRecords: typeof updatedPatient.occlusal_records === 'string'
                ? JSON.parse(updatedPatient.occlusal_records)
                : (updatedPatient.occlusal_records || { overbite: 0, overjet: 0, crossbite: 'None', openbite: 'None', malocclusion: 'Class I' }),
            softTissueRecords: updatedPatient.soft_tissue_records || [],
            orthodonticRecords: mapOrthodonticRecords(updatedPatient.orthodontic_records),
            endodonticRecords: mapEndodonticRecords(updatedPatient.endodontic_records || updatedPatient.endodonticRecords),
        };
    } catch (error) {
        console.error("Error adding image to patient:", error);
        return undefined;
    }
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
    console.log('API CALL: saveDentalRecord', { patientId, record });

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
            toothId: savedRecord.tooth_id || savedRecord.toothId,
            condition: savedRecord.condition,
            notes: savedRecord.notes || '',
            id: savedRecord.id,
            createdAt: savedRecord.created_at || savedRecord.createdAt,
            updatedAt: savedRecord.updated_at || savedRecord.updatedAt,
        };

        console.log('Saved dental record:', feRecord);
        return feRecord;

    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to save dental record:', error.response?.data);
            if (error.response?.status === 404) {
                throw new Error("Patient not found");
            }
            if (error.response?.status === 422) {
                throw new Error(error.response?.data?.message || "Validation failed");
            }
            throw new Error(error.response?.data?.message || "Failed to save dental record");
        } else {
            console.error("An unexpected error occurred during dental record save:", error);
            throw error;
        }
    }
};

// Get all dental records for a patient
export const getDentalRecords = async (patientId: string | number): Promise<DentalRecord[]> => {
    console.log('API CALL: getDentalRecords', { patientId });
    
    try {
        const response = await customAxios.get(`/patients/${patientId}/odontogram-records`);
        
        let recordsData = response.data;
        if (recordsData?.data && Array.isArray(recordsData.data)) {
            recordsData = recordsData.data;
        } else if (!Array.isArray(recordsData)) {
            return [];
        }

        return recordsData.map((record: any) => ({
            id: record.id,
            toothId: record.tooth_id || record.toothId,
            condition: record.condition,
            notes: record.notes || '',
            createdAt: record.created_at || record.createdAt,
            updatedAt: record.updated_at || record.updatedAt,
        }));

    } catch (error) {
        console.error('Error fetching dental records:', error);
        return [];
    }
};

// Update dental record
export const updateDentalRecord = async (
    patientId: string | number, 
    recordId: string | number, 
    record: Partial<DentalRecord>
): Promise<DentalRecord | undefined> => {
    console.log('API CALL: updateDentalRecord', { patientId, recordId, record });
    
    try {
        const requestBody: any = {};
        if (record.condition !== undefined) requestBody.condition = record.condition;
        if (record.notes !== undefined) requestBody.notes = record.notes;
        if (record.toothId !== undefined) requestBody.tooth_id = record.toothId;

        const response = await customAxios.put(`/patients/${patientId}/odontogram-records/${recordId}`, requestBody);
        
        const updatedRecord = response.data.data || response.data;
        
        return {
            id: updatedRecord.id || recordId,
            toothId: updatedRecord.tooth_id || updatedRecord.toothId || record.toothId,
            condition: updatedRecord.condition || record.condition,
            notes: updatedRecord.notes || record.notes || '',
            createdAt: updatedRecord.created_at || updatedRecord.createdAt,
            updatedAt: updatedRecord.updated_at || updatedRecord.updatedAt,
        };

    } catch (error) {
        console.error('Error updating dental record:', error);
        return undefined;
    }
};

// Delete dental record
export const deleteDentalRecord = async (patientId: string | number, recordId: string | number): Promise<{ success: boolean }> => {
    console.log('API CALL: deleteDentalRecord', { patientId, recordId });
    
    try {
        await customAxios.delete(`/patients/${patientId}/odontogram-records/${recordId}`);
        return { success: true };
    } catch (error) {
        console.error('Error deleting dental record:', error);
        return { success: false };
    }
};

export const savePeriodontalRecord = async (patientId: string | number, records: PeriodontalRecord): Promise<Patient | undefined> => {
    console.log('API CALL: savePeriodontalRecord', { patientId, recordsCount: records.length });
    
    try {
        const requestBody = {
            records: records.map(record => ({
                tooth_id: record.toothId,
                pockets: record.pockets,
                recession: record.recession ?? 0,
                mobility: record.mobility || '0',
                furcation: record.furcation || null,
                conditions: {
                    bleeding: record.conditions?.bleeding || false,
                    suppuration: record.conditions?.suppuration || false,
                    plaque: record.conditions?.plaque || false,
                    calculus: record.conditions?.calculus || false
                },
            }))
        };

        await customAxios.post(`/patients/${patientId}/periodontal-records`, requestBody);
        return getPatientById(patientId);
    } catch (error) {
        console.error('Error saving periodontal records:', error);
        return undefined;
    }
};

// Get periodontal records for a patient
export const getPeriodontalRecords = async (patientId: string | number): Promise<PeriodontalRecord[]> => {
    console.log('API CALL: getPeriodontalRecords', { patientId });
    
    try {
        const response = await customAxios.get(`/patients/${patientId}/periodontal-records`);
        
        let recordsData = response.data;
        if (recordsData?.data && Array.isArray(recordsData.data)) {
            recordsData = recordsData.data;
        } else if (!Array.isArray(recordsData)) {
            return [];
        }

        return recordsData.map((record: any) => ({
            id: record.id,
            toothId: record.tooth_id || record.toothId,
            pocketDepth: record.pocket_depth || record.pocketDepth,
            gingivalIndex: record.gingival_index || record.gingivalIndex,
            plaqueIndex: record.plaque_index || record.plaqueIndex,
            bleeding: record.bleeding || false,
            attachmentLoss: record.attachment_loss || record.attachmentLoss,
            mobility: record.mobility,
            furcationInvolvement: record.furcation_involvement || record.furcationInvolvement,
            notes: record.notes || '',
            createdAt: record.created_at || record.createdAt,
            updatedAt: record.updated_at || record.updatedAt,
        }));

    } catch (error) {
        console.error('Error fetching periodontal records:', error);
        return [];
    }
};

export const saveOcclusalRecord = async (patientId: string | number, record: OcclusalRecord): Promise<Patient | undefined> => {
    console.log('API CALL: saveOcclusalRecord', { patientId, record });
    
    try {
        const requestBody = {
            overbite: typeof record.overbite === 'string' ? parseInt(record.overbite) : record.overbite,
            overjet: typeof record.overjet === 'string' ? parseInt(record.overjet) : record.overjet,
            crossbite: record.crossbite,
            openbite: record.openbite,
            malocclusion: record.malocclusion,
        };

        await customAxios.post(`/patients/${patientId}/occlusal-records`, requestBody);
        return getPatientById(patientId);
    } catch (error) {
        console.error('Error saving occlusal record:', error);
        return undefined;
    }
};

// Get occlusal records for a patient
export const getOcclusalRecords = async (patientId: string | number): Promise<OcclusalRecord[]> => {
    console.log('API CALL: getOcclusalRecords', { patientId });
    
    try {
        const response = await customAxios.get(`/patients/${patientId}/occlusal-records`);
        
        let record = response.data.data || response.data;
        if (!record || typeof record !== 'object') {
            return [];
        }

        return [{
            overbite: record.overbite,
            overjet: record.overjet,
            crossbite: record.crossbite,
            openbite: record.openbite,
            malocclusion: record.malocclusion,
        }];

    } catch (error) {
        console.error('Error fetching occlusal records:', error);
        return [];
    }
};

export const saveSoftTissueRecord = async (patientId: string | number, record: Omit<SoftTissueRecord, 'id'>): Promise<Patient | undefined> => {
    console.log('API CALL: saveSoftTissueRecord', { patientId, record });
    
    try {
        const requestBody = {
            location: record.location,
            type: record.type,
            description: record.description,
        };

        await customAxios.post(`/patients/${patientId}/soft-tissue-records`, requestBody);
        return getPatientById(patientId);

    } catch (error) {
        console.error('Error saving soft tissue record:', error);
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 404) {
                throw new Error("Patient not found");
            }
            if (error.response?.status === 422) {
                throw new Error(error.response?.data?.message || "Validation failed");
            }
            throw new Error(error.response?.data?.message || "Failed to save soft tissue record");
        }
        throw error;
    }
};

// Get soft tissue records for a patient
export const getSoftTissueRecords = async (patientId: string | number): Promise<SoftTissueRecord[]> => {
    console.log('API CALL: getSoftTissueRecords', { patientId });
    
    try {
        const response = await customAxios.get(`/patients/${patientId}/soft-tissue-records`);
        
        let recordsData = response.data;
        if (recordsData?.data && Array.isArray(recordsData.data)) {
            recordsData = recordsData.data;
        } else if (!Array.isArray(recordsData)) {
            return [];
        }

        return recordsData.map((record: any) => ({
            id: record.id,
            location: record.location,
            type: record.type,
            description: record.description,
            date: record.date || record.created_at || new Date().toISOString().split('T')[0],
        }));

    } catch (error) {
        console.error('Error fetching soft tissue records:', error);
        return [];
    }
};

export const saveOrthodonticRecord = async (patientId: string | number, record: Omit<OrthodonticRecord, 'id'>): Promise<Patient | undefined> => {
    console.log('API CALL: saveOrthodonticRecord', { patientId, record });
    
    try {
        const requestBody = {
            appliance: record.appliance,
            appliance_location: record.applianceLocation,
            treatment_phase: record.treatmentPhase,
            wire_size: record.wireSize,
            wire_size_upper: record.wireSizeUpper,
            wire_size_lower: record.wireSizeLower,
            archwire_material: record.archwireMaterial,
            elastics: record.elastics,
            compliance: record.compliance,
            oral_hygiene: record.oralHygiene,
            bracket_changes: record.bracketChanges,
            broken_brackets: record.brokenBrackets,
            next_visit_goals: record.nextVisitGoals,
            notes: record.notes,
        };

        await customAxios.post(`/patients/${patientId}/orthodontic-records`, requestBody);
        return getPatientById(patientId);

    } catch (error) {
        console.error('Error saving orthodontic record:', error);
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 404) {
                throw new Error("Patient not found");
            }
            if (error.response?.status === 422) {
                throw new Error(error.response?.data?.message || "Validation failed");
            }
            throw new Error(error.response?.data?.message || "Failed to save orthodontic record");
        }
        throw error;
    }
};

// Get orthodontic records for a patient
export const getOrthodonticRecords = async (patientId: string | number): Promise<OrthodonticRecord[]> => {
    console.log('API CALL: getOrthodonticRecords', { patientId });
    
    try {
        const response = await customAxios.get(`/patients/${patientId}/orthodontic-records`);
        
        let recordsData = response.data;
        if (recordsData?.data && Array.isArray(recordsData.data)) {
            recordsData = recordsData.data;
        } else if (!Array.isArray(recordsData)) {
            return [];
        }

        return mapOrthodonticRecords(recordsData);

    } catch (error) {
        console.error('Error fetching orthodontic records:', error);
        return [];
    }
};

export const addTreatment = async (patientId: string | number, treatmentData: Omit<Treatment, 'id' | 'date'>, condition?: DentalCondition): Promise<Treatment> => {
    console.log('API CALL: addTreatment', { patientId, treatmentData, condition });

    const today = new Date().toISOString().split('T')[0];

    // Build request body matching backend validation:
    // procedure (required|string), tooth (nullable|integer), status (required|in:Proposed,Completed),
    // cost (required|numeric), date (required|date)
    const requestBody: Record<string, any> = {
        procedure_id: treatmentData.procedureId,
        procedure: treatmentData.procedure,
        tooth: treatmentData.tooth || null,
        status: treatmentData.status === 'In Progress' || treatmentData.status === 'Cancelled'
            ? 'Proposed'  // Backend only accepts 'Proposed' or 'Completed'
            : treatmentData.status,
        cost: treatmentData.cost,
        date: today,
        condition: condition || null,
        notes: treatmentData.procedure || null,
    };

    try {
        const response = await customAxios.post(`/patients/${patientId}/treatments`, requestBody);
        const responseData = response.data.data || response.data;

        // Extract the newly created treatment from the response.
        // The backend returns the patient with treatmentPlans loaded, ordered by id desc.
        // The first treatment plan entry should be the one we just created.
        const treatmentPlans = responseData.treatment_plans || responseData.treatmentPlans || [];
        const savedTreatment = treatmentPlans.length > 0 ? treatmentPlans[0] : null;

        const feTreatment: Treatment = {
            id: savedTreatment?.id || `t${Date.now()}`,
            procedureId: treatmentData.procedureId,
            procedure: savedTreatment?.procedure || treatmentData.procedure,
            tooth: savedTreatment?.tooth || treatmentData.tooth,
            status: savedTreatment?.status || treatmentData.status,
            cost: savedTreatment?.cost || treatmentData.cost,
            date: savedTreatment?.date || today,
            invoiceId: treatmentData.invoiceId,
        };

        // Update local cache
        const patientIndex = allPatients.findIndex(p => String(p.id) === String(patientId));
        if (patientIndex > -1) {
            const patient = allPatients[patientIndex];

            // Add treatment to treatment plans at the beginning (descending order)
            patient.treatmentPlans.unshift(feTreatment);

            // If a condition was provided, also update dental records locally
            if (condition && treatmentData.tooth) {
                const newRecord: DentalRecord = {
                    toothId: treatmentData.tooth,
                    condition: condition,
                    notes: treatmentData.procedure || ''
                };
                const recordIndex = patient.dentalRecords.findIndex(r => r.toothId === treatmentData.tooth);
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
    
    try {
        const requestBody = {
            procedure_id: treatment.procedureId,
            procedure: treatment.procedure,
            tooth: treatment.tooth || null,
            status: treatment.status,
            cost: treatment.cost,
            date: treatment.date,
        };

        await customAxios.put(`/patients/${patientId}/treatments/${treatment.id}`, requestBody);
        
        // Fetch fresh patient data to get all updated relations
        return getPatientById(patientId);
    } catch (error) {
        console.error('Error updating treatment:', error);
        return undefined;
    }
}

export const updateTreatmentStatus = async (patientId: string | number, treatmentId: string | number, status: string): Promise<Patient | undefined> => {
    console.log('API CALL: updateTreatmentStatus', { patientId, treatmentId, status });
    
    try {
        const requestBody = {
            status: status === 'In Progress' || status === 'Cancelled' ? 'Proposed' : status,
        };

        await customAxios.patch(`/patients/${patientId}/treatments/${treatmentId}/status`, requestBody);
        
        // Fetch fresh patient data to get all updated relations
        return getPatientById(patientId);
    } catch (error) {
        console.error('Error updating treatment status:', error);
        return undefined;
    }
}

export const deleteTreatment = async (patientId: string | number, treatmentId: string | number): Promise<Patient | undefined> => {
    console.log('API CALL: deleteTreatment', { patientId, treatmentId });
    
    try {
        await customAxios.delete(`/patients/${patientId}/treatments/${treatmentId}`);
        
        // Fetch fresh patient data
        return getPatientById(patientId);
    } catch (error) {
        console.error('Error deleting treatment:', error);
        return undefined;
    }
}

export const updateOrthodonticRecord = async (patientId: string | number, record: OrthodonticRecord): Promise<Patient | undefined> => {
    console.log('API CALL: updateOrthodonticRecord', { patientId, record });
    try {
        await customAxios.put(`/patients/${patientId}/orthodontic-records/${record.id}`, {
            appliance: record.appliance,
            appliance_location: record.applianceLocation,
            treatment_phase: record.treatmentPhase,
            wire_size: record.wireSize,
            wire_size_upper: record.wireSizeUpper,
            wire_size_lower: record.wireSizeLower,
            archwire_material: record.archwireMaterial,
            elastics: record.elastics,
            compliance: record.compliance,
            oral_hygiene: record.oralHygiene,
            bracket_changes: record.bracketChanges,
            broken_brackets: record.brokenBrackets,
            next_visit_goals: record.nextVisitGoals,
            notes: record.notes,
        });
        return getPatientById(patientId);
    } catch (error) {
        console.error('Error updating orthodontic record:', error);
        return undefined;
    }
}

export const deleteOrthodonticRecord = async (patientId: string | number, recordId: string | number): Promise<Patient | undefined> => {
    console.log('API CALL: deleteOrthodonticRecord', { patientId, recordId });
    try {
        await customAxios.delete(`/patients/${patientId}/orthodontic-records/${recordId}`);
        return getPatientById(patientId);
    } catch (error) {
        console.error('Error deleting orthodontic record:', error);
        return undefined;
    }
}

export const updateSoftTissueRecord = async (patientId: string | number, record: SoftTissueRecord): Promise<Patient | undefined> => {
    console.log('API CALL: updateSoftTissueRecord', { patientId, record });
    try {
        await customAxios.put(`/patients/${patientId}/soft-tissue-records/${record.id}`, {
            location: record.location,
            type: record.type,
            description: record.description,
        });
        return getPatientById(patientId);
    } catch (error) {
        console.error('Error updating soft tissue record:', error);
        return undefined;
    }
}

export const deleteSoftTissueRecord = async (patientId: string | number, recordId: string | number): Promise<Patient | undefined> => {
    console.log('API CALL: deleteSoftTissueRecord', { patientId, recordId });
    try {
        await customAxios.delete(`/patients/${patientId}/soft-tissue-records/${recordId}`);
        return getPatientById(patientId);
    } catch (error) {
        console.error('Error deleting soft tissue record:', error);
        return undefined;
    }
}

export const getEndodonticRecords = async (patientId: string | number): Promise<EndodonticRecord[]> => {
    try {
        const response = await customAxios.get(`/patients/${patientId}/endodontic-records`);
        return mapEndodonticRecords(response.data.data || response.data);
    } catch (error) {
        console.error('Error fetching endodontic records:', error);
        return [];
    }
};

export const saveEndodonticRecord = async (
    patientId: string | number, 
    record: Omit<EndodonticRecord, 'id' | 'date'>
): Promise<Patient | undefined> => {
    try {
        const requestBody = {
            tooth_id: record.toothId,
            pulpal_diagnosis: record.pulpalDiagnosis,
            periapical_diagnosis: record.periapicalDiagnosis,
            canals: record.canals,
            obturation_material: record.obturationMaterial,
            post_type: record.postType,
            notes: record.notes,
        };
        await customAxios.post(`/patients/${patientId}/endodontic-records`, requestBody);
        return getPatientById(patientId);
    } catch (error) {
        console.error('Error saving endodontic record:', error);
        return undefined;
    }
};

export const updateEndodonticRecord = async (
    patientId: string | number, 
    record: EndodonticRecord
): Promise<Patient | undefined> => {
    try {
        const requestBody = {
            tooth_id: record.toothId,
            pulpal_diagnosis: record.pulpalDiagnosis,
            periapical_diagnosis: record.periapicalDiagnosis,
            canals: record.canals,
            obturation_material: record.obturationMaterial,
            post_type: record.postType,
            notes: record.notes,
        };
        await customAxios.put(`/patients/${patientId}/endodontic-records/${record.id}`, requestBody);
        return getPatientById(patientId);
    } catch (error) {
        console.error('Error updating endodontic record:', error);
        return undefined;
    }
};

export const deleteEndodonticRecord = async (
    patientId: string | number, 
    recordId: string | number
): Promise<Patient | undefined> => {
    try {
        await customAxios.delete(`/patients/${patientId}/endodontic-records/${recordId}`);
        return getPatientById(patientId);
    } catch (error) {
        console.error('Error deleting endodontic record:', error);
        return undefined;
    }
};

export const saveRestorativeRecord = async (
    patientId: string | number, 
    record: Omit<RestorativeRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Patient | undefined> => {
    try {
        const requestBody = {
            tooth_id: record.toothId,
            surface: record.surface,
            material: record.material,
            notes: record.notes,
        };
        await customAxios.post(`/patients/${patientId}/restorative-records`, requestBody);
        return getPatientById(patientId);
    } catch (error) {
        console.error('Error saving restorative record:', error);
        return undefined;
    }
};

export const updateRestorativeRecord = async (
    patientId: string | number, 
    record: RestorativeRecord
): Promise<Patient | undefined> => {
    try {
        const requestBody = {
            tooth_id: record.toothId,
            surface: record.surface,
            material: record.material,
            notes: record.notes,
        };
        await customAxios.put(`/patients/${patientId}/restorative-records/${record.id}`, requestBody);
        return getPatientById(patientId);
    } catch (error) {
        console.error('Error updating restorative record:', error);
        return undefined;
    }
};

export const deleteRestorativeRecord = async (
    patientId: string | number, 
    recordId: string | number
): Promise<Patient | undefined> => {
    try {
        await customAxios.delete(`/patients/${patientId}/restorative-records/${recordId}`);
        return getPatientById(patientId);
    } catch (error) {
        console.error('Error deleting restorative record:', error);
        return undefined;
    }
};



export const updateAppointment = async (id: string | number, data: Partial<Appointment>): Promise<Appointment | undefined> => {
    console.log('API CALL: updateAppointment', { id, data });

    // Build payload converting frontend fields to backend snake_case where applicable
    const payload: any = {};
    if (data.patientName !== undefined) payload.patient_name = data.patientName;
    if (data.patientId !== undefined) payload.patient_id = data.patientId;
    if (data.doctorName !== undefined) payload.doctor_name = data.doctorName;
    if (data.doctorId !== undefined) payload.doctor_id = data.doctorId;
    if (data.treatment !== undefined) payload.treatment = data.treatment;
    if (data.status !== undefined) payload.status = data.status;
    if (data.date !== undefined) payload.date = data.date;
    if (data.time !== undefined) payload.time = data.time;
    if (data.branchId !== undefined) payload.branch_id = data.branchId;
    if (data.tokenNumber !== undefined) payload.token_number = data.tokenNumber;

    try {
        const response = await customAxios.patch(`/appointments/${id}`, payload);
        let appointmentData: any = response.data;
        if (appointmentData?.data) appointmentData = appointmentData.data;
        if (!appointmentData) return undefined;

        // Normalize response to frontend Appointment type (match getAppointments mapping)
        const mapped: Appointment = {
            id: appointmentData.id,
            patientName: appointmentData.patient_name ?? appointmentData.patientName ?? (appointmentData.patient && (appointmentData.patient.first_name + ' ' + (appointmentData.patient.last_name || ''))) ?? '',
            patientId: appointmentData.patient_id ?? appointmentData.patientId ?? (appointmentData.patient && appointmentData.patient.id) ?? '',
            doctorName: appointmentData.doctor_name ?? appointmentData.doctorName ?? (appointmentData.doctor && appointmentData.doctor.name) ?? '',
            doctorId: appointmentData.doctor_id ?? appointmentData.doctorId ?? (appointmentData.doctor && appointmentData.doctor.id) ?? '',
            treatment: appointmentData.treatment ?? appointmentData.procedure ?? '',
            status: appointmentData.status ?? 'Scheduled',
            date: (() => {
                const raw = appointmentData.date ?? appointmentData.appointment_date ?? '';
                if (typeof raw === 'string' && raw.includes('T')) return raw.split('T')[0];
                return raw;
            })(),
            time: appointmentData.time ?? appointmentData.appointment_time ?? '',
            branchId: appointmentData.branch_id ?? appointmentData.branchId ?? (appointmentData.branch && appointmentData.branch.id) ?? '',
            tokenNumber: appointmentData.token_number ?? appointmentData.tokenNumber ?? '',
        };

        // Update local mock cache if present
        const index = allAppointments.findIndex(a => a.id === id);
        if (index > -1) allAppointments[index] = mapped;

        return mapped;
    } catch (error) {
        console.error('Error updating appointment via API, falling back to local mock:', error);
        // Fallback to mock behavior for offline/dev mode
        await delay(200);
        const appointmentIndex = allAppointments.findIndex(a => a.id === id);
        if (appointmentIndex > -1) {
            allAppointments[appointmentIndex] = { ...allAppointments[appointmentIndex], ...data } as any;
            return allAppointments[appointmentIndex];
        }
        return undefined;
    }
}

export const deleteAppointment = async (id: string | number): Promise<{ success: boolean }> => {
    console.log('API CALL: deleteAppointment', { id });
    try {
        await customAxios.delete(`/appointments/${id}`);
        // Also remove from local mock cache if present
        const initialLength = allAppointments.length;
        const newAppointments = allAppointments.filter(a => a.id !== id);
        allAppointments.length = 0;
        Array.prototype.push.apply(allAppointments, newAppointments);
        return { success: allAppointments.length < initialLength };
    } catch (error) {
        console.error('Error deleting appointment via API, falling back to local mock:', error);
        // Fallback to mock
        await delay(200);
        const initialLength = allAppointments.length;
        const newAppointments = allAppointments.filter(a => a.id !== id);
        allAppointments.length = 0;
        Array.prototype.push.apply(allAppointments, newAppointments);
        return { success: allAppointments.length < initialLength };
    }
}

// Invoices
export const createNewInvoice = async (data: Omit<Invoice, 'id' | 'amount' | 'paidAmount'> & { branchId: string | number; treatments: InvoiceTreatment[]; notes?: string }): Promise<Invoice> => {
    console.log('API CALL: createInvoice', { data });
    
    try {
        // ✅ Calculate totals
        const treatmentsTotal = data.treatments.reduce((sum, t) => sum + (Number(t.cost) || 0), 0);
        const otherChargesTotal = (data.otherCharges || []).reduce((sum, charge) => sum + (Number(charge.amount) || 0), 0);
        const subtotal = treatmentsTotal + otherChargesTotal;
        const discountAmount = data.discount ? (data.discount <= 100 ? (subtotal * data.discount / 100) : data.discount) : 0;
        const subtotalAfterDiscount = subtotal - discountAmount;
        const taxAmount = data.tax ? (subtotalAfterDiscount * data.tax / 100) : 0;
        const amount = subtotalAfterDiscount + taxAmount;

        // ✅ Prepare payload for API
        const payload = {
            patient_id: data.patientId,
            patient_name: data.patientName,
            amount: amount,
            discount: data.discount || 0,
            tax: data.tax || 0,
            insurance_coverage: data.insuranceCoverage || 0,
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
            discount: Number(invoiceData.discount || data.discount || 0),
            tax: Number(invoiceData.tax || data.tax || 0),
            insuranceCoverage: Number(invoiceData.insurance_coverage || data.insuranceCoverage || 0),
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
        const subtotal = treatmentsTotal + otherChargesTotal;
        const discountAmount = data.discount ? (data.discount <= 100 ? (subtotal * data.discount / 100) : data.discount) : 0;
        const subtotalAfterDiscount = subtotal - discountAmount;
        const taxAmount = data.tax ? (subtotalAfterDiscount * data.tax / 100) : 0;
        const amount = subtotalAfterDiscount + taxAmount;

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
        if (data.discount !== undefined) payload.discount = data.discount;
        if (data.tax !== undefined) payload.tax = data.tax;
        if (data.insuranceCoverage !== undefined) payload.insurance_coverage = data.insuranceCoverage;
        
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
            discount: Number(invoiceData.discount || data.discount || 0),
            tax: Number(invoiceData.tax || data.tax || 0),
            insuranceCoverage: Number(invoiceData.insurance_coverage || data.insuranceCoverage || 0),
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
    branchesCache = null; // Invalidate cache
    console.log('API CALL: createBranch', { data });
    try {
        const response = await customAxios.post('/branches', data);
        return response.data;
    } catch (error) {
        console.error('Error creating branch:', error);
        throw error;
    }
}

export const updateBranch = async (id: string | number, data: Omit<Branch, 'id'>): Promise<Branch> => {
    branchesCache = null; // Invalidate cache
    console.log('API CALL: updateBranch', { id, data });
    try {
        const response = await customAxios.put(`/branches/${id}`, data);
        return response.data;
    } catch (error) {
        console.error('Error updating branch:', error);
        throw error;
    }
}

export const deleteBranch = async (id: string | number): Promise<{ success: boolean }> => {
    branchesCache = null; // Invalidate cache
    console.log('API CALL: deleteBranch', { id });
    try {
        const response = await customAxios.delete(`/branches/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting branch:', error);
        throw error;
    }
}

// Inventory
export const createInventoryItem = async (data: Omit<InventoryItem, 'id' | 'status'>): Promise<InventoryItem> => {
    console.log('API CALL: createInventoryItem', { data });
    try {
        const response = await customAxios.post('/management/inventory', {
            name: data.name,
            supplier: data.supplier,
            stock: data.stock,
            reorderLevel: data.reorderLevel,
            price: data.price,
            branchId: data.branchId,
        });
        const item = response.data;
        return {
            id: item.id,
            name: item.name,
            supplier: item.supplier,
            stock: item.stock,
            reorderLevel: item.reorder_level || item.reorderLevel,
            price: parseFloat(item.price),
            status: item.status,
            branchId: String(item.branch_id),
        };
    } catch (error) {
        console.error('Error creating inventory item:', error);
        throw error;
    }
}

// Lab Orders
export const createLabOrder = async (data: Omit<LaboratoryOrder, 'id'>): Promise<LaboratoryOrder> => {
    console.log('API CALL: createLabOrder', { data });
    try {
        const response = await customAxios.post('/management/lab-orders', {
            patientId: data.patientId,
            lab: data.lab,
            item: data.item,
            tooth: data.tooth,
            status: data.status,
            sentDate: data.sentDate,
            dueDate: data.dueDate,
            branchId: data.branchId,
        });
        const order = response.data;
        return {
            id: order.id,
            patientId: String(order.patient_id),
            patientName: order.patient_name || '',
            lab: order.lab,
            item: order.item,
            tooth: order.tooth,
            status: order.status,
            sentDate: order.sent_date ? order.sent_date.split('T')[0] : '',
            dueDate: order.due_date ? order.due_date.split('T')[0] : '',
            branchId: String(order.branch_id),
        };
    } catch (error) {
        console.error('Error creating lab order:', error);
        throw error;
    }
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
            approvalStatus: newPayrollData.approval_status,
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

export const approvePayroll = async (id: string | number, approvalStatus: 'Pending' | 'Approved' | 'Rejected'): Promise<Payroll | null> => {
    console.log('API CALL: approvePayroll', { id, approvalStatus });
    try {
        const response = await customAxios.patch(`/management/payrolls/${id}/approve`, {
            approval_status: approvalStatus,
        });
        const p = response.data;
        return {
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
            approvalStatus: p.approval_status,
        };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Failed to approve payroll:', error.response?.data);
            throw new Error(error.response?.data?.message || "Failed to approve payroll");
        } else {
            console.error("An unexpected error occurred during payroll approval:", error);
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

export const saveAttendanceSheet = async (
  payload: {
    employee_id: number | string;
    date: string;
    status: string;
    check_in?: string;
    check_out?: string;
    branch_id: number | string;
  }[]
): Promise<any[]> => {
  console.log('API CALL: saveAttendanceSheet', payload);
  try {
    const response = await customAxios.post('/management/attendance', payload);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
        console.error('Failed to save attendance sheet:', error.response?.data);
        throw new Error(error.response?.data?.message || "Failed to save attendance sheet");
    } else {
        console.error("An unexpected error occurred during saving attendance sheet:", error);
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
    try {
        const response = await customAxios.patch(`/management/leave-requests/${id}`, { status });
        const request = response.data;
        return {
            id: request.id,
            employeeId: request.employee_id,
            employeeName: request.employee_name || (request.employee ? request.employee.name : ''),
            leaveType: request.leave_type || request.leaveType,
            startDate: request.start_date ? request.start_date.split('T')[0] : '',
            endDate: request.end_date ? request.end_date.split('T')[0] : '',
            reason: request.reason,
            status: request.status,
            branchId: String(request.branch_id),
        };
    } catch (error) {
        console.error('Error updating leave request status:', error);
        return undefined;
    }
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
    try {
        const response = await customAxios.post('/management/expenses', {
            branchId: data.branchId,
            date: data.date,
            category: data.category,
            description: data.description,
            amount: data.amount,
        });
        const expense = response.data;
        return {
            id: expense.id,
            branchId: String(expense.branch_id),
            date: expense.date ? expense.date.split('T')[0] : '',
            category: expense.category,
            description: expense.description,
            amount: parseFloat(expense.amount),
        };
    } catch (error) {
        console.error('Error creating expense:', error);
        throw error;
    }
}


// Roles
export const updateRole = async (roleId: string | number, permissions: Permission[]): Promise<RolePermissions | undefined> => {
    rolesCache = null; // Invalidate cache
    rolesListCache = null;
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
    rolesCache = null; // Invalidate cache
    rolesListCache = null;
    console.log('API CALL: createRole', { name });
    try {
        const response = await customAxios.post('/settings/roles', { name });
        return {
            id: String(response.data.id),
            name: response.data.name,
        };
    } catch (error) {
        console.error('Error creating role:', error);
        throw error;
    }
}

export const updateRoleName = async (id: string | number, name: string): Promise<{id: string | number, name: string}> => {
    rolesCache = null; // Invalidate cache
    rolesListCache = null;
    console.log('API CALL: updateRoleName', { id, name });
    try {
        const response = await customAxios.patch(`/settings/roles/${id}`, { name });
        return {
            id: String(response.data.id),
            name: response.data.name,
        };
    } catch (error) {
        console.error('Error updating role name:', error);
        throw error;
    }
}

export const deleteRole = async (id: string | number): Promise<boolean> => {
    rolesCache = null; // Invalidate cache
    rolesListCache = null;
    console.log('API CALL: deleteRole', { id });
    try {
        const response = await customAxios.delete(`/settings/roles/${id}`);
        return !!response.data.success;
    } catch (error) {
        console.error('Error deleting role:', error);
        return false;
    }
}

// Queue
export const announcePatientInQueue = async (appointmentId: string | number): Promise<{audio_url?: string}> => {
    console.log('API CALL: announcePatientInQueue', { appointmentId });
    const appointment = allAppointments.find(a => String(a.id) === String(appointmentId));
    if (!appointment) {
        throw new Error("Appointment not found");
    }

    const token = appointment.tokenNumber || '';
    const announcementText = `Token number ${token.split('').join(' ')}, please proceed to the doctor's room.`;
    const audio = await speak(announcementText);

    return { audio_url: audio.media };
}

// Imports & Templates
export type ParsedHeadersResponse = {
    file_path: string;
    headers: string[];
    available_columns: string[];
};

export type TemplateInfo = {
    name: string;
    type: 'patients' | 'employees' | 'treatments';
    format: 'csv' | 'xlsx';
    download_url: string;
};

export type ImportStartResponse = {
    status: 'success' | 'failed';
    processed_rows: number;
    duration_seconds: number;
    method_used: string;
    message: string;
};

export const parseImportFile = async (file: File, type: 'patients' | 'employees' | 'treatments'): Promise<ParsedHeadersResponse> => {
    console.log('API CALL: parseImportFile', { type, filename: file.name });
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        const response = await customAxios.post('/import/parse', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error parsing CSV headers:', error);
        throw error;
    }
};

export const startImport = async (
    filePath: string,
    type: 'patients' | 'employees' | 'treatments',
    mapping: Record<string, string>
): Promise<ImportStartResponse> => {
    console.log('API CALL: startImport', { filePath, type, mapping });
    try {
        const response = await customAxios.post('/import/start', {
            file_path: filePath,
            type,
            mapping,
        });
        return response.data;
    } catch (error) {
        console.error('Error starting import:', error);
        throw error;
    }
};

export const listTemplates = async (): Promise<TemplateInfo[]> => {
    console.log('API CALL: listTemplates');
    try {
        const response = await customAxios.get('/import/templates');
        return response.data;
    } catch (error) {
        console.error('Error listing templates:', error);
        return [];
    }
};

export const downloadTemplate = async (filename: string): Promise<void> => {
    console.log('API CALL: downloadTemplate', { filename });
    try {
        const response = await customAxios.get(`/import/templates/download/${filename}`, {
            responseType: 'blob',
        });
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading template:', error);
        throw error;
    }
};

// --- PHARMACY MODULE ---

export const getMedicines = async (
    branchId?: string | number,
    search?: string,
    page?: number,
    perPage?: number
): Promise<PaginatedArray<Medicine>> => {
    console.log('API CALL: getMedicines', { branchId, search, page, perPage });
    try {
        const params: any = {};
        if (branchId) params.branch_id = branchId;
        if (search) params.search = search;
        if (page) params.page = page;
        if (perPage) params.per_page = perPage;

        const response = await customAxios.get('/pharmacy/medicines', { params });
        const rawItems = Array.isArray(response.data) ? response.data : (response.data.data || []);
        
        const items: PaginatedArray<Medicine> = rawItems.map((med: any) => ({
            ...med,
            units: Array.isArray(med.units) ? med.units.map((unit: any) => ({
                ...unit,
                price: parseFloat(unit.price),
                stock_quantity: parseInt(unit.stock_quantity, 10),
            })) : [],
        }));

        if (response.data && response.data.meta) {
            items.meta = response.data.meta;
        }
        return items;
    } catch (error) {
        console.error('Error fetching medicines:', error);
        const emptyArray: PaginatedArray<Medicine> = [];
        return emptyArray;
    }
};

export const storeMedicine = async (medicineData: {
    name: string;
    description?: string;
    category?: string;
    branch_id: number;
    units: { unit_name: string; price: number; stock_quantity: number }[];
}): Promise<Medicine> => {
    console.log('API CALL: storeMedicine', medicineData);
    const response = await customAxios.post('/pharmacy/medicines', medicineData);
    return response.data;
};

export const updateMedicine = async (
    id: string | number,
    medicineData: {
        name?: string;
        description?: string;
        category?: string;
        branch_id?: number;
        units?: { id?: number; unit_name: string; price: number; stock_quantity: number }[];
    }
): Promise<Medicine> => {
    console.log('API CALL: updateMedicine', { id, medicineData });
    const response = await customAxios.put(`/pharmacy/medicines/${id}`, medicineData);
    return response.data;
};

export const deleteMedicine = async (id: string | number): Promise<{ success: boolean }> => {
    console.log('API CALL: deleteMedicine', { id });
    const response = await customAxios.delete(`/pharmacy/medicines/${id}`);
    return response.data;
};

export const getPrescriptions = async (
    branchId?: string | number,
    patientId?: string | number,
    page?: number,
    perPage?: number
): Promise<PaginatedArray<Prescription>> => {
    console.log('API CALL: getPrescriptions', { branchId, patientId, page, perPage });
    try {
        const params: any = {};
        if (branchId) params.branch_id = branchId;
        if (patientId) params.patient_id = patientId;
        if (page) params.page = page;
        if (perPage) params.per_page = perPage;

        const response = await customAxios.get('/pharmacy/prescriptions', { params });
        const rawItems = Array.isArray(response.data) ? response.data : (response.data.data || []);
        
        const items: PaginatedArray<Prescription> = rawItems.map((rx: any) => ({
            ...rx,
            items: Array.isArray(rx.items) ? rx.items.map((item: any) => ({
                ...item,
                price: parseFloat(item.price),
                quantity: parseInt(item.quantity, 10),
            })) : [],
        }));

        if (response.data && response.data.meta) {
            items.meta = response.data.meta;
        }
        return items;
    } catch (error) {
        console.error('Error fetching prescriptions:', error);
        const emptyArray: PaginatedArray<Prescription> = [];
        return emptyArray;
    }
};

export const storePrescription = async (prescriptionData: {
    patient_id: number;
    doctor_id?: number;
    prescription_date: string;
    notes?: string;
    branch_id: number;
    bill_to_invoice?: boolean;
    items: {
        medicine_id: number;
        medicine_unit_id: number;
        dosage: string;
        quantity: number;
        price: number;
    }[];
}): Promise<Prescription> => {
    console.log('API CALL: storePrescription', prescriptionData);
    const response = await customAxios.post('/pharmacy/prescriptions', prescriptionData);
    return response.data;
};

export const updatePrescriptionStatus = async (
    id: string | number,
    status: 'Pending' | 'Dispensed' | 'Billed'
): Promise<Prescription> => {
    console.log('API CALL: updatePrescriptionStatus', { id, status });
    const response = await customAxios.patch(`/pharmacy/prescriptions/${id}/status`, { status });
    return response.data;
};

export const updatePrescription = async (
    id: string | number,
    prescriptionData: Partial<Prescription> & {
        items?: Array<{
            medicine_id: string | number;
            medicine_unit_id: string | number;
            dosage: string;
            quantity: number;
            price: number;
        }>
    }
): Promise<Prescription> => {
    console.log('API CALL: updatePrescription', { id, prescriptionData });
    const response = await customAxios.put(`/pharmacy/prescriptions/${id}`, prescriptionData);
    return response.data;
};

export const deletePrescription = async (id: string | number): Promise<boolean> => {
    console.log('API CALL: deletePrescription', { id });
    try {
        await customAxios.delete(`/pharmacy/prescriptions/${id}`);
        return true;
    } catch (error) {
        console.error('Error deleting prescription:', error);
        return false;
    }
};

export const getPatientPrescriptions = async (patientId: string | number): Promise<Prescription[]> => {
    console.log('API CALL: getPatientPrescriptions', { patientId });
    try {
        const response = await customAxios.get(`/patients/${patientId}/prescriptions`);
        return response.data;
    } catch (error) {
        console.error('Error fetching patient prescriptions:', error);
        return [];
    }
};

export const getDoctorsList = async (): Promise<Employee[]> => {
    console.log('API CALL: getDoctorsList');
    try {
        const response = await customAxios.get('/doctors');
        return Array.isArray(response.data) ? response.data : (response.data.data || []);
    } catch (error) {
        console.error('Error fetching doctors:', error);
        return [];
    }
};

export const getPatientsList = async (): Promise<any[]> => {
    console.log('API CALL: getPatientsList');
    try {
        const response = await customAxios.get('/patients-list');
        return Array.isArray(response.data) ? response.data : (response.data.data || []);
    } catch (error) {
        console.error('Error fetching patients list:', error);
        return [];
    }
};
