

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
    treatments as allTreatments
} from '@/lib/data';
import type { Patient, Appointment, Invoice, ChartData, Employee, Payroll, Branch, InventoryItem, LaboratoryOrder, BasePatient, Treatment, OtherCharge } from '@/lib/types';

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
let treatments: string[] = [...allTreatments];

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

export const getTreatments = async (): Promise<string[]> => {
    await delay(50);
    return JSON.parse(JSON.stringify(treatments));
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
export const createInvoice = async (data: Omit<Invoice, 'id' | 'amount'> & { treatmentIds: string[], patientName: string, branchId: string }): Promise<Invoice> => {
    await delay(200);
    const patient = patients.find(p => p.id === data.patientId);
    if (!patient) throw new Error("Patient not found");

    const treatmentsTotal = patient.treatmentPlans
        .filter(t => data.treatmentIds.includes(t.id))
        .reduce((sum, t) => sum + t.cost, 0);
    
    const otherChargesTotal = (data.otherCharges || []).reduce((sum, charge) => sum + charge.amount, 0);

    const amount = treatmentsTotal + otherChargesTotal;

    const newInvoiceId = `inv${invoices.length + 1}`;
    
    const newInvoice: Invoice = {
        ...data,
        id: newInvoiceId,
        amount,
    };
    invoices = [newInvoice, ...invoices];

    // Mark treatments as billed
    patients = patients.map(p => {
        if (p.id === data.patientId) {
            return {
                ...p,
                treatmentPlans: p.treatmentPlans.map(t => 
                    data.treatmentIds.includes(t.id) ? { ...t, invoiceId: newInvoiceId } : t
                )
            };
        }
        return p;
    });

    return newInvoice;
}

export const updateInvoice = async (id: string, data: Partial<Omit<Invoice, 'amount' | 'id'>> & { treatmentIds?: string[] }): Promise<Invoice | undefined> => {
    await delay(200);
    let updatedInvoice: Invoice | undefined;

    const originalInvoice = invoices.find(i => i.id === id);
    if (!originalInvoice) return undefined;

    // Reset invoiceId for treatments that were on the original invoice but are not on the updated one
    const patientIdForUpdate = data.patientId || originalInvoice.patientId;
    const patient = patients.find(p => p.id === patientIdForUpdate);
    if (!patient) return undefined;
    
    const treatmentsToRemoveInvoiceId = originalInvoice.treatmentIds.filter(tid => !data.treatmentIds?.includes(tid));

    patients = patients.map(p => {
        if (p.id === patient.id) {
            return {
                ...p,
                treatmentPlans: p.treatmentPlans.map(t => {
                    if (treatmentsToRemoveInvoiceId.includes(t.id)) {
                        const { invoiceId, ...rest } = t;
                        return rest;
                    }
                    return t;
                })
            }
        }
        return p;
    });


    invoices = invoices.map(i => {
        if (i.id === id) {
            const treatmentIds = data.treatmentIds || i.treatmentIds;
            const treatmentsTotal = patient.treatmentPlans
                .filter(t => treatmentIds.includes(t.id))
                .reduce((sum, t) => sum + t.cost, 0);
            
            const otherCharges = data.otherCharges ?? i.otherCharges ?? [];
            const otherChargesTotal = otherCharges.reduce((sum, charge) => sum + charge.amount, 0);
            const amount = treatmentsTotal + otherChargesTotal;

            updatedInvoice = { ...i, ...data, amount, treatmentIds, otherCharges };
            
            // Mark new treatments as billed
            patients = patients.map(p => {
                if (p.id === patient.id) {
                    return {
                        ...p,
                        treatmentPlans: p.treatmentPlans.map(t => 
                            treatmentIds.includes(t.id) ? { ...t, invoiceId: id } : t
                        )
                    };
                }
                return p;
            });
            return updatedInvoice;
        }
        return i;
    });
    return updatedInvoice;
}

export const deleteInvoice = async (id: string): Promise<{ success: boolean }> => {
    await delay(200);
    const invoiceToDelete = invoices.find(i => i.id === id);
    if (invoiceToDelete) {
        // Unlink treatments from this invoice
        patients = patients.map(p => {
            if (p.id === invoiceToDelete.patientId) {
                return {
                    ...p,
                    treatmentPlans: p.treatmentPlans.map(t => {
                        if (t.invoiceId === id) {
                            const { invoiceId, ...rest } = t;
                            return rest;
                        }
                        return t;
                    })
                };
            }
            return p;
        });
    }

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
