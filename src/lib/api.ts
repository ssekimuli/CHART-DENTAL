



import { 
    patients,
    appointments,
    invoices as allInvoices,
    chartData,
    employees,
    payrolls as allPayrolls,
    branches,
    inventory,
    labOrders,
    treatments as allTreatments,
    attendance,
    leaveRequests,
    staffAdvances,
    expenses as allExpenses,
    roles
} from '@/lib/data';
import type { Patient, Appointment, Invoice, ChartData, Employee, Payroll, Branch, InventoryItem, LaboratoryOrder, BasePatient, InvoiceTreatment, OtherCharge, SystemTreatment, PaymentMethod, PaymentTransaction, AttendanceRecord, LeaveRequest, StaffAdvance, StaffAdvanceStatus, Expense, ExpenseCategory, RolePermissions, Permission, DentalRecord, PeriodontalRecord, OcclusalRecord, SoftTissueRecord, OrthodonticRecord, Treatment, DentalCondition, PatientImage, FinancialSummary } from '@/lib/types';
import type { DateRange } from 'react-day-picker';
import { format, parse } from "date-fns";

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

type GetInvoicesFilters = {
    branchId?: string;
    searchQuery?: string;
    dateRange?: DateRange;
};

export const getInvoices = async (filters?: GetInvoicesFilters): Promise<Invoice[]> => {
    await delay(200);
    let localInvoices = allInvoices;

    if (filters?.branchId) {
        localInvoices = localInvoices.filter(i => i.branchId === filters.branchId);
    }
    
    if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        localInvoices = localInvoices.filter(invoice => 
            invoice.patientName.toLowerCase().includes(query) ||
            invoice.id.toLowerCase().includes(query)
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
    await delay(100);
    return JSON.parse(JSON.stringify(allInvoices.find(i => i.id === id)));
}

export const getEmployees = async (): Promise<Employee[]> => {
    await delay(100);
    return JSON.parse(JSON.stringify(employees));
}

export const getEmployeeById = async (id: string): Promise<Employee | undefined> => {
    await delay(100);
    // Find by ID or email for profile page lookup
    return JSON.parse(JSON.stringify(employees.find(e => e.id === id || e.email === id)));
}

export const getPayrolls = async (branchId?: string): Promise<Payroll[]> => {
    await delay(250);
    let localPayrolls = allPayrolls;
    if (branchId) {
        localPayrolls = localPayrolls.filter(p => p.branchId === branchId);
    }
    return JSON.parse(JSON.stringify(localPayrolls));
}

export const getInventory = async (branchId?: string): Promise<InventoryItem[]> => {
    await delay(100);
    let localInventory = inventory;
    if (branchId) {
        localInventory = localInventory.filter(i => i.branchId === branchId);
    }
    return JSON.parse(JSON.stringify(localInventory));
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
    return JSON.parse(JSON.stringify(allTreatments));
}

export const getAttendance = async (): Promise<AttendanceRecord[]> => {
    await delay(150);
    return JSON.parse(JSON.stringify(attendance));
}

export const getLeaveRequests = async (): Promise<LeaveRequest[]> => {
    await delay(150);
    return JSON.parse(JSON.stringify(leaveRequests));
}

export const getStaffAdvances = async (): Promise<StaffAdvance[]> => {
    await delay(150);
    return JSON.parse(JSON.stringify(staffAdvances));
}

export const getExpenses = async (branchId?: string): Promise<Expense[]> => {
    await delay(150);
    let localExpenses = allExpenses;
    if (branchId) {
        localExpenses = localExpenses.filter(e => e.branchId === branchId);
    }
    return JSON.parse(JSON.stringify(localExpenses));
}

export const getRoles = async (): Promise<RolePermissions[]> => {
    await delay(100);
    return JSON.parse(JSON.stringify(roles));
}

export const getFinancialSummary = async (branchId: string): Promise<FinancialSummary> => {
    await delay(300);

    const branchInvoices = allInvoices.filter(i => i.branchId === branchId);
    const branchPayrolls = allPayrolls.filter(p => p.branchId === branchId);
    const branchExpenses = allExpenses.filter(e => e.branchId === branchId);
    
    const paidInvoices = branchInvoices.filter(i => i.status === 'Paid');
    const totalIncome = paidInvoices.reduce((sum, i) => sum + i.amount, 0);

    const payrollExpenses = branchPayrolls.reduce((sum, p) => sum + p.grossPay, 0);
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
        const monthKey = format(new Date(payroll.payDate), "yyyy-MM");
        if (!financialsByMonth[monthKey]) financialsByMonth[monthKey] = { income: 0, expense: 0 };
        financialsByMonth[monthKey].expense += payroll.grossPay;
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
    patients.push(newPatient);
    return newPatient;
}

export const updatePatient = async (id: string, data: Partial<Patient>): Promise<Patient | undefined> => {
    await delay(200);
    const patientIndex = patients.findIndex(p => p.id === id);
    if (patientIndex > -1) {
        patients[patientIndex] = { ...patients[patientIndex], ...data };
        return patients[patientIndex];
    }
    return undefined;
}

export const deletePatient = async (id: string): Promise<{ success: boolean }> => {
    await delay(200);
    const initialLength = patients.length;
    const newPatients = patients.filter(p => p.id !== id);
    patients.length = 0;
    Array.prototype.push.apply(patients, newPatients);
    return { success: patients.length < initialLength };
}

export const addImageToPatient = async (patientId: string, image: Omit<PatientImage, 'date'>): Promise<Patient | undefined> => {
    await delay(200);
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex > -1) {
        const patient = patients[patientIndex];
        const newImage: PatientImage = {
            ...image,
            date: new Date().toISOString().split('T')[0],
        }
        patient.imaging.push(newImage);
        return patient;
    }
    return undefined;
}

export const saveDentalRecord = async (patientId: string, record: DentalRecord): Promise<Patient | undefined> => {
    await delay(150);
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex > -1) {
        const patient = patients[patientIndex];
        const recordIndex = patient.dentalRecords.findIndex(r => r.toothId === record.toothId);
        const newRecords = [...patient.dentalRecords];
        if (recordIndex > -1) {
            newRecords[recordIndex] = record;
        } else {
            newRecords.push(record);
        }
        patients[patientIndex] = { ...patient, dentalRecords: newRecords };
        return patients[patientIndex];
    }
    return undefined;
}

export const savePeriodontalRecord = async (patientId: string, records: PeriodontalRecord): Promise<Patient | undefined> => {
    await delay(150);
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex > -1) {
        patients[patientIndex].periodontalRecords = records;
        return patients[patientIndex];
    }
    return undefined;
}

export const saveOcclusalRecord = async (patientId: string, record: OcclusalRecord): Promise<Patient | undefined> => {
    await delay(150);
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex > -1) {
        patients[patientIndex].occlusalRecords = record;
        return patients[patientIndex];
    }
    return undefined;
};

export const addTreatment = async (patientId: string, treatmentData: Omit<Treatment, 'id' | 'date'>, condition?: DentalCondition): Promise<Patient | undefined> => {
    await delay(200);
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex > -1) {
        const patient = patients[patientIndex];
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

export const updateTreatment = async (patientId: string, treatment: Treatment): Promise<Patient | undefined> => {
    await delay(200);
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex > -1) {
        const patient = patients[patientIndex];
        const treatmentIndex = patient.treatmentPlans.findIndex(t => t.id === treatment.id);
        if (treatmentIndex > -1) {
            patient.treatmentPlans[treatmentIndex] = treatment;
        }
        return patient;
    }
    return undefined;
}

export const deleteTreatment = async (patientId: string, treatmentId: string): Promise<Patient | undefined> => {
    await delay(200);
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex > -1) {
        const patient = patients[patientIndex];
        patient.treatmentPlans = patient.treatmentPlans.filter(t => t.id !== treatmentId);
        return patient;
    }
    return undefined;
}

export const saveOrthodonticRecord = async (patientId: string, recordData: Omit<OrthodonticRecord, 'id'>): Promise<Patient | undefined> => {
    await delay(200);
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex > -1) {
        const patient = patients[patientIndex];
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

export const updateOrthodonticRecord = async (patientId: string, record: OrthodonticRecord): Promise<Patient | undefined> => {
    await delay(200);
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex > -1) {
        const patient = patients[patientIndex];
        const recordIndex = patient.orthodonticRecords.findIndex(r => r.id === record.id);
        if (recordIndex > -1) {
            patient.orthodonticRecords[recordIndex] = record;
            patient.orthodonticRecords.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
        return patient;
    }
    return undefined;
}

export const deleteOrthodonticRecord = async (patientId: string, recordId: string): Promise<Patient | undefined> => {
    await delay(200);
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex > -1) {
        const patient = patients[patientIndex];
        patient.orthodonticRecords = patient.orthodonticRecords.filter(r => r.id !== recordId);
        return patient;
    }
    return undefined;
}

export const saveSoftTissueRecord = async (patientId: string, recordData: Omit<SoftTissueRecord, 'id'>): Promise<Patient | undefined> => {
    await delay(200);
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex > -1) {
        const patient = patients[patientIndex];
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

export const updateSoftTissueRecord = async (patientId: string, record: SoftTissueRecord): Promise<Patient | undefined> => {
    await delay(200);
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex > -1) {
        const patient = patients[patientIndex];
        const recordIndex = patient.softTissueRecords.findIndex(r => r.id === record.id);
        if (recordIndex > -1) {
            patient.softTissueRecords[recordIndex] = record;
            patient.softTissueRecords.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
        return patient;
    }
    return undefined;
}

export const deleteSoftTissueRecord = async (patientId: string, recordId: string): Promise<Patient | undefined> => {
    await delay(200);
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex > -1) {
        const patient = patients[patientIndex];
        patient.softTissueRecords = patient.softTissueRecords.filter(r => r.id !== recordId);
        return patient;
    }
    return undefined;
}


// Appointments
export const createAppointment = async (data: Omit<Appointment, 'id'>): Promise<Appointment> => {
    await delay(200);
    const newAppointment: Appointment = {
        ...data,
        id: `a${appointments.length + 1}`,
    };
    appointments.push(newAppointment);
    return newAppointment;
}

export const updateAppointment = async (id: string, data: Partial<Appointment>): Promise<Appointment | undefined> => {
    await delay(200);
    const appointmentIndex = appointments.findIndex(a => a.id === id);
    if (appointmentIndex > -1) {
        appointments[appointmentIndex] = { ...appointments[appointmentIndex], ...data };
        return appointments[appointmentIndex];
    }
    return undefined;
}

export const deleteAppointment = async (id: string): Promise<{ success: boolean }> => {
    await delay(200);
    const initialLength = appointments.length;
    const newAppointments = appointments.filter(a => a.id !== id);
    appointments.length = 0;
    Array.prototype.push.apply(appointments, newAppointments);
    return { success: appointments.length < initialLength };
}

// Invoices
export const createInvoice = async (data: Omit<Invoice, 'id' | 'amount' | 'paidAmount' | 'patientName'> & { branchId: string, treatments: InvoiceTreatment[] }): Promise<Invoice> => {
    await delay(200);
    const patient = patients.find(p => p.id === data.patientId);
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

export const updateInvoice = async (id: string, data: Partial<Omit<Invoice, 'amount' | 'id'>>): Promise<Invoice | undefined> => {
    await delay(200);
    const invoiceIndex = allInvoices.findIndex(i => i.id === id);

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

export const processPayment = async (invoiceId: string, paymentAmount: number, method: string): Promise<Invoice | undefined> => {
    await delay(300);
    const invoiceIndex = allInvoices.findIndex(i => i.id === invoiceId);
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

export const deleteInvoice = async (id: string): Promise<{ success: boolean }> => {
    await delay(200);
    const initialLength = allInvoices.length;
    const newInvoices = allInvoices.filter(i => i.id !== id);
    allInvoices.length = 0;
    Array.prototype.push.apply(allInvoices, newInvoices);
    return { success: allInvoices.length < initialLength };
}


// Employees
export const createEmployee = async (data: Omit<Employee, 'id'>): Promise<Employee> => {
    await delay(200);
    const newEmployee: Employee = {
        ...data,
        id: `emp${employees.length + 1}`,
    };
    employees.push(newEmployee);
    return newEmployee;
}

export const updateEmployee = async (id: string, data: Partial<Employee>): Promise<Employee | undefined> => {
    await delay(200);
    const employeeIndex = employees.findIndex(e => e.id === id);
    if (employeeIndex > -1) {
        employees[employeeIndex] = { ...employees[employeeIndex], ...data };
        return employees[employeeIndex];
    }
    return undefined;
}

export const deleteEmployee = async (id: string): Promise<{ success: boolean }> => {
    await delay(200);
    const initialLength = employees.length;
    const newEmployees = employees.filter(e => e.id !== id);
    employees.length = 0;
    Array.prototype.push.apply(employees, newEmployees);
    return { success: employees.length < initialLength };
}


// Branches
export const createBranch = async (data: Omit<Branch, 'id'>): Promise<Branch> => {
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
    await delay(200);
    const newOrder: LaboratoryOrder = {
        ...data,
        id: `lab${labOrders.length + 1}`,
    };
    labOrders.push(newOrder);
    return newOrder;
}

// Payroll
export const createPayroll = async (data: Omit<Payroll, 'id'>): Promise<Payroll> => {
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
    await delay(200);
    const employee = employees.find(e => e.id === data.employeeId);
    if (!employee) throw new Error("Employee not found");

    const existingIndex = attendance.findIndex(
        att => att.employeeId === data.employeeId && att.date === data.date
    );

    if (existingIndex > -1) {
        const updatedRecord = { ...attendance[existingIndex], ...data, employeeName: employee.name };
        attendance[existingIndex] = updatedRecord;
        return updatedRecord;
    } else {
        const newRecord: AttendanceRecord = {
            ...data,
            id: `att${attendance.length + 1}`,
            employeeName: employee.name,
        };
        attendance.push(newRecord);
        return newRecord;
    }
}

// Leave
export const createLeaveRequest = async (data: Omit<LeaveRequest, 'id' | 'employeeName' | 'status'>): Promise<LeaveRequest> => {
    await delay(200);
    const employee = employees.find(e => e.id === data.employeeId);
    if (!employee) throw new Error("Employee not found");

    const newRequest: LeaveRequest = {
        ...data,
        id: `leave${leaveRequests.length + 1}`,
        employeeName: employee.name,
        status: 'Pending',
    };
    leaveRequests.push(newRequest);
    return newRequest;
}

export const updateLeaveRequestStatus = async (id: string, status: LeaveRequest['status']): Promise<LeaveRequest | undefined> => {
    await delay(200);
    const requestIndex = leaveRequests.findIndex(req => req.id === id);
    if (requestIndex > -1) {
        leaveRequests[requestIndex] = { ...leaveRequests[requestIndex], status };
        return leaveRequests[requestIndex];
    }
    return undefined;
}

// Staff Advances
export const createStaffAdvance = async (data: Omit<StaffAdvance, 'id' | 'employeeName' | 'status'>): Promise<StaffAdvance> => {
    await delay(200);
    const employee = employees.find(e => e.id === data.employeeId);
    if (!employee) throw new Error("Employee not found");

    const newAdvance: StaffAdvance = {
        ...data,
        id: `adv${staffAdvances.length + 1}`,
        employeeName: employee.name,
        status: 'Pending',
    };
    staffAdvances.push(newAdvance);
    return newAdvance;
}

export const updateStaffAdvanceStatus = async (id: string, status: StaffAdvanceStatus): Promise<StaffAdvance | undefined> => {
    await delay(200);
    const advanceIndex = staffAdvances.findIndex(adv => adv.id === id);
    if (advanceIndex > -1) {
        staffAdvances[advanceIndex] = { ...staffAdvances[advanceIndex], status };
        return staffAdvances[advanceIndex];
    }
    return undefined;
}

// Expenses
export const createExpense = async (data: Omit<Expense, 'id'>): Promise<Expense> => {
    await delay(200);
    const newExpense: Expense = {
        ...data,
        id: `exp${allExpenses.length + 1}`,
    };
    allExpenses.unshift(newExpense);
    return newExpense;
}


// Roles
export const updateRole = async (roleId: string, permissions: Permission[]): Promise<RolePermissions | undefined> => {
    await delay(200);
    const roleIndex = roles.findIndex(r => r.id === roleId);
    if (roleIndex > -1) {
        roles[roleIndex] = { ...roles[roleIndex], permissions };
        return roles[roleIndex];
    }
    return undefined;
}
