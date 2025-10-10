

import { 
    patients as initialPatients, 
    appointments as initialAppointments,
    invoices as initialInvoices,
    chartData as allChartData,
    employees as initialEmployees,
    payrolls as initialPayrolls,
    branches as initialBranches,
    inventory as initialInventory,
    labOrders as initialLabOrders,
    treatments as allTreatments,
    attendance as initialAttendance
} from '@/lib/data';
import type { Patient, Appointment, Invoice, ChartData, Employee, Payroll, Branch, InventoryItem, LaboratoryOrder, BasePatient, InvoiceTreatment, OtherCharge, SystemTreatment, PaymentMethod, PaymentTransaction, AttendanceRecord } from '@/lib/types';

// This is a mock API layer. In a real app, you would replace this with actual API calls to your backend.
// We're using let instead of const so we can mutate the data in memory.
let patients: Patient[] = [...initialPatients];
let appointments: Appointment[] = [...initialAppointments];
let invoices: Invoice[] = [...initialInvoices];
let employees: Employee[] = [...initialEmployees];
let payrolls: Payroll[] = [...initialPayrolls];
let branches: Branch[] = [...initialBranches];
let inventory: InventoryItem[] = [...initialInventory];
let labOrders: LaboratoryOrder[] = [...initialLabOrders];
let chartData: ChartData[] = [...allChartData];
let treatments: SystemTreatment[] = [...allTreatments];
let attendance: AttendanceRecord[] = [...initialAttendance];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


// --- READ OPERATIONS ---

export const getBranches = async (): Promise<Branch[]> => {
    await delay(50);
    return JSON.parse(JSON.stringify(branches));
}

export const getPatients = async (): Promise<Patient[]> => {
    await delay(100);
    return JSON.parse(JSON.stringify(patients));
}

export const getPatientById = async (id: string): Promise<Patient | undefined> => {
    await delay(100);
    return JSON.parse(JSON.stringify(patients.find(p => p.id === id)));
}

export const getAppointments = async (): Promise<Appointment[]> => {
    await delay(150);
    return JSON.parse(JSON.stringify(appointments));
}

export const getInvoices = async (): Promise<Invoice[]> => {
    await delay(200);
    return JSON.parse(JSON.stringify(invoices));
}

export const getInvoiceById = async (id: string): Promise<Invoice | undefined> => {
    await delay(100);
    return JSON.parse(JSON.stringify(invoices.find(i => i.id === id)));
}

export const getEmployees = async (): Promise<Employee[]> => {
    await delay(100);
    return JSON.parse(JSON.stringify(employees));
}

export const getEmployeeById = async (id: string): Promise<Employee | undefined> => {
    await delay(100);
    return JSON.parse(JSON.stringify(employees.find(e => e.id === id)));
}

export const getPayrolls = async (): Promise<Payroll[]> => {
    await delay(250);
    return JSON.parse(JSON.stringify(payrolls));
}

export const getInventory = async (): Promise<InventoryItem[]> => {
    await delay(100);
    return JSON.parse(JSON.stringify(inventory));
}

export const getLabOrders = async (): Promise<LaboratoryOrder[]> => {
    await delay(150);
    return JSON.parse(JSON.stringify(labOrders));
}

export const getChartData = async (): Promise<ChartData[]> => {
    await delay(300);
    return JSON.parse(JSON.stringify(chartData));
}

export const getTreatments = async (): Promise<SystemTreatment[]> => {
    await delay(50);
    return JSON.parse(JSON.stringify(treatments));
}

export const getAttendance = async (): Promise<AttendanceRecord[]> => {
    await delay(150);
    return JSON.parse(JSON.stringify(attendance));
}


// --- WRITE OPERATIONS ---

// Patients
export const createPatient = async (data: BasePatient & { branchId: string }): Promise<Patient> => {
    await delay(200);
    const newPatient: Patient = {
        ...data,
        id: `p${patients.length + 1}`,
        dentalRecords: [],
        treatmentPlans: [],
        imaging: [],
        lastVisit: new Date().toISOString().split('T')[0],
        periodontalRecords: [],
        occlusalRecords: { overbite: 0, overjet: 0, crossbite: 'None', openbite: 'None', malocclusion: 'Class I' },
        softTissueRecords: [],
        orthodonticRecords: [],
    };
    patients = [...patients, newPatient];
    return newPatient;
}

export const updatePatient = async (id: string, data: Partial<Patient>): Promise<Patient | undefined> => {
    await delay(200);
    let updatedPatient: Patient | undefined;
    patients = patients.map(p => {
        if (p.id === id) {
            updatedPatient = { ...p, ...data };
            return updatedPatient;
        }
        return p;
    });
    return updatedPatient;
}

export const deletePatient = async (id: string): Promise<{ success: boolean }> => {
    await delay(200);
    patients = patients.filter(p => p.id !== id);
    return { success: true };
}


// Appointments
export const createAppointment = async (data: Omit<Appointment, 'id'>): Promise<Appointment> => {
    await delay(200);
    const newAppointment: Appointment = {
        ...data,
        id: `a${appointments.length + 1}`,
    };
    appointments = [...appointments, newAppointment];
    return newAppointment;
}

export const updateAppointment = async (id: string, data: Partial<Appointment>): Promise<Appointment | undefined> => {
    await delay(200);
    let updatedAppointment: Appointment | undefined;
    appointments = appointments.map(a => {
        if (a.id === id) {
            updatedAppointment = { ...a, ...data };
            return updatedAppointment;
        }
        return a;
    });
    return updatedAppointment;
}

export const deleteAppointment = async (id: string): Promise<{ success: boolean }> => {
    await delay(200);
    appointments = appointments.filter(a => a.id !== id);
    return { success: true };
}

// Invoices
export const createInvoice = async (data: Omit<Invoice, 'id' | 'amount' | 'paidAmount' | 'treatmentIds'> & { patientName: string, branchId: string }): Promise<Invoice> => {
    await delay(200);
    const patient = patients.find(p => p.id === data.patientId);
    if (!patient) throw new Error("Patient not found");

    const treatmentsTotal = data.treatments.reduce((sum, t) => sum + t.cost, 0);
    const otherChargesTotal = (data.otherCharges || []).reduce((sum, charge) => sum + charge.amount, 0);
    const amount = treatmentsTotal + otherChargesTotal;

    const newInvoice: Invoice = {
        ...data,
        id: `inv${invoices.length + 1}`,
        treatmentIds: [], // Deprecated, but kept for data structure
        amount,
        paidAmount: 0,
        transactions: [],
    };
    invoices = [newInvoice, ...invoices];

    return newInvoice;
}

export const updateInvoice = async (id: string, data: Partial<Omit<Invoice, 'amount' | 'id'>>): Promise<Invoice | undefined> => {
    await delay(200);
    let updatedInvoice: Invoice | undefined;

    invoices = invoices.map(i => {
        if (i.id === id) {
            const treatments = data.treatments || i.treatments;
            const treatmentsTotal = treatments.reduce((sum, t) => sum + t.cost, 0);
            
            const otherCharges = data.otherCharges ?? i.otherCharges ?? [];
            const otherChargesTotal = otherCharges.reduce((sum, charge) => sum + charge.amount, 0);
            const amount = treatmentsTotal + otherChargesTotal;

            updatedInvoice = { ...i, ...data, amount, treatments, otherCharges };
            return updatedInvoice;
        }
        return i;
    });
    return updatedInvoice;
}

export const processPayment = async (invoiceId: string, paymentAmount: number, method: string): Promise<Invoice | undefined> => {
    await delay(300);
    let updatedInvoice: Invoice | undefined;
    invoices = invoices.map(i => {
        if (i.id === invoiceId) {
            const newPaidAmount = i.paidAmount + paymentAmount;
            const newStatus = newPaidAmount >= i.amount ? 'Paid' : 'Pending';
            
            const newTransaction: PaymentTransaction = {
                id: `txn_${(i.transactions?.length || 0) + 1}_${i.id}`,
                date: new Date().toISOString().split('T')[0],
                amount: paymentAmount,
                method: method as PaymentMethod
            };

            const updatedTransactions = [...(i.transactions || []), newTransaction];

            updatedInvoice = { 
                ...i, 
                paidAmount: newPaidAmount,
                status: newStatus,
                paymentMethod: method as any,
                transactions: updatedTransactions
             };
            return updatedInvoice;
        }
        return i;
    });
    return updatedInvoice;
}

export const deleteInvoice = async (id: string): Promise<{ success: boolean }> => {
    await delay(200);
    invoices = invoices.filter(i => i.id !== id);
    return { success: true };
}


// Employees
export const createEmployee = async (data: Omit<Employee, 'id'>): Promise<Employee> => {
    await delay(200);
    const newEmployee: Employee = {
        ...data,
        id: `emp${employees.length + 1}`,
    };
    employees = [...employees, newEmployee];
    return newEmployee;
}

export const updateEmployee = async (id: string, data: Partial<Employee>): Promise<Employee | undefined> => {
    await delay(200);
    let updatedEmployee: Employee | undefined;
    employees = employees.map(e => {
        if (e.id === id) {
            updatedEmployee = { ...e, ...data };
            return updatedEmployee;
        }
        return e;
    });
    return updatedEmployee;
}

export const deleteEmployee = async (id: string): Promise<{ success: boolean }> => {
    await delay(200);
    employees = employees.filter(e => e.id !== id);
    return { success: true };
}


// Branches
export const createBranch = async (data: Omit<Branch, 'id'>): Promise<Branch> => {
    await delay(200);
    const newBranch: Branch = {
        ...data,
        id: `b${branches.length + 1}`
    };
    branches = [...branches, newBranch];
    return newBranch;
}

// Inventory
export const createInventoryItem = async (data: Omit<InventoryItem, 'id' | 'status'>): Promise<InventoryItem> => {
    await delay(200);
    const newItem: InventoryItem = {
        ...data,
        id: `item${inventory.length + 1}`,
        status: data.stock > data.reorderLevel ? 'In Stock' : data.stock > 0 ? 'Low Stock' : 'Out of Stock'
    };
    inventory = [...inventory, newItem];
    return newItem;
}

// Lab Orders
export const createLabOrder = async (data: Omit<LaboratoryOrder, 'id'>): Promise<LaboratoryOrder> => {
    await delay(200);
    const newOrder: LaboratoryOrder = {
        ...data,
        id: `lab${labOrders.length + 1}`,
    };
    labOrders = [...labOrders, newOrder];
    return newOrder;
}

// Payroll
export const createPayroll = async (data: Omit<Payroll, 'id'>): Promise<Payroll> => {
    await delay(200);
    const newPayroll: Payroll = {
        ...data,
        id: `pay${payrolls.length + 1}`,
    };
    payrolls = [newPayroll, ...payrolls];
    return newPayroll;
}


// Attendance
export const markAttendance = async(data: Omit<AttendanceRecord, 'id' | 'employeeName'>): Promise<AttendanceRecord> => {
    await delay(200);
    const employee = employees.find(e => e.id === data.employeeId);
    if (!employee) throw new Error("Employee not found");

    const newRecord: AttendanceRecord = {
        ...data,
        id: `att${attendance.length + 1}`,
        employeeName: employee.name,
    };
    
    // Check if a record for this employee and date already exists
    const existingIndex = attendance.findIndex(
      (att) => att.employeeId === data.employeeId && att.date === data.date
    );

    if (existingIndex > -1) {
        attendance[existingIndex] = newRecord;
    } else {
        attendance.push(newRecord);
    }
    
    return newRecord;
}
