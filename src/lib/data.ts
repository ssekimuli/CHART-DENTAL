
import type { Patient, Appointment, Invoice, ChartData, Employee, Payroll, Branch, InventoryItem, LaboratoryOrder, SystemTreatment, PaymentMethod, PaymentTransaction, AttendanceRecord, LeaveRequest, StaffAdvance, Expense, RolePermissions } from "@/lib/types";

export const branches: Branch[] = [
  { id: "b1", name: "Downtown Clinic", address: "123 Main St, Cityville" },
  { id: "b2", name: "Uptown Dental", address: "456 Oak Ave, Townburg" },
];

export const treatments: SystemTreatment[] = [
    { id: "proc-01", procedure: "Regular Checkup & Cleaning", cost: 75 },
    { id: "proc-02", procedure: "Composite Filling", cost: 250 },
    { id: "proc-03", procedure: "Amalgam Filling", cost: 200 },
    { id: "proc-04", procedure: "Root Canal Therapy", cost: 1500 },
    { id: "proc-05", procedure: "Tooth Extraction", cost: 300 },
    { id: "proc-06", procedure: "Dental Crown", cost: 1200 },
    { id: "proc-07", procedure: "Dental Bridge", cost: 3500 },
    { id: "proc-08", procedure: "Dental Implant", cost: 4000 },
    { id: "proc-09", procedure: "Single Tooth Implant", cost: 4000 },
    { id: "proc-10", procedure: "Implant-Supported Bridge", cost: 8000 },
    { id: "proc-11", procedure: "All-on-4 Implants", cost: 25000 },
    { id: "proc-12", procedure: "Teeth Whitening", cost: 450 },
    { id: "proc-13", procedure: "Veneers", cost: 1800 },
    { id: "proc-14", procedure: "Periodontal Scaling and Root Planing", cost: 800 },
    { id: "proc-15", procedure: "Dentures (Full)", cost: 2500 },
    { id: "proc-16", procedure: "Dentures (Partial)", cost: 1500 },
    { id: "proc-17", procedure: "Consultation", cost: 100 },
    { id: "proc-18", procedure: "Emergency Exam", cost: 150 },
];

export let patients: Patient[] = [
  {
    id: "1",
    name: "John Doe",
    avatar: "https://picsum.photos/seed/p1/200/200",
    email: "john.doe@example.com",
    dateOfBirth: "1985-05-20",
    lastVisit: "2024-05-10",
    status: "Active",
    branchId: "b1",
    dentalRecords: [
      { toothId: 18, condition: "Healthy", notes: "" },
      { toothId: 17, condition: "Filling", notes: "Amalgam filling from 2015." },
      { toothId: 16, condition: "Caries", notes: "Distal caries, requires attention." },
      { toothId: 26, condition: "Crown", notes: "Porcelain crown placed in 2020." },
      { toothId: 36, condition: "Missing", notes: "Extracted in 2010." },
      { toothId: 48, condition: "Fracture", notes: "Mesial-occlusal fracture." },
    ],
    treatmentPlans: [
      { id: "t1", procedureId: "proc-02", procedure: "Composite Filling", tooth: 16, status: "Completed", cost: 250, date: "2024-05-10", invoiceId: "inv1" },
      { id: "t2", procedureId: "proc-06", procedure: "Dental Crown", tooth: 48, status: "Proposed", cost: 1200, date: "2024-06-01" },
      { id: "t3", procedureId: "proc-01", procedure: "Regular Checkup & Cleaning", status: "Completed", cost: 75, date: "2024-03-01", invoiceId: "inv4" },
      { id: "t6", procedureId: "proc-12", procedure: "Teeth Whitening", status: "Completed", cost: 450, date: "2024-07-20" }
    ],
    imaging: [
      { url: "https://picsum.photos/seed/xray1/800/600", description: "Initial panoramic X-ray", date: "2023-01-15" },
      { url: "https://picsum.photos/seed/xray2/800/600", description: "Bitewing - Right Side", date: "2023-01-15" },
      { url: "https://picsum.photos/seed/xray3/800/600", description: "Periapical - Tooth #16", date: "2024-05-08" },
      { url: "https://picsum.photos/seed/xray4/800/600", description: "Post-treatment - Tooth #16", date: "2024-05-10" },
    ],
    history: "Patient has a history of grinding teeth (bruxism). Regular check-ups every 6 months. No known allergies. Previous treatments include multiple fillings and one extraction.",
    periodontalRecords: [
      { 
        toothId: 16,
        pockets: { distobuccal: 3, buccal: 2, mesiobuccal: 3, distolingual: 3, lingual: 2, mesiolingual: 2 },
        recession: 1,
        mobility: '0',
        furcation: undefined,
        conditions: { bleeding: true, plaque: true }
      },
      { 
        toothId: 36,
        pockets: { distobuccal: 4, buccal: 3, mesiobuccal: 4, distolingual: 4, lingual: 3, mesiolingual: 3 },
        recession: 2,
        mobility: '1',
        furcation: 'I',
        conditions: { bleeding: true, calculus: true, plaque: true }
      }
    ],
    occlusalRecords: {
      overbite: 2,
      overjet: 2,
      crossbite: "None",
      openbite: "None",
      malocclusion: "Class I",
    },
    softTissueRecords: [
      {
        id: 'st1',
        date: '2024-05-10',
        location: 'Right buccal mucosa',
        type: 'Ulcer',
        description: 'Small aphthous ulcer, 3mm diameter, non-indurated.'
      },
      {
        id: 'st2',
        date: '2023-11-20',
        location: 'Floor of mouth',
        type: 'Lesion',
        description: 'Torus mandibularis, bony and asymptomatic.'
      }
    ],
    orthodonticRecords: [],
  },
  {
    id: "2",
    name: "Jane Smith",
    avatar: "https://picsum.photos/seed/p2/200/200",
    email: "jane.smith@example.com",
    dateOfBirth: "1992-08-15",
    lastVisit: "2024-04-22",
    status: "Active",
    branchId: "b2",
    dentalRecords: [],
    treatmentPlans: [
      { id: "t4", procedureId: "proc-01", procedure: "Regular Checkup & Cleaning", status: "Completed", cost: 150, date: "2024-04-22", invoiceId: "inv2" },
    ],
    imaging: [
        { url: "https://picsum.photos/seed/xray7/800/600", description: "Annual Bitewing", date: "2024-04-22" },
    ],
    history: "Good oral hygiene. No major issues reported. Undergoing orthodontic treatment.",
    periodontalRecords: [],
    occlusalRecords: {
      overbite: 1,
      overjet: 1,
      crossbite: "None",
      openbite: "None",
      malocclusion: "Class I",
    },
    softTissueRecords: [],
    orthodonticRecords: [
        {
            id: 'ortho1',
            date: '2024-01-10',
            appliance: 'Braces',
            wireSize: '.016 Nickel Titanium',
            bracketChanges: [],
            notes: 'Initial placement of ceramic braces on upper and lower arches. Patient instructed on proper care and hygiene.'
        },
        {
            id: 'ortho2',
            date: '2024-03-15',
            appliance: 'Braces',
            wireSize: '.018 Stainless Steel',
            bracketChanges: ['14', '24'],
            notes: 'Adjustment appointment. Progressing well. Repositioned brackets on #14 and #24 to improve rotation. Patient reports minor discomfort.'
        },
    ],
  },
  {
    id: "3",
    name: "Peter Jones",
    avatar: "https://picsum.photos/seed/p3/200/200",
    email: "peter.jones@example.com",
    dateOfBirth: "1978-11-30",
    lastVisit: "2023-12-15",
    status: "Inactive",
    branchId: "b1",
    dentalRecords: [],
    treatmentPlans: [],
    imaging: [],
    history: "Requires follow-up for periodontal scaling.",
    periodontalRecords: [],
      occlusalRecords: {
        overbite: 2,
        overjet: 3,
        crossbite: "Posterior",
        openbite: "None",
        malocclusion: "Class II",
      },
      softTissueRecords: [],
      orthodonticRecords: [],
  },
   {
    id: "4",
    name: "Mike Williams",
    avatar: "https://picsum.photos/seed/p4/200/200",
    email: "mike.williams@example.com",
    dateOfBirth: "1990-09-01",
    lastVisit: "2024-07-15",
    status: "Active",
    branchId: "b2",
    dentalRecords: [],
    treatmentPlans: [
      { id: "t5", procedureId: "proc-02", procedure: "Composite Filling", status: "Completed", cost: 300, date: "2024-07-15", invoiceId: "inv3" }
    ],
    imaging: [],
    history: "New patient.",
    periodontalRecords: [],
      occlusalRecords: {
        overbite: 2,
        overjet: 2,
        crossbite: "None",
        openbite: "None",
        malocclusion: "Class I",
      },
      softTissueRecords: [],
      orthodonticRecords: [],
  },
  {
    id: "5",
    name: "Sarah Brown",
    avatar: "https://picsum.photos/seed/p5/200/200",
    email: "sarah.brown@example.com",
    dateOfBirth: "1988-02-25",
    lastVisit: "2024-07-14",
    status: "Active",
    branchId: "b1",
    dentalRecords: [],
    treatmentPlans: [],
    imaging: [],
    history: "Regular patient.",
    periodontalRecords: [],
      occlusalRecords: {
        overbite: 1,
        overjet: 2,
        crossbite: "None",
        openbite: "None",
        malocclusion: "Class I",
      },
      softTissueRecords: [],
      orthodonticRecords: [],
  }
];

const today = new Date().toISOString().split('T')[0];
export let appointments: Appointment[] = [
  { id: "a1", patientName: "John Doe", patientId: "1", doctorName: "Dr. Lisa Cuddy", doctorId: 'emp1', treatment: "Check-up", status: "Scheduled", date: "2024-07-20", time: "10:00 AM", branchId: "b1", tokenNumber: 'JDLC1' },
  { id: "a2", patientName: "Jane Smith", patientId: "2", doctorName: "Dr. Eric Foreman", doctorId: 'emp5', treatment: "Cleaning", status: "Scheduled", date: "2024-07-21", time: "11:30 AM", branchId: "b2", tokenNumber: 'JSEF2' },
  { id: "a3", patientName: "Mike Williams", patientId: "4", doctorName: "Dr. Eric Foreman", doctorId: 'emp5', treatment: "Filling", status: "Completed", date: "2024-07-15", time: "02:00 PM", branchId: "b2", tokenNumber: 'MWEF3' },
  { id: "a4", patientName: "Sarah Brown", patientId: "5", doctorName: "Dr. Lisa Cuddy", doctorId: 'emp1', treatment: "Consultation", status: "Cancelled", date: "2024-07-14", time: "09:00 AM", branchId: "b1", tokenNumber: 'SBLC4' },
  { id: "a5", patientName: "Peter Jones", patientId: "3", doctorName: "Dr. Lisa Cuddy", doctorId: 'emp1', treatment: "Periodontal Scaling", status: "Scheduled", date: today, time: "09:00 AM", branchId: "b1", tokenNumber: 'PJLC5' },
  { id: "a6", patientName: "John Doe", patientId: "1", doctorName: "Dr. Lisa Cuddy", doctorId: 'emp1', treatment: "Crown Follow-up", status: "Waiting", date: today, time: "09:30 AM", branchId: "b1", tokenNumber: 'JDLC6' },
];

export let invoices: Invoice[] = [
  { 
    id: "inv1", 
    patientName: "John Doe", 
    patientId: "1", 
    amount: 250, 
    paidAmount: 100, 
    status: "Pending", 
    issueDate: "2024-05-10", 
    dueDate: "2024-06-10", 
    branchId: "b1", 
    treatments: [{ procedureId: "proc-02", procedure: 'Composite Filling', cost: 250}], 
    otherCharges: [], 
    paymentMethod: 'Insurance',
    transactions: [
        { id: 'txn1', date: '2024-05-12', amount: 100, method: 'Insurance' }
    ]
  },
  { 
    id: "inv2", 
    patientName: "Jane Smith", 
    patientId: "2", 
    amount: 150, 
    paidAmount: 150, 
    status: "Paid", 
    issueDate: "2024-04-22", 
    dueDate: "2024-05-22", 
    branchId: "b2", 
    treatments: [{ procedureId: "proc-01", procedure: 'Regular Checkup & Cleaning', cost: 150}], 
    otherCharges: [], 
    paymentMethod: 'Credit Card',
    transactions: [
        { id: 'txn2', date: '2024-04-22', amount: 150, method: 'Credit Card' }
    ]
  },
  { 
    id: "inv3", 
    patientName: "Mike Williams", 
    patientId: "4", 
    amount: 300, 
    paidAmount: 300, 
    status: "Paid", 
    issueDate: "2024-07-15", 
    dueDate: "2024-08-15", 
    branchId: "b2", 
    treatments: [{ procedureId: "proc-02", procedure: 'Composite Filling', cost: 300}], 
    otherCharges: [], 
    paymentMethod: 'Cash',
    transactions: [
        { id: 'txn3', date: '2024-07-15', amount: 300, method: 'Cash' }
    ]
  },
  { 
    id: "inv4", 
    patientName: "John Doe", 
    patientId: "1", 
    amount: 95, 
    paidAmount: 0, 
    status: "Overdue", 
    issueDate: "2024-03-01", 
    dueDate: "2024-04-01", 
    branchId: "b1", 
    treatments: [{ procedureId: "proc-01", procedure: 'Regular Checkup & Cleaning', cost: 75}], 
    otherCharges: [{ description: 'Late Fee', amount: 20 }],
    transactions: []
  },
];

export const chartData: ChartData[] = [
    { month: "January", revenue: 18600, newPatients: 15, newAppointments: 50, branchId: "b1" },
    { month: "February", revenue: 30500, newPatients: 20, newAppointments: 65, branchId: "b1" },
    { month: "March", revenue: 23700, newPatients: 18, newAppointments: 60, branchId: "b1" },
    { month: "April", revenue: 27800, newPatients: 22, newAppointments: 70, branchId: "b1" },
    { month: "May", revenue: 45231, newPatients: 30, newAppointments: 80, branchId: "b1" },
    { month: "June", revenue: 34900, newPatients: 25, newAppointments: 75, branchId: "b1" },
    { month: "January", revenue: 15000, newPatients: 10, newAppointments: 40, branchId: "b2" },
    { month: "February", revenue: 28000, newPatients: 18, newAppointments: 55, branchId: "b2" },
    { month: "March", revenue: 21000, newPatients: 12, newAppointments: 50, branchId: "b2" },
    { month: "April", revenue: 25000, newPatients: 16, newAppointments: 60, branchId: "b2" },
    { month: "May", revenue: 41000, newPatients: 25, newAppointments: 70, branchId: "b2" },
    { month: "June", revenue: 32000, newPatients: 20, newAppointments: 65, branchId: "b2" },
];

export const employees: Employee[] = [
  { id: 'emp1', name: 'Dr. Lisa Cuddy', avatar: 'https://picsum.photos/seed/emp1/200/200', email: 'lisa.cuddy@example.com', role: 'Super Admin', status: 'Active', salary: 150000, hire_date: '2020-01-15', branch_id: 'b1' },
  { id: 'emp2', name: 'James Wilson', avatar: 'https://picsum.photos/seed/emp2/200/200', email: 'james.wilson@example.com', role: 'Hygienist', status: 'Active', salary: 75000, hire_date: '2021-03-20', branch_id: 'b1' },
  { id: 'emp3', name: 'Allison Cameron', avatar: 'https://picsum.photos/seed/emp3/200/200', email: 'allison.cameron@example.com', role: 'Receptionist', status: 'Active', salary: 50000, hire_date: '2022-07-01', branch_id: 'b2' },
  { id: 'emp4', name: 'Robert Chase', avatar: 'https://picsum.photos/seed/emp4/200/200', email: 'robert.chase@example.com', role: 'Assistant', status: 'On Leave', salary: 55000, hire_date: '2021-09-10', branch_id: 'b2' },
  { id: 'emp5', name: 'Dr. Eric Foreman', avatar: 'https://picsum.photos/seed/emp5/200/200', email: 'eric.foreman@example.com', role: 'Dentist', status: 'Active', salary: 120000, hire_date: '2019-08-01', branch_id: 'b2' },
];

export let payrolls: Payroll[] = [
    { id: 'pay1', employee_id: 'emp1', employee_name: 'Dr. Lisa Cuddy', pay_period: '2024-06-01 to 2024-06-15', gross_pay: 6250, deductions: 1200, net_pay: 5050, pay_date: '2024-06-15', status: 'Paid', branch_id: 'b1' },
    { id: 'pay2', employee_id: 'emp2', employee_name: 'James Wilson', pay_period: '2024-06-01 to 2024-06-15', gross_pay: 3125, deductions: 600, net_pay: 2525, pay_date: '2024-06-15', status: 'Paid', branch_id: 'b1' },
    { id: 'pay3', employee_id: 'emp3', employee_name: 'Allison Cameron', pay_period: '2024-06-16 to 2024-06-30', gross_pay: 2083.33, deductions: 400, net_pay: 1683.33, pay_date: '2024-06-30', status: 'Pending', branch_id: 'b2' },
    { id: 'pay4', employee_id: 'emp4', employee_name: 'Robert Chase', pay_period: '2024-06-16 to 2024-06-30', gross_pay: 2291.67, deductions: 450, net_pay: 1841.67, pay_date: '2024-06-30', status: 'Pending', branch_id: 'b2' },
];

export let attendance: AttendanceRecord[] = [
    { id: 'att1', employeeId: 'emp1', employeeName: 'Dr. Lisa Cuddy', date: today, status: 'Present', checkIn: '08:55 AM', checkOut: '05:05 PM', branchId: 'b1' },
    { id: 'att2', employeeId: 'emp2', employeeName: 'James Wilson', date: today, status: 'Present', checkIn: '09:00 AM', checkOut: '05:00 PM', branchId: 'b1' },
    { id: 'att3', employeeId: 'emp4', employeeName: 'Robert Chase', date: today, status: 'On Leave', branchId: 'b2' },
    { id: 'att4', employeeId: 'emp5', employeeName: 'Dr. Eric Foreman', date: today, status: 'Absent', branchId: 'b2' },
];

export let inventory: InventoryItem[] = [
    { id: 'item1', name: 'Gloves (Box of 100)', supplier: 'Dental Supplies Co.', stock: 50, reorderLevel: 20, price: 15.00, status: 'In Stock', branchId: 'b1' },
    { id: 'item2', name: 'Dental Masks (Box of 50)', supplier: 'MediWear', stock: 15, reorderLevel: 10, price: 25.00, status: 'Low Stock', branchId: 'b1' },
    { id: 'item3', name: 'Composite Resin (Syringe)', supplier: '3M Dental', stock: 100, reorderLevel: 50, price: 85.00, status: 'In Stock', branchId: 'b2' },
    { id: 'item4', name: 'Anesthetic Cartridges', supplier: 'PharmaPlus', stock: 5, reorderLevel: 20, price: 55.00, status: 'Low Stock', branchId: 'b2' },
    { id: 'item5', name: 'X-Ray Film', supplier: 'Kodak', stock: 0, reorderLevel: 10, price: 120.00, status: 'Out of Stock', branchId: 'b1' },
];

export let labOrders: LaboratoryOrder[] = [
    { id: 'lab1', patientId: '1', patientName: 'John Doe', lab: 'Precision Dental Labs', item: 'Zirconia Crown', tooth: 48, status: 'Sent', sentDate: '2024-06-02', dueDate: '2024-06-16', branchId: 'b1'},
    { id: 'lab2', patientId: '2', patientName: 'Jane Smith', lab: 'Aesthetic Creations', item: 'Night Guard', status: 'Received', sentDate: '2024-05-15', dueDate: '2024-05-30', branchId: 'b2'},
    { id: 'lab3', patientId: '4', patientName: 'Mike Williams', lab: 'Precision Dental Labs', item: 'Inlay', tooth: 15, status: 'Completed', sentDate: '2024-07-16', dueDate: '2024-07-30', branchId: 'b2'},
    { id: 'lab4', patientId: '1', patientName: 'John Doe', lab: 'City Labs', item: 'Denture Repair', status: 'Cancelled', sentDate: '2024-07-01', dueDate: '2024-07-10', branchId: 'b1'},
];

export let leaveRequests: LeaveRequest[] = [
  { id: 'leave1', employeeId: 'emp2', employeeName: 'James Wilson', leaveType: 'Annual', startDate: '2024-08-01', endDate: '2024-08-05', reason: 'Family vacation', status: 'Approved', branchId: 'b1' },
  { id: 'leave2', employeeId: 'emp4', employeeName: 'Robert Chase', leaveType: 'Sick', startDate: '2024-07-18', endDate: '2024-07-18', reason: 'Feeling unwell', status: 'Approved', branchId: 'b2' },
  { id: 'leave3', employeeId: 'emp3', employeeName: 'Allison Cameron', leaveType: 'Annual', startDate: '2024-09-01', endDate: '2024-09-03', reason: 'Personal time', status: 'Pending', branchId: 'b2' },
  { id: 'leave4', employeeId: 'emp5', employeeName: 'Dr. Eric Foreman', leaveType: 'Unpaid', startDate: '2024-08-10', endDate: '2024-08-10', reason: 'Conference', status: 'Rejected', branchId: 'b2' },
];

export let staffAdvances: StaffAdvance[] = [
    { id: 'adv1', employeeId: 'emp3', employeeName: 'Allison Cameron', amount: 500, date: '2024-07-01', reason: 'Emergency', status: 'Approved', branchId: 'b2'},
    { id: 'adv2', employeeId: 'emp5', employeeName: 'Dr. Eric Foreman', amount: 1000, date: '2024-07-10', reason: 'Travel expenses', status: 'Pending', branchId: 'b2'},
    { id: 'adv3', employeeId: 'emp2', employeeName: 'James Wilson', amount: 200, date: '2024-06-20', reason: 'Personal', status: 'Rejected', branchId: 'b1'},
]

export let expenses: Expense[] = [
    { id: 'exp1', branchId: 'b1', date: '2024-06-01', category: 'Rent', description: 'June Rent - Downtown Clinic', amount: 5000 },
    { id: 'exp2', branchId: 'b1', date: '2024-06-05', category: 'Utilities', description: 'Electricity Bill', amount: 450 },
    { id: 'exp3', branchId: 'b1', date: '2024-06-10', category: 'Supplies', description: 'Order from Dental Supplies Co.', amount: 1250 },
    { id: 'exp4', branchId: 'b2', date: '2024-06-01', category: 'Rent', description: 'June Rent - Uptown Dental', amount: 6500 },
    { id: 'exp5', branchId: 'b2', date: '2024-06-06', category: 'Utilities', description: 'Water & Gas Bill', amount: 300 },
];

export let roles: RolePermissions[] = [
    { id: 'Super Admin', name: 'Super Admin', permissions: ['dashboard:read', 'queue:read', 'patients:read', 'patients:create', 'patients:update', 'patients:delete', 'charting:read', 'charting:update', 'appointments:read', 'appointments:create', 'appointments:update', 'appointments:delete', 'billing:read', 'billing:create', 'billing:update', 'billing:delete', 'accounting:read', 'accounting:create', 'inventory:read', 'inventory:create', 'inventory:update', 'laboratory:read', 'laboratory:create', 'laboratory:update', 'hrm:read', 'hrm:create', 'hrm:update', 'hrm:delete', 'branches:read', 'branches:create', 'reports:read', 'settings:manage', 'profile:read', 'profile:update'] },
    { id: 'Account', name: 'Accountant', permissions: ['dashboard:read', 'billing:read', 'billing:create', 'billing:update', 'billing:delete', 'accounting:read', 'accounting:create', 'reports:read', 'settings:manage', 'profile:read', 'profile:update'] },
    { id: 'HR', name: 'HR Manager', permissions: ['dashboard:read', 'hrm:read', 'hrm:create', 'hrm:update', 'hrm:delete', 'reports:read', 'settings:manage', 'profile:read', 'profile:update'] },
    { id: 'Dentist', name: 'Dentist', permissions: ['dashboard:read', 'queue:read', 'patients:read', 'patients:create', 'patients:update', 'charting:read', 'charting:update', 'appointments:read', 'appointments:create', 'appointments:update', 'billing:read', 'laboratory:read', 'laboratory:create', 'laboratory:update', 'profile:read', 'profile:update'] },
    { id: 'Hygienist', name: 'Hygienist', permissions: ['dashboard:read', 'queue:read', 'patients:read', 'charting:read', 'charting:update', 'appointments:read', 'profile:read', 'profile:update'] },
    { id: 'Receptionist', name: 'Receptionist', permissions: ['dashboard:read', 'queue:read', 'patients:read', 'patients:create', 'patients:update', 'appointments:read', 'appointments:create', 'appointments:update', 'appointments:delete', 'billing:read', 'billing:create', 'billing:update', 'inventory:read', 'profile:read', 'profile:update'] },
    { id: 'Assistant', name: 'Dental Assistant', permissions: ['dashboard:read', 'queue:read', 'patients:read', 'charting:read', 'appointments:read', 'inventory:read', 'inventory:create', 'inventory:update', 'laboratory:read', 'profile:read', 'profile:update'] }
];
