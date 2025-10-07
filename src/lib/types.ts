
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
  periodontalRecords: PeriodontalRecord;
  occlusalRecords: OcclusalRecord;
  softTissueRecords: SoftTissueRecord[];
  orthodonticRecords: OrthodonticRecord[];
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
  id: string;
  location: string;
  type: 'Ulcer' | 'Lesion' | 'Color Change' | 'Swelling';
  description: string;
  date: string;
};

export type OrthodonticRecord = {
  id: string;
  date: string;
  appliance: 'Braces' | 'Invisalign' | 'Retainer';
  wireSize?: string;
  bracketChanges?: string[];
  notes: string;
};

