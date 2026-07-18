
export type PaginatedArray<T> = T[] & {
    meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
};

export type Business = {
    id: string | number;
    name: string;
    details?: string;
    createdAt?: string;
};

export type ExpenseCategory = 'Supplies' | 'Rent' | 'Utilities' | 'Salaries' | 'Marketing' | 'Maintenance' | 'Other' | 'Payroll';

export type Expense = {
    id: string | number;
    branchId: string | number;
    date: string;
    category: ExpenseCategory;
    description: string;
    amount: number;
    type?: 'payroll' | 'operation';
    employeeName?: string;
    payPeriod?: string;
    netPay?: number;
    deductions?: number;
    branch?: Branch;
};

export type ExpenseSummary = {
    branch: Branch | null;
    total: number;
    totalPayroll: number;
    totalOperationalExpenses: number;
    records: Expense[];
};

export type Patient = {
  id: string | number;
  first_name: string;
  last_name: string;
  avatar?: string;
  email: string;
  phone?: string;
  address?: string;
  gender?: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  lastVisit?: string;
  nextVisit?: string;
  status: 'Active' | 'Inactive';
  dentalRecords: DentalRecord[];
  treatmentPlans: Treatment[];
  imaging: PatientImage[];
  history?: string;
  branchId: string | number;
  periodontalRecords: PeriodontalRecord;
  occlusalRecords: OcclusalRecord;
  softTissueRecords: SoftTissueRecord[];
  orthodonticRecords: OrthodonticRecord[];
  endodonticRecords?: EndodonticRecord[];
};

export type PatientImage = {
  url: string;
  description: string;
  date: string;
};

export type DentalCondition = 'Healthy' | 'Caries' | 'Filling' | 'Crown' | 'Missing' | 'Fracture';

export type DentalRecord = {
  id?: string | number;
  toothId: number;
  condition: DentalCondition;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
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

export type DashboardUpcomingAppointment = {
  id: string | number;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  treatment?: string;
  tokenNumber?: string;
};

export type DashboardRecentPatient = {
  id: string | number;
  firstName: string;
  lastName: string;
  lastVisit: string;
};

export type DashboardSummary = {
  totalRevenue: number;
  activePatients: number;
  appointmentsLast30Days: number;
  newPatientsLast30Days: number;
  practiceOverview: string;
  upcomingAppointments: DashboardUpcomingAppointment[];
  recentPatients: DashboardRecentPatient[];
};

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
  tokenNumber?: string;
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
  branch?: Branch;
  medicines?: InvoiceMedicine[];
};

export type ChartData = {
  month: string;
  revenue: number;
  newPatients: number;
  newAppointments: number;
  branchId: string;
};

export type PracticeTrendPoint = {
  date: string;
  revenue: number;
  appointments: number;
  newPatients: number;
};

export type EmployeeRole = 'Super Admin' | 'Account' | 'HR' | 'Dentist' | 'Hygienist' | 'Receptionist' | 'Assistant';

export type Employee = {
  id: string | number;
  name: string;
  avatar: string;
  email: string;
  role: EmployeeRole;
  status: 'Active' | 'On Leave' | 'Blocked';
  salary: number;
  hire_date: string;
  gender?: 'Male' | 'Female' | 'Other';
  branchId: string | number;
  branch?: {
    id: number;
    name: string;
    address: string;
  };
  branchName?: string;
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
  approvalStatus?: 'Pending' | 'Approved' | 'Rejected';
};

export type IncomeRecord = {
  id: string | number;
  branchId: string | number;
  date: string;
  patientName: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  invoiceNumber: string;
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
  currency?: string;
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

export type BasePatient = Omit<Patient, 'id' | 'dentalRecords' | 'treatmentPlans' | 'imaging' | 'periodontalRecords' | 'occlusalRecords' | 'softTissueRecords' | 'orthodonticRecords'>;

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
  mgj?: number;
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
  appliance: string;
  applianceLocation?: string;
  treatmentPhase?: string;
  wireSize?: string;
  wireSizeUpper?: string;
  wireSizeLower?: string;
  archwireMaterial?: string;
  elastics?: string;
  compliance?: string;
  oralHygiene?: string;
  bracketChanges?: string[];
  brokenBrackets?: string[];
  notes?: string;
  nextVisitGoals?: string;
  monthsInTreatment?: number;
};

export type SystemTreatment = {
    id: string | number;
    procedure: string;
    cost: number;
    category?: string;
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
  | 'charting:read' | 'charting:update' | 'periodontal:read' | 'periodontal:update'
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
    branchId?: string | number;
    from?: string;
    to?: string;
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    monthlyFinancials: { month: string; income: number; expense: number; netProfit: number }[];
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

export type ReportsOverview = {
    categories: {
        financial: { title: string; description: string };
        appointments: { title: string; description: string };
        demographics: { title: string; description: string };
    };
    financial_summary: {
        total_income: number;
        total_expenses: number;
        net_profit: number;
    };
    appointment_summary: {
        total_appointments: number;
        status_distribution: Record<string, number>;
    };
    patient_summary: {
        total_patients: number;
        status_distribution: Record<string, number>;
        gender_distribution: Record<string, number>;
        age_distribution: Record<string, number>;
    };
};

export type MedicineUnit = {
  id: number;
  medicine_id: number;
  unit_name: string;
  price: number;
  stock_quantity: number;
  created_at?: string;
  updated_at?: string;
};

export type Medicine = {
  id: number;
  name: string;
  description?: string;
  category?: string;
  branch_id: number;
  units: MedicineUnit[];
  created_at?: string;
  updated_at?: string;
};

export type PrescriptionItem = {
  id?: number;
  prescription_id?: number;
  medicine_id: number;
  medicine_unit_id: number;
  dosage: string;
  quantity: number;
  price: number;
  medicine?: Medicine;
  unit?: MedicineUnit;
  created_at?: string;
  updated_at?: string;
};

export type Prescription = {
  id: number;
  patient_id: number;
  patient_name: string;
  doctor_id?: number;
  doctor_name?: string;
  prescription_date: string;
  status: 'Pending' | 'Dispensed' | 'Billed';
  invoice_id?: number;
  notes?: string;
  branch_id: number;
  items: PrescriptionItem[];
  invoice?: Invoice;
  created_at?: string;
  updated_at?: string;
};

export type InvoiceMedicine = {
  id: number;
  invoice_id: number;
  medicine_id: number;
  medicine_unit_id: number;
  quantity: number;
  price: number;
  medicine?: Medicine;
  unit?: MedicineUnit;
  created_at?: string;
  updated_at?: string;
};

export type CanalDetail = {
  name: string;
  referencePoint?: string;
  workingLength?: number;
  fileSize?: string;
  obturationSize?: string;
};

export type EndodonticRecord = {
  id: string | number;
  date: string;
  toothId: number;
  pulpalDiagnosis: string;
  periapicalDiagnosis: string;
  canals: CanalDetail[];
  obturationMaterial?: string;
  postType?: string;
  notes?: string;
};
