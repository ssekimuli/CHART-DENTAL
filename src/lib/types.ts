

export type ExpenseCategory = 'Supplies' | 'Rent' | 'Utilities' | 'Salaries' | 'Marketing' | 'Maintenance' | 'Other';

export type Expense = {
    id: string | number;
    branchId: string | number;
    date: string;
    category: ExpenseCategory;
    description: string;
    amount: number;
};

export type Patient = {
  id: string | number;
  name: string;
  avatar: string;
  email: string;
  dateOfBirth: string;
  lastVisit: string;
  status: 'Active' | 'Inactive';
  dentalRecords: DentalRecord[];
  treatmentPlans: Treatment[];
  imaging: PatientImage[];
  history: string;
  branchId: string | number;
  periodontalRecords: PeriodontalRecord;
  occlusalRecords: OcclusalRecord;
  softTissueRecords: SoftTissueRecord[];
  orthodonticRecords: OrthodonticRecord[];
};

export type PatientImage = {
  url: string;
  description: string;
  date: string;
};

export type DentalCondition = 'Healthy' | 'Caries' | 'Filling' | 'Crown' | 'Missing' | 'Fracture';

export type DentalRecord = {
  toothId: number;
  condition: DentalCondition;
  notes: string;
};

export type Treatment = {
  id: string | number;
  procedureId: string | number;
  procedure: string;
  tooth?: number;
  status: 'Proposed' | 'In Progress' | 'Completed' | 'Cancelled';
  cost: number;
  date: string;
  invoiceId?: string | number;
};

// This represents a treatment item on an invoice. It may or may not correspond
// to a pre-existing treatment plan item.
export type InvoiceTreatment = {
  procedureId: string | number;
  procedure: string;
  cost: number;
  tooth?: number;
};


export type AppointmentStatus = "Scheduled" | "Completed" | "Cancelled" | "Waiting" | "In Session" | "On Hold";

export type Appointment = {
  id: string | number;
  patientName: string;
  patientId: string | number;
  doctorName: string;
  doctorId: string | number;
  treatment: string;
  status: AppointmentStatus;
  date: string;
  time: string;
  branchId: string | number;
  tokenNumber: string;
};

export type OtherCharge = {
  description: string;
  amount: number;
};

export type PaymentMethod = 'Cash' | 'Credit Card' | 'Insurance' | 'Bank Transfer';

export type PaymentTransaction = {
  id: string | number;
  date: string;
  amount: number;
  method: PaymentMethod;
};

export type Invoice = {
  id: string | number;
  patientName: string;
  patientId: string | number;
  amount: number;
  paidAmount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  issueDate: string;
  dueDate: string;
  branchId: string | number;
  treatments: InvoiceTreatment[];
  otherCharges?: OtherCharge[];
  paymentMethod?: PaymentMethod;
  transactions?: PaymentTransaction[];
};

export type ChartData = {
  month: string;
  revenue: number;
  newPatients: number;
  newAppointments: number;
  branchId: string;
};

export type EmployeeRole = 'Super Admin' | 'Account' | 'HR' | 'Dentist' | 'Hygienist' | 'Receptionist' | 'Assistant';

export type Employee = {
  id: string | number;
  name: string;
  avatar: string;
  email: string;
  role: EmployeeRole;
  status: 'Active' | 'On Leave';
  salary: number;
  hire_date: string;
  branchId: string | number;
  branch?: object;
  payrolls?: Payroll[];
  appointments?: Appointment[];
  attendance?: AttendanceRecord[];
};

export type Payroll = {
  id: string | number;
  employeeId: string | number;
  employeeName: string;
  payPeriod: string;
  grossPay: number;
  netPay: number;
  deductions: number;
  payDate: string;
  status: 'Paid' | 'Pending';
  branchId: string | number;
};

export type AttendanceStatus = 'Present' | 'Absent' | 'On Leave';

export type AttendanceRecord = {
    id: string | number;
    employeeId: string | number;
    employeeName: string;
    date: string;
    status: AttendanceStatus;
    checkIn?: string;
    checkOut?: string;
    branchId: string | number;
};


export type Branch = {
  id: number;
  name: string;
  address: string;
};

export type InventoryItem = {
    id: string | number;
    name: string;
    supplier: string;
    stock: number;
    reorderLevel: number;
    price: number;
    status: 'In Stock' | 'Low Stock' | 'Out of Stock';
    branchId: string | number;
};

export type LaboratoryOrder = {
  id: string | number;
  patientId: string | number;
  patientName: string;
  lab: string;
  item: string;
  tooth?: number;
  status: 'Sent' | 'Received' | 'Completed' | 'Cancelled';
  sentDate: string;
  dueDate: string;
  branchId: string | number;
};

export type BasePatient = Omit<Patient, 'id' | 'dentalRecords' | 'treatmentPlans' | 'imaging' | 'lastVisit' | 'branchId' | 'periodontalRecords' | 'occlusalRecords' | 'softTissueRecords' | 'orthodonticRecords'>;

export type BaseInvoice = Omit<Invoice, 'id' | 'patientName' | 'branchId'>;

export type PeriodontalPocketDepth = {
  distobuccal?: number;
  buccal?: number;
  mesiobuccal?: number;
  distolingual?: number;
  lingual?: number;
  mesiolingual?: number;
};

export type PeriodontalConditions = {
  bleeding?: boolean;
  suppuration?: boolean;
  plaque?: boolean;
  calculus?: boolean;
};

export type PeriodontalMeasurement = {
  toothId: number;
  pockets: PeriodontalPocketDepth;
  recession?: number;
  mobility?: '0' | '1' | '2' | '3';
  furcation?: 'I' | 'II' | 'III';
  conditions: PeriodontalConditions;
};


export type PeriodontalRecord = PeriodontalMeasurement[];


export type OcclusalRecord = {
  overbite: number | string;
  overjet: number | string;
  crossbite: string;
  openbite: string;
  malocclusion: string;
};

export type SoftTissueRecord = {
  id: string | number;
  location: string;
  type: 'Ulcer' | 'Lesion' | 'Color Change' | 'Swelling';
  description: string;
  date: string;
};

export type OrthodonticRecord = {
  id: string | number;
  date: string;
  appliance: 'Braces' | 'Invisalign' | 'Retainer';
  wireSize?: string;
  bracketChanges?: string[];
  notes: string;
};

export type SystemTreatment = {
    id: string | number;
    procedure: string;
    cost: number;
};

export type LeaveType = 'Annual' | 'Sick' | 'Unpaid' | 'Maternity';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export type LeaveRequest = {
  id: string | number;
  employeeId: string | number;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  branchId: string | number;
};

export type StaffAdvanceStatus = 'Pending' | 'Approved' | 'Paid' | 'Rejected';

export type StaffAdvance = {
  id: string | number;
  employeeId: string | number;
  employeeName: string;
  amount: number;
  date: string;
  reason: string;
  status: StaffAdvanceStatus;
  branchId: string | number;
};

export type CurrentUser = {
    role: EmployeeRole;
    permissions: Permission[];
    branchId: string | number;
    branchName: string;
    name: string;
    email: string;
    avatar: string;
};

export type Permission = 
  | 'dashboard:read'
  | 'queue:read'
  | 'patients:read' | 'patients:create' | 'patients:update' | 'patients:delete'
  | 'charting:read' | 'charting:update'
  | 'appointments:read' | 'appointments:create' | 'appointments:update' | 'appointments:delete'
  | 'billing:read' | 'billing:create' | 'billing:update' | 'billing:delete'
  | 'accounting:read' | 'accounting:create'
  | 'inventory:read' | 'inventory:create' | 'inventory:update'
  | 'laboratory:read' | 'laboratory:create' | 'laboratory:update'
  | 'hrm:read' | 'hrm:create' | 'hrm:update' | 'hrm:delete'
  | 'branches:read' | 'branches:create'
  | 'reports:read'
  | 'settings:manage'
  | 'profile:read' | 'profile:update';

export type RolePermissions = {
    id: string | number;
    name: string;
    permissions: Permission[];
};

export type FinancialSummary = {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    monthlyFinancials: { month: string; income: number; expense: number }[];
};

export type ProfileDataStats = {
    totalPaid: number;
    presentDays: number;
    absentDays: number;
    onLeaveDays: number;
    totalAppointments: number;
    uniquePatients: number;
    recentAppointments: Appointment[];
}

export type ProfileData = {
    employee: Employee;
    stats: ProfileDataStats;
    payrolls: Payroll[];
}
