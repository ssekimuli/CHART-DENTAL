# CHART DENTAL - COMPREHENSIVE MODULES GUIDE

Complete documentation for all 20 modules in the CHART DENTAL system.

---

## Module Directory

```
20 Core Modules:
1. Dashboard (Home)
2. Billing
3. Branches
4. Charting
5. Clients
6. Dashboard (KPI View)
7. Employees
8. HRM (Human Resource Management)
9. Insurance
10. Insurance Setup
11. Inventory
12. Laboratory
13. Patients
14. Payroll
15. Pharmacy
16. Printer Test
17. Profile
18. Queue
19. Reports
20. Settings
```

---

# MODULE GUIDE

## 1. DASHBOARD (Home/Overview)

### Purpose
Main entry point showing practice KPIs and daily overview

### Module Path
`src/app/(dashboard)/dashboard`

### Key Features
- **KPI Cards**
  - Total Revenue (YTD)
  - Active Patients (count)
  - Appointments Last 30 Days
  - New Patients Last 30 Days

- **Widgets**
  - Revenue Trend Chart
  - Appointments Chart
  - Upcoming Appointments List
  - Recent Patients List

- **Quick Actions**
  - New Patient button
  - Schedule Appointment button
  - Create Invoice button
  - View Reports button

### APIs Used
```
GET /dashboard-summary?branch_id={branchId}
GET /practice-trends?branch_id={branchId}
GET /appointments?date={today}&status=Scheduled
GET /patients?branch_id={branchId}&sort_by=created_at&sort_order=desc&per_page=5
```

### Key State
```typescript
interface DashboardState {
  branchId: string;
  totalRevenue: number;
  activePatients: number;
  appointmentsLast30Days: number;
  newPatientsLast30Days: number;
  upcomingAppointments: Appointment[];
  recentPatients: Patient[];
  trends: PracticeTrendPoint[];
}
```

### User Roles Access
- ✅ Admin
- ✅ Manager
- ✅ Doctor
- ✅ Receptionist

### Performance Metrics
- Load time: < 2 seconds
- Chart rendering: < 500ms
- Data refresh: Every 5 minutes

### Best Practices
1. Cache dashboard data (5-min TTL)
2. Load charts asynchronously
3. Paginate appointment/patient lists
4. Use date range filters

---

## 2. BILLING

### Purpose
Complete invoice & payment management system

### Module Path
`src/app/(dashboard)/billing`

### Sub-Pages
- `/billing` - List all invoices
- `/billing/new` - Create new invoice
- `/billing/[id]` - View/edit invoice detail

### Key Features

#### Invoice Management
- Create invoices with treatments
- Add line items (procedures, medicines)
- Calculate totals automatically
- Apply discounts and taxes
- Set insurance coverage
- Multiple payment methods

#### Payment Processing
- Record partial payments
- Multiple payment methods
  - Cash
  - Credit Card
  - Check
  - Insurance
- Payment history tracking
- Receipt generation
- Invoice status workflow

#### Invoice Lifecycle
```
Draft → Issued → Paid (or Overdue/Cancelled)
```

#### Reports
- Outstanding invoices
- Aging analysis
- Payment method breakdown
- Revenue by procedure
- Patient payment history

### APIs Used
```
GET /invoices?branch_id={branchId}&status={status}&page={page}
GET /invoices/{id}
GET /patients/{id}/invoices
POST /invoices
PATCH /invoices/{id}
POST /invoices/{id}/payments
GET /invoices/{id}/payment-history

Related:
GET /patients-list (for selection)
GET /procedures (for treatments)
```

### Key Data Model
```typescript
interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  amount: number;
  paidAmount: number;
  status: 'Draft' | 'Issued' | 'Paid' | 'Overdue' | 'Cancelled';
  issueDate: string;
  dueDate: string;
  treatments: Treatment[];
  otherCharges: Charge[];
  medicines: Medicine[];
  discount: number;
  tax: number;
  insuranceCoverage: number;
  paymentHistory: Payment[];
}
```

### Calculations
```
Subtotal = Sum(treatments.cost) + Sum(charges.amount)
Gross Total = Subtotal + Tax - Discount
Insurance Pay = Min(insuranceCoverage, Gross Total)
Patient Owes = Gross Total - Insurance Pay
Patient Paid = Sum(payments.amount)
Patient Balance = Patient Owes - Patient Paid
```

### Validations
- Amount must be > 0
- Issue date <= Due date
- Paid amount <= Total amount
- Patient must exist
- Procedures must exist

### User Roles Access
- ✅ Admin
- ✅ Manager
- ✅ Billing Staff
- ✅ Accountant
- ❌ Doctor (view only)
- ❌ Receptionist

### Reports Generated
- Invoice List Report
- Payment Summary
- Outstanding Amount Report
- Revenue Report by Procedure
- Aging Report

---

## 3. BRANCHES

### Purpose
Multi-location management system

### Module Path
`src/app/(dashboard)/branches`

### Key Features
- Branch listing with details
- Create new branch
- Edit branch information
- Assign staff to branches
- Branch-specific inventory
- Branch financial reports
- Manage branch settings

### Branch Information
```typescript
interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  businessId: string;
  currency: string;
  status: 'Active' | 'Inactive';
  manager?: string;
  staffCount?: number;
}
```

### APIs Used
```
GET /all-branch
GET /businesses
POST /businesses
PATCH /businesses/{id}

Related:
GET /employees?branch_id={branchId}
GET /invoices?branch_id={branchId}
GET /patients?branch_id={branchId}
GET /management/inventory?branch_id={branchId}
```

### Features Per Branch
- Staff allocation
- Inventory management
- Financial tracking
- Patient management
- Appointment scheduling
- Reports by branch

### User Roles Access
- ✅ Admin (all branches)
- ✅ Manager (assigned branch only)
- ✅ Branch Manager
- ❌ Others

### Best Practices
1. Filter all data by branch
2. Show branch context in headers
3. Prevent cross-branch data access
4. Track branch performance separately

---

## 4. CHARTING

### Purpose
Shared entry point to dental charting system

### Module Path
`src/app/(dashboard)/charting`

### Key Features
- Quick patient selection
- Recent patients list
- Direct access to charting interface
- Search patient functionality

### Available Charting Types
1. **Dental Records**
   - Tooth conditions
   - Surface-specific marks

2. **Periodontal**
   - Pocket depths (6 sites per tooth)
   - Recession measurements
   - Mobility grades (0-3)
   - Furcation classification

3. **Occlusal**
   - Overbite measurement
   - Overjet measurement
   - Crossbite assessment
   - Openbite assessment
   - Malocclusion classification

4. **Soft Tissue**
   - Gingival condition
   - Mucosal observations
   - Lesion documentation

5. **Orthodontic**
   - Appliance type
   - Treatment phase
   - Wire size & material
   - Elastics configuration
   - Compliance tracking
   - Bracket changes
   - Broken brackets tracking

6. **Endodontic**
   - Pulpal diagnosis
   - Periapical diagnosis
   - Canal identification
   - Obturation material
   - Post type

7. **Restorative**
   - Restoration type
   - Material used
   - Surface treated
   - Restoration date

### Tooth Reference System
```
Upper Right:  18, 17, 16, 15, 14, 13, 12, 11
Upper Left:   21, 22, 23, 24, 25, 26, 27, 28
Lower Left:   31, 32, 33, 34, 35, 36, 37, 38
Lower Right:  48, 47, 46, 45, 44, 43, 42, 41
```

### Surface Codes
```
O - Occlusal/Incisal (chewing surface)
B - Buccal (toward cheek)
L - Lingual (toward tongue)
M - Mesial (toward midline)
D - Distal (away from midline)
I - Incisal (cutting edge for front teeth)
```

### APIs Used
```
GET /patients/{id}
PATCH /patients/{id}/dental-records
PATCH /patients/{id}/periodontal-records
PATCH /patients/{id}/occlusal-records
PATCH /patients/{id}/soft-tissue-records
POST /patients/{id}/orthodontic-records
POST /patients/{id}/endodontic-records
POST /patients/{id}/restorative-records
```

### User Roles Access
- ✅ Admin
- ✅ Doctor
- ✅ Dentist
- ❌ Others (view only)

### Chart Navigation
```
Select Patient → Choose Chart Type → Select Tooth → 
Edit Findings → Save Record → Continue or Exit
```

---

## 5. CLIENTS

### Purpose
Laboratory and external vendor management

### Module Path
`src/app/(dashboard)/clients`

### Key Features
- Client directory
- Contact information management
- Order history per client
- Create/edit client
- Client status tracking
- Bulk operations

### Client Information
```typescript
interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  contactPerson: string;
  status: 'Active' | 'Inactive';
  orderCount?: number;
  averageDeliveryTime?: number;
  notes?: string;
}
```

### APIs Used
```
GET /clients
POST /clients
PUT /clients/{id}
DELETE /clients/{id}

Related:
GET /management/lab-orders?client_id={clientId}
```

### Client Management Tasks
- Add new lab/vendor
- Update contact info
- View order history
- Manage payments
- Track performance (delivery time)
- Communication history

### Validations
- Email format
- Phone format
- Unique email per client
- Required fields: name, email, phone

### User Roles Access
- ✅ Admin
- ✅ Manager
- ✅ Lab Coordinator
- ❌ Others

---

## 6. EMPLOYEES

### Purpose
Employee information and performance management

### Module Path
`src/app/(dashboard)/employees`

### Sub-Pages
- `/employees` - Employee list
- `/employees/{id}` - Employee detail & payroll

### Key Features

#### Employee Information
- Personal details
- Contact information
- Role & position
- Hire date
- Salary information
- Status (Active/Inactive/Terminated)
- Department/Branch assignment

#### Employee Detail Page
- Full profile
- Employment history
- Payroll records
- Attendance summary
- Leave balance
- Performance notes
- Edit profile

### Employee Data Model
```typescript
interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  status: 'Active' | 'Inactive' | 'Terminated';
  salary: number;
  hireDate: string;
  gender?: string;
  branchId: string;
  branch?: Branch;
}
```

### APIs Used
```
GET /employees?branch_id={branchId}
GET /employees/{id}
POST /employees
PATCH /employees/{id}
DELETE /employees/{id}
POST /employees/{id}/resend-password
GET /doctors?branch_id={branchId}

Related:
GET /management/payrolls?employee_id={employeeId}
GET /management/attendance?employee_id={employeeId}
GET /management/get-leave-requests?employee_id={employeeId}
```

### Employee Roles
- Doctor
- Dentist
- Receptionist
- Nurse
- Assistant
- Accountant
- Manager
- Admin

### Status Management
```
Active → Leave → Active
Active → Terminated (irreversible)
Inactive → Active
```

### User Roles Access
- ✅ Admin
- ✅ Manager
- ✅ HR Staff
- ❌ Others (view only)

### Reports
- Employee directory
- Salary breakdown
- Leave balance report
- Payroll summary

---

## 7. HRM (Human Resource Management)

### Purpose
Comprehensive HR operations and staff management

### Module Path
`src/app/(dashboard)/hrm`

### Sub-Modules

#### 7.1 STAFF (/hrm/staff)
- Staff directory
- Staff detail pages
- Position management
- Department assignment

#### 7.2 ATTENDANCE (/hrm/attendance)
**Features:**
- Mark attendance daily
- Attendance calendar
- Bulk attendance entry
- Attendance report
- Summary statistics
- Attendance pattern analysis

**Status Options:**
- Present
- Absent
- Leave
- Late
- Half Day

**APIs:**
```
GET /management/attendance?branch_id={branchId}&date={date}
POST /management/attendance
PATCH /management/attendance/{id}
```

#### 7.3 LEAVE (/hrm/leave)
**Features:**
- Leave request management
- Leave balance tracking
- Approval workflow
- Leave history
- Leave type management
- Carryover tracking

**Leave Types:**
- Vacation
- Sick Leave
- Personal Leave
- Unpaid Leave
- Maternity/Paternity
- Other

**Workflow:**
```
Request (Pending) → Approved/Rejected → History
```

**APIs:**
```
GET /management/get-leave-requests?branch_id={branchId}
POST /management/leave-requests
PATCH /management/leave-requests/{id}
```

#### 7.4 PAYROLL (/hrm/payroll)
**Features:**
- Monthly payroll processing
- Salary calculation
- Deduction management
- Tax calculation
- Bonus tracking
- Payslip generation
- Payment status tracking

**Payroll Workflow:**
```
Calculate → Review → Approve → Pay → Distribute Payslips
```

**Calculations:**
```
Gross Pay = Base Salary + Bonuses
Deductions = Tax + Insurance + Other
Net Pay = Gross Pay - Deductions
```

**APIs:**
```
GET /management/payrolls?branch_id={branchId}
POST /management/payrolls
PATCH /management/payrolls/{id}
GET /employees/{id}
```

#### 7.5 STAFF ADVANCES (/hrm/staff-advances)
**Features:**
- Salary advance requests
- Advance approval
- Deduction tracking
- Advance history
- Amount validation

**Validations:**
- Advance <= Monthly salary
- One advance per month
- Repayment tracking

**APIs:**
```
GET /management/staff-advances?branch_id={branchId}
POST /management/staff-advances
PATCH /management/staff-advances/{id}
```

#### 7.6 STAFF SALARIES (/hrm/staff-salaries)
**Features:**
- Salary structure management
- Salary increment history
- Salary comparison
- Benefits configuration
- Tax settings

**APIs:**
```
GET /employees
PATCH /employees/{id}
POST /management/salary-structures
```

#### 7.7 STAFF POSITIONS (/hrm/staff-position)
**Features:**
- Position catalog
- Department management
- Vacancy tracking
- Salary grades
- Position descriptions

### Overall HR Data Model
```typescript
interface HRData {
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  payrolls: Payroll[];
  staffAdvances: StaffAdvance[];
  positions: Position[];
}
```

### User Roles Access
- ✅ Admin
- ✅ HR Manager
- ✅ Payroll Officer
- ✅ Manager
- ❌ Others

### Best Practices
1. Maintain payroll confidentiality
2. Document all changes
3. Regular payroll audits
4. Leave balance validation
5. Salary advance limits

---

## 8. INSURANCE

### Purpose
Insurance plan and patient coverage management

### Module Path
`src/app/(dashboard)/insurance`

### Key Features
- Insurance plans listing
- Patient insurance assignment
- Coverage verification
- Claim status tracking
- Payment reconciliation
- Coverage calculation
- Insurance reports

### Insurance Data Model
```typescript
interface Insurance {
  id: string;
  patientId: string;
  planName: string;
  providerId: string;
  groupNumber?: string;
  memberId: string;
  coverage: number; // percentage
  deductible: number;
  copay: number;
  maxBenefit: number;
  startDate: string;
  endDate?: string;
  status: 'Active' | 'Expired' | 'Inactive';
}
```

### Coverage Calculation
```
Procedure Cost = 500
Insurance Coverage = 80%
Insurance Pays = 500 * 0.8 = 400
Patient Pays = 500 * 0.2 = 100

(After deductible & copay adjustments)
```

### APIs Used
```
GET /insurance-plans
GET /patients/{id}/insurance
POST /patients/{id}/insurance
PATCH /patients/{id}/insurance/{id}

Related:
GET /invoices (insurance breakdown)
GET /patients/{id}/invoices
```

### Claims Workflow
```
Create Claim → Submit → Insurance Review → Approved/Denied → Payment
```

### User Roles Access
- ✅ Admin
- ✅ Manager
- ✅ Billing Staff
- ❌ Others

### Validations
- Coverage <= 100%
- Plan must be active
- Date validations
- Member ID required

---

## 9. INSURANCE SETUP

### Purpose
Configure insurance plans and settings

### Module Path
`src/app/(dashboard)/insurance-setup`

### Key Features
- Create insurance plans
- Set coverage percentages
- Configure deductibles
- Co-pay settings
- Network management
- Plan templates
- Bulk import plans

### Insurance Plan Configuration
```typescript
interface InsurancePlan {
  id: string;
  name: string;
  provider: string;
  coverage: number; // %
  deductible: number;
  copay: number;
  maxBenefit: number;
  procedureCategories: {
    preventive: number;
    basic: number;
    major: number;
  };
  status: 'Active' | 'Inactive';
}
```

### Procedure Categories
- **Preventive** (100% coverage)
  - Cleanings
  - X-rays
  - Exams
  
- **Basic** (70-80% coverage)
  - Fillings
  - Extractions
  - Scaling
  
- **Major** (50-60% coverage)
  - Crowns
  - Implants
  - Bridges
  - Root canals

### APIs Used
```
POST /insurance-plans
PATCH /insurance-plans/{id}
GET /insurance-plans
DELETE /insurance-plans/{id}
POST /insurance-plans/bulk-import
```

### User Roles Access
- ✅ Admin Only
- ✅ Finance Manager

### Best Practices
1. Review plans quarterly
2. Update deductibles annually
3. Maintain network list
4. Document changes
5. Backup plan configs

---

## 10. INVENTORY

### Purpose
Dental materials and supplies management

### Module Path
`src/app/(dashboard)/inventory`

### Key Features

#### Inventory Management
- Stock level tracking
- Low stock alerts
- Supplier management
- Price tracking
- Reorder level configuration
- Stock movement log
- Usage statistics
- Expiration tracking

#### Item Information
```typescript
interface InventoryItem {
  id: string;
  name: string;
  supplier: string;
  stock: number;
  reorderLevel: number;
  reorderQuantity?: number;
  price: number;
  unit: string;
  status: 'Available' | 'Discontinued' | 'Discontinued';
  branchId: string;
  lastRestocked?: string;
  expiryDate?: string;
}
```

#### Stock Alerts
- Low stock: stock < reorderLevel
- Out of stock: stock = 0
- Overstock: stock > 2x reorderLevel
- Expiring soon: expiry date within 30 days
- Expired: expiry date < today

### APIs Used
```
GET /management/inventory?branch_id={branchId}&page={page}
POST /management/inventory
PATCH /management/inventory/{id}
DELETE /management/inventory/{id}
```

### Inventory Operations
1. **Receive Stock**
   - Receive from supplier
   - Verify quantity
   - Check expiry dates
   - Update stock levels

2. **Issue Stock**
   - Track usage per patient/procedure
   - Update stock levels
   - Cost allocation

3. **Adjustment**
   - Damage/Loss reporting
   - Count adjustments
   - Physical audit

4. **Reorder**
   - Automatic reorder points
   - Purchase order generation
   - Supplier tracking

### Categories
- Restorative Materials
- Endodontic Materials
- Orthodontic Materials
- Impression Materials
- Disinfectants
- Instruments
- Consumables
- Equipment

### Validations
- Stock >= 0
- Price > 0
- Reorder level > 0
- Supplier exists

### User Roles Access
- ✅ Admin
- ✅ Inventory Manager
- ✅ Manager
- ❌ Others

### Reports
- Stock Value Report
- Low Stock Report
- Usage Report
- Supplier Performance
- Cost Analysis

---

## 11. LABORATORY

### Purpose
External laboratory order management

### Module Path
`src/app/(dashboard)/laboratory`

### Key Features

#### Lab Order Management
- Create lab orders
- Track order status
- Client assignment
- Item specification
- Due date tracking
- Status updates
- Order history

#### Order Information
```typescript
interface LabOrder {
  id: string;
  clientId: string;
  patientName: string;
  tooth: string;
  item: string; // Crown, Bridge, Denture, etc.
  notes?: string;
  sentDate: string;
  dueDate: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  branchId: string;
  doctor?: Doctor;
  client?: Client;
  cost?: number;
}
```

#### Order Workflow
```
Create (Pending) → Send (In Progress) → Receive (Completed) → Archive
```

#### Lab Items
- Crowns (Ceramic, Gold, Zirconia)
- Bridges (3+ units)
- Dentures (Complete, Partial)
- Veneers
- Inlays/Onlays
- Implant Crowns
- Aligners (Ortho)
- Custom trays
- Relines

### APIs Used
```
GET /management/lab-orders?branch_id={branchId}&status={status}
POST /management/lab-orders
PATCH /management/lab-orders/{id}
PATCH /management/lab-orders/{id}/status
GET /clients
```

### Status Tracking
- **Pending** - Order created, not sent
- **In Progress** - Sent to lab, awaiting completion
- **Completed** - Lab finished, ready to receive
- **Cancelled** - Order cancelled

### Timeline Management
- Send date: When order goes to lab
- Due date: When item should return
- Overdue alert: If due date passed
- Days remaining: Due date - today

### User Roles Access
- ✅ Admin
- ✅ Manager
- ✅ Doctor
- ✅ Lab Coordinator
- ❌ Others (view only)

### Reports
- Order History
- Lab Performance
- Turnaround Times
- Delivery Accuracy
- Cost Analysis

---

## 12. PATIENTS

### Purpose
Core patient management and records

### Module Path
`src/app/(dashboard)/patients`

### Sub-Pages
- `/patients` - Patient list
- `/patients/new` - Create patient
- `/patients/{id}` - Patient profile
- `/patients/{id}/charting` - Dental charting

### Key Features

#### Patient List
- Search functionality
- Filters (status, gender, branch)
- Pagination
- Quick actions (view, edit, delete)
- Bulk operations
- Export functionality

#### Patient Creation
- Personal information
- Contact details
- Demographics
- Medical history
- Emergency contact
- Guarantor information
- Photo upload

#### Patient Profile
- Complete demographics
- Medical/dental history
- Appointment history
- Treatment plans
- Invoices
- Imaging gallery
- Dental records
- Insurance information
- Communication preferences

### Patient Data Model
```typescript
interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  branchId: string;
  history?: string;
  avatar?: string;
  lastVisit?: string;
  nextVisit?: string;
  dentalRecords: DentalRecord[];
  treatmentPlans: Treatment[];
  imaging: PatientImage[];
  invoices: Invoice[];
  appointments: Appointment[];
}
```

### Patient Statuses
- **Active** - Current patient
- **Inactive** - No visits in 1 year
- **Suspended** - Payment issues or other concerns

### Dental Records Included
- Dental conditions per tooth
- Periodontal measurements
- Occlusal assessment
- Soft tissue findings
- Orthodontic records
- Endodontic records
- Restorative records
- Clinical images

### APIs Used
```
GET /patients?branch_id={branchId}&status={status}&page={page}
GET /patients/{id}
GET /patients-list
POST /patients
PATCH /patients/{id}
DELETE /patients/{id}
GET /patients/{id}/invoices
GET /appointments?patient_id={patientId}

Charting APIs:
PATCH /patients/{id}/dental-records
PATCH /patients/{id}/periodontal-records
POST /patients/{id}/orthodontic-records
POST /patients/{id}/endodontic-records
```

### Patient Validations
- Email format
- Phone format
- Date of birth not in future
- Required fields
- Unique patient per branch

### User Roles Access
- ✅ Admin
- ✅ Manager
- ✅ Doctor
- ✅ Receptionist
- ❌ Others (limited view)

### Reports
- Patient Demographics
- Patient by Status
- Patient by Gender
- Patient Age Distribution
- Patient Activity Report

---

## 13. PAYROLL

### Purpose
Payroll processing and payment management

### Module Path
`src/app/(dashboard)/payroll`

### Key Features

#### Payroll Management
- Monthly payroll view
- Employee salary list
- Salary calculations
- Deduction breakdown
- Tax management
- Approval workflow
- Payslip generation
- Payment tracking

#### Payroll Cycle
```
Month Start → Review Attendance → Calculate Salaries → 
Manager Review → Approval → Payment Processing → Distribute Payslips
```

#### Payroll Components
```
Gross Pay = Base Salary + Bonuses + Overtime
Deductions = Tax + Insurance + Advances + Other
Net Pay = Gross Pay - Deductions
```

### Payroll Data Model
```typescript
interface Payroll {
  id: string;
  employeeId: string;
  employeeName: string;
  payPeriod: string; // YYYY-MM
  baseSalary: number;
  bonuses: number;
  overtime: number;
  grossPay: number;
  taxDeduction: number;
  insurance: number;
  advances: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  payDate: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'Paid' | 'Rejected';
  approvalStatus: string;
  approvedBy?: string;
  paidDate?: string;
  branchId: string;
}
```

### Tax Calculation
```
Gross Pay = Base + Bonuses
Taxable = Gross Pay - Tax Exemption
Tax = Taxable * Tax Rate (typically 15%)
```

### Approval Workflow
```
Draft → Pending Review → Approved → Paid → Archived
```

### APIs Used
```
GET /management/payrolls?branch_id={branchId}
POST /management/payrolls
PATCH /management/payrolls/{id}
GET /employees/{id}
GET /management/attendance?employee_id={employeeId}
POST /management/payrolls/{id}/approve
POST /management/payrolls/{id}/process-payment
```

### Validations
- Net Pay = Gross Pay - Deductions
- All amounts >= 0
- Pay date not in future
- Employee must exist
- Branch must exist

### User Roles Access
- ✅ Admin
- ✅ HR Manager
- ✅ Payroll Officer
- ✅ Finance Manager
- ❌ Others

### Reports
- Payroll Summary
- Payslips
- Tax Report
- Deduction Report
- Salary Analysis

---

## 14. PHARMACY

### Purpose
Medicine and prescription management

### Module Path
`src/app/(dashboard)/pharmacy`

### Key Features
- Medicine inventory
- Prescription management
- Dosage information
- Expiry tracking
- Supplier management
- Prescription history
- Medicine allergies tracking
- Drug interactions check

### Medicine Data Model
```typescript
interface Medicine {
  id: string;
  name: string;
  activeIngredient: string;
  category: string;
  dosageForm: string; // Tablet, Capsule, Liquid, etc.
  strength: string; // 500mg, 10ml, etc.
  manufacturer: string;
  stock: number;
  reorderLevel: number;
  price: number;
  expiryDate: string;
  supplier: string;
  status: 'Available' | 'Discontinued' | 'Out of Stock';
}
```

### Prescription Model
```typescript
interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  medicines: PrescriptionItem[];
  instructions: string;
  refillCount: number;
  expiryDate: string;
  status: 'Active' | 'Completed' | 'Expired';
}
```

### APIs Used
```
GET /medicines
GET /prescriptions?patient_id={patientId}
POST /prescriptions
PATCH /prescriptions/{id}
GET /medicines?search={name}
POST /medicines
PATCH /medicines/{id}
```

### Prescription Workflow
```
Write Rx → Patient Receives → Patient takes medicine → 
Refill if needed → Archive after expiry
```

### Allergies Management
- Track drug allergies
- Drug interaction checking
- Alert on prescription creation
- Patient allergy history

### User Roles Access
- ✅ Admin
- ✅ Doctor
- ✅ Nurse
- ✅ Pharmacy Staff
- ❌ Others

---

## 15. PRINTER TEST

### Purpose
Printer connectivity and configuration testing

### Module Path
`src/app/(dashboard)/printer-test`

### Key Features
- Printer detection
- Test print functionality
- Receipt format preview
- Configuration testing
- Thermal printer settings
- Connection status

### Supported Printers
- Thermal Printers (ESC/POS)
- Desktop Printers
- Network Printers
- Bluetooth Printers (Mobile)
- Windows Printers

### Test Operations
1. **Detect Printers** - Find available printers
2. **Test Print** - Print test page
3. **Print Receipt** - Test receipt format
4. **Print Labels** - Test label printing
5. **Configure** - Adjust printer settings

### Print Templates
- Receipt template
- Invoice template
- Lab order template
- Appointment card template
- Patient reminder template

### User Roles Access
- ✅ Admin Only
- ✅ System Administrator

---

## 16. PROFILE

### Purpose
User profile and account settings

### Module Path
`src/app/(dashboard)/profile`

### Key Features
- Profile information
- Avatar upload
- Change password
- Notification preferences
- Activity log
- Session management
- Two-factor authentication
- Login history

### Profile Information
```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  branch?: string;
  department?: string;
  lastLogin?: string;
  loginCount?: number;
}
```

### Security Features
- Password strength requirements
  - Min 8 characters
  - Uppercase letter
  - Lowercase letter
  - Number
  - Special character

- Two-Factor Authentication
  - Email OTP
  - SMS OTP
  - Google Authenticator

- Session Management
  - View active sessions
  - Logout other sessions
  - Session timeout settings

### APIs Used
```
GET /profile
PATCH /profile
POST /profile/change-password
GET /profile/activity-logs
GET /profile/sessions
POST /profile/logout-all-sessions
POST /profile/enable-2fa
```

### Activity Log
- Login/logout events
- Password changes
- Profile updates
- Actions performed
- Timestamp for each event

### User Roles Access
- ✅ All authenticated users

---

## 17. QUEUE

### Purpose
Patient queue management for daily operations

### Module Path
`src/app/(dashboard)/queue`

### Key Features
- Today's appointments
- Token system
- Waiting area display
- Call next button
- Status updates
- Estimated wait time
- Queue statistics

### Queue Operations
1. **Check-in** - Patient arrives
2. **Waiting** - Waiting to be called
3. **Called** - Doctor/Staff called patient
4. **In Treatment** - Currently being treated
5. **Completed** - Treatment finished
6. **Checkout** - Payment processed

### Queue Display
```typescript
interface QueueEntry {
  token: string;
  patientName: string;
  appointmentTime: string;
  doctor: string;
  treatment: string;
  status: 'Waiting' | 'Called' | 'In Treatment' | 'Completed';
  waitTime: number; // in minutes
  tokenNumber: number; // A001, B001, etc.
}
```

### APIs Used
```
GET /appointments?date={today}&status=Scheduled
PATCH /appointments/{id}
GET /dashboard-summary (for queue stats)
```

### Queue Features
- Real-time updates
- Priority patients (VIP, emergency)
- Estimated wait time
- Call notifications
- Queue statistics
- Performance tracking

### User Roles Access
- ✅ Admin
- ✅ Manager
- ✅ Receptionist
- ✅ Doctor (view only)

---

## 18. REPORTS

### Purpose
Comprehensive business analytics and reporting

### Module Path
`src/app/(dashboard)/reports`

### Key Features

#### Report Types

**Financial Reports:**
- Revenue report
- Expense breakdown
- Net profit analysis
- Tax report
- Outstanding receivables
- Payment analysis

**Patient Reports:**
- Patient demographics
- Patient by status
- Gender distribution
- Age distribution
- Patient acquisition
- Patient retention

**Clinical Reports:**
- Procedure frequency
- Treatment outcomes
- Procedure cost analysis
- Doctor productivity
- Case complexity analysis

**Operational Reports:**
- Appointment statistics
- Doctor schedule utilization
- Chair utilization
- Staff productivity
- Inventory status
- Equipment maintenance log

**Insurance Reports:**
- Insurance claims processed
- Claim approval rate
- Insurance vs patient payment
- Coverage analysis

### Report Data Model
```typescript
interface ReportData {
  categories: string[];
  financialSummary: FinancialSummary;
  appointmentSummary: AppointmentSummary;
  patientSummary: PatientSummary;
  clinicalMetrics: ClinicalMetrics;
}
```

### Report Features
- Date range selection
- Filter by branch/doctor/patient
- Multiple chart types
- Data export (PDF, Excel, CSV)
- Scheduled reports
- Report history
- Comparison analysis
- Trend analysis

### APIs Used
```
GET /reports/overview?branch_id={branchId}&start_date={from}&end_date={to}
GET /financial-summary?branch_id={branchId}
GET /practice-trends?branch_id={branchId}
GET /invoices?branch_id={branchId}
GET /appointments?branch_id={branchId}
GET /patients?branch_id={branchId}
```

### Chart Types
- Bar charts
- Line charts
- Pie charts
- Area charts
- Heatmaps
- Tables

### User Roles Access
- ✅ Admin
- ✅ Manager
- ✅ Finance Manager
- ✅ Doctor (limited)
- ❌ Others

### Export Formats
- PDF (printable)
- Excel (.xlsx)
- CSV (data import)
- Images (.png, .jpg)

---

## 19. SETTINGS

### Purpose
System configuration and administration

### Module Path
`src/app/(dashboard)/settings`

### Sub-Sections

#### 19.1 BRANCH SETTINGS
- Business information
- Address
- Contact details
- Operating hours
- Holiday calendar
- Currency settings

#### 19.2 TREATMENTS CATALOG
- Procedure list management
- Cost configuration
- Category management
- Procedure codes
- Description

#### 19.3 BUSINESS INFORMATION
- Practice name
- Logo
- Contact information
- License information
- Tax ID
- Insurance details

#### 19.4 TAX CONFIGURATION
- Tax rate
- Tax ID
- Tax calculation method
- Tax exemptions
- Invoice footer text

#### 19.5 NOTIFICATION SETTINGS
- Email notifications
- SMS notifications
- Appointment reminders
- Payment reminders
- System alerts
- Newsletter settings

#### 19.6 ROLES & PERMISSIONS
- Role management
- Permission assignment
- Module access control
- Feature flags

#### 19.7 API SETTINGS
- API keys
- Webhook configuration
- Rate limiting
- Access logs

### Settings Data Model
```typescript
interface SystemSettings {
  branch: BranchSettings;
  business: BusinessSettings;
  tax: TaxSettings;
  notifications: NotificationSettings;
  roles: RoleSettings;
  api: APISettings;
}
```

### APIs Used
```
GET /settings/roles
POST /settings/roles
PATCH /settings/roles/{id}
GET /procedures
POST /procedures
PATCH /procedures/{id}
DELETE /procedures/{id}
GET /branches
PATCH /branches/{id}
```

### Configuration Areas
- Treatment procedures
- Insurance plans
- Tax rates
- User roles
- Notification templates
- Email settings
- SMS settings
- Appointment duration
- Working hours
- Holidays

### User Roles Access
- ✅ Admin Only

### Best Practices
1. Backup settings regularly
2. Document all changes
3. Test changes in staging
4. Version control configs
5. Audit trail for changes

---

## 20. APPOINTMENTS

### Purpose
Complete appointment scheduling and management

### Module Path
`src/app/(dashboard)/appointments`

### Key Features

#### Appointment Management
- Schedule appointments
- View calendar
- Reschedule appointments
- Cancel appointments
- Send reminders
- No-show tracking
- Wait list management

#### Appointment Information
```typescript
interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM AM/PM
  treatment: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'No-Show';
  branchId: string;
  tokenNumber: string;
  notes?: string;
  duration?: number; // in minutes
}
```

#### Appointment Lifecycle
```
Scheduled → Completed (or Cancelled/No-Show) → Archived
```

#### Calendar Views
- Day view
- Week view
- Month view
- Doctor view
- Patient view
- Room view

### APIs Used
```
GET /appointments?branch_id={branchId}&date={date}&status={status}
POST /appointments
PATCH /appointments/{id}
DELETE /appointments/{id}
GET /doctors?branch_id={branchId}
GET /patients-list
```

### Appointment Validations
- Future date required
- Doctor must be available
- Patient must exist
- No double booking
- Clinic open (check hours)
- Not on holiday
- Time slot available

### Reminders
- 24 hours before
- 1 hour before
- Email/SMS reminders
- Automatic reminder system

### No-Show Management
- Track no-shows
- Patient patterns
- Overbooking adjustment
- Cancellation policy

### User Roles Access
- ✅ Admin
- ✅ Manager
- ✅ Receptionist
- ✅ Doctor (view own appointments)

### Reports
- Appointment summary
- Doctor schedule
- No-show report
- Booking patterns
- Peak hours analysis

---

# Cross-Module Features

## Authentication & Authorization
All modules use:
- Bearer token authentication
- Role-based access control
- Branch-level permissions
- Module-level access

## Data Validation
- Input validation on all forms
- Server-side validation
- Email/phone format validation
- Date range validation
- Amount validation
- Required field validation

## Error Handling
- 401: Re-authenticate
- 403: Permission denied
- 404: Not found
- 422: Validation error
- 500: Server error with retry

## Caching Strategy
- Dashboard: 5 min TTL
- Patient list: 10 min TTL
- Static data (branches, procedures): 30 min TTL
- Billing: No cache (real-time)
- Inventory: 5 min TTL

## Performance Optimization
- Pagination (default 20 items)
- Lazy loading
- Image optimization
- API request batching
- Client-side filtering
- Debounced search

## Audit & Logging
- All CRUD operations logged
- User actions tracked
- Change history maintained
- Activity log viewing
- Export audit trail

## Multi-Tenancy Support
- Branch filtering on all queries
- Cross-branch data isolation
- Branch-specific configuration
- Branch-level reporting
- Independent inventory per branch

---

# Common Module Patterns

## List Page Pattern
```
GET data → Display table → Add filters → Implement pagination → 
Add bulk actions → Export option
```

## Detail Page Pattern
```
GET single item → Display form → Edit fields → Validate → Save → 
Show confirmation → Update list
```

## Creation Page Pattern
```
Show form → Collect data → Validate client-side → POST → 
Handle errors → Show success → Redirect
```

## Workflow Pattern
```
Define states → Implement transitions → Restrict invalid transitions → 
Log state changes → Generate reports
```

---

# Module Statistics

| Category | Count |
|----------|-------|
| Core Modules | 20 |
| Sub-modules (HRM) | 7 |
| Total API Endpoints | 70+ |
| Total Pages | 30+ |
| User Roles | 8+ |
| Report Types | 10+ |

---

**Complete modules coverage for CHART DENTAL - Last Updated: 2026-08-19**
