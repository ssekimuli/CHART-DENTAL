
export type Patient = {
  id: string;
  name: string;
  avatar: string;
  email: string;
  dateOfBirth: string;
  lastVisit: string;
  status: 'Active' | 'Inactive';
  dentalRecords: DentalRecord[];
  treatmentPlans: Treatment[];
  imaging: string[];
  history: string;
  branchId: string;
};

export type DentalCondition = 'Healthy' | 'Caries' | 'Filling' | 'Crown' | 'Missing' | 'Fracture';

export type DentalRecord = {
  toothId: number;
  condition: DentalCondition;
  notes: string;
};

export type Treatment = {
  id: string;
  procedure: string;
  tooth?: number;
  status: 'Proposed' | 'In Progress' | 'Completed' | 'Cancelled';
  cost: number;
  date: string;
  invoiceId?: string;
};

export type Invoice = {
  id: string;
  patientName: string;
  patientId: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  issueDate: string;
  dueDate: string;
  branchId: string;
  treatmentIds: string[];
};

export type ChartData = {
  month: string;
  revenue: number;
  branchId: string;
};

export type EmployeeRole = 'Super Admin' | 'Account' | 'HR' | 'Dentist' | 'Hygienist' | 'Receptionist' | 'Assistant';

export type Employee = {
  id: string;
  name: string;
  avatar: string;
  email: string;
  role: EmployeeRole;
  status: 'Active' | 'On Leave';
  salary: number;
  hireDate: string;
  branchId: string;
};

export type Payroll = {
  id: string;
  employeeId: string;
  employeeName: string;
  payPeriod: string;
  grossPay: number;
  netPay: number;
  deductions: number;
  payDate: string;
  status: 'Paid' | 'Pending';
  branchId: string;
};

export type Branch = {
  id: string;
  name: string;
  address: string;
};

export type InventoryItem = {
    id: string;
    name: string;
    supplier: string;
    stock: number;
    reorderLevel: number;
    price: number;
    status: 'In Stock' | 'Low Stock' | 'Out of Stock';
    branchId: string;
};

export type LaboratoryOrder = {
  id: string;
  patientId: string;
  patientName: string;
  lab: string;
  item: string;
  tooth?: number;
  status: 'Sent' | 'Received' | 'Completed' | 'Cancelled';
  sentDate: string;
  dueDate: string;
  branchId: string;
};

export type BasePatient = Omit<Patient, 'id' | 'dentalRecords' | 'treatmentPlans' | 'imaging' | 'lastVisit' | 'branchId'>;

export type BaseInvoice = Omit<Invoice, 'id' | 'patientName' | 'branchId'>;
