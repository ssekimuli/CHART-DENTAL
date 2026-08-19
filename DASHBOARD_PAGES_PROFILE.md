# CHART DENTAL - DASHBOARD PAGES PROFILE

Complete overview of all dashboard pages, their purpose, features, and API usage.

---

## Dashboard Structure Overview

```
src/app/(dashboard)/
├── layout.tsx                          # Main dashboard layout
├── dashboard/page.tsx                  # Main dashboard/home
├── patients/                           # Patient management
│   ├── page.tsx                       # Patients list
│   ├── new/page.tsx                   # Create new patient
│   └── [id]/                          # Patient detail pages
│       ├── page.tsx                   # Patient profile
│       ├── charting/page.tsx          # Dental charting
│       └── charting/[path]/           # Specific chart types
├── appointments/page.tsx               # Appointments management
├── billing/                            # Invoicing & payments
│   ├── page.tsx                       # Invoices list
│   ├── new/page.tsx                   # Create invoice
│   └── [id]/page.tsx                  # Invoice detail
├── employees/                          # Employee management
│   ├── page.tsx                       # Employees list
│   └── [id]/page.tsx                  # Employee detail
├── hrm/                                # HR Management
│   ├── staff/page.tsx                 # Staff list
│   ├── staff/[id]/page.tsx            # Staff detail
│   ├── attendance/page.tsx            # Attendance tracking
│   ├── leave/page.tsx                 # Leave requests
│   ├── payroll/page.tsx               # Payroll management
│   ├── staff-advances/page.tsx        # Salary advances
│   ├── staff-salaries/page.tsx        # Salary configuration
│   └── staff-position/page.tsx        # Positions & roles
├── inventory/page.tsx                  # Inventory management
├── laboratory/page.tsx                 # Lab orders
├── charting/page.tsx                  # Shared charting area
├── accounting/page.tsx                # Accounting & expenses
├── reports/page.tsx                    # Reports & analytics
├── profile/page.tsx                    # User profile
├── settings/page.tsx                   # System settings
├── branches/page.tsx                   # Branch management
├── clients/page.tsx                    # Laboratory clients
├── insurance/page.tsx                  # Insurance management
├── insurance-setup/page.tsx            # Insurance configuration
├── queue/page.tsx                      # Patient queue
├── activity-logs/page.tsx              # Activity logs
├── admin/migration/page.tsx            # Admin migration tools
├── pharmacy/page.tsx                   # Pharmacy management
├── payroll/page.tsx                    # Payroll (alt location)
├── printer-test/page.tsx               # Printer testing
└── (auth)/                             # Authentication pages
    ├── login/page.tsx
    ├── forgot-password/page.tsx
    ├── reset-password/page.tsx
    └── verify-otp/page.tsx
```

---

## Core Dashboard Pages

### 1. Dashboard / Home Page
**Path:** `src/app/(dashboard)/dashboard/page.tsx`

**Purpose:** Main dashboard showing KPIs and quick overview

**Features:**
- Total revenue display
- Active patients count
- Appointments last 30 days
- New patients last 30 days
- Practice overview text
- Upcoming appointments widget
- Recent patients widget

**API Endpoints Used:**
```
GET /dashboard-summary?branch_id={branchId}
GET /practice-trends?branch_id={branchId}
```

**Key State:**
- `branchId` - Current branch
- `summary` - Dashboard KPI data
- `trends` - Revenue/appointment trends

**Components:**
- KPI Cards
- Charts (Revenue, Appointments)
- Upcoming Appointments List
- Recent Patients Card

---

### 2. Patients Management

#### 2.1 Patients List
**Path:** `src/app/(dashboard)/patients/page.tsx`

**Purpose:** View and manage all patients in branch

**Features:**
- Table with pagination
- Filters: Status, Gender, Branch
- Search functionality
- Create new patient button
- View patient profile link

**API Endpoints Used:**
```
GET /patients?branch_id={branchId}&status={status}&gender={gender}&page={page}&per_page={perPage}
GET /patients-list
```

**Key State:**
- `patients` - List of patients
- `filters` - Applied filters
- `pagination` - Page & per_page
- `branchId` - Current branch

**Components:**
- PatientTable
- FilterBar
- PaginationControls
- CreatePatientButton

---

#### 2.2 Create Patient
**Path:** `src/app/(dashboard)/patients/new/page.tsx`

**Purpose:** Add new patient to system

**Features:**
- Form with validation
- Fields: Name, Email, Phone, Address, DOB, Gender
- Branch selection
- Status selection (Active/Inactive)

**API Endpoints Used:**
```
POST /patients
{
  first_name,
  last_name,
  email,
  phone,
  address,
  gender,
  date_of_birth,
  branch_id,
  status
}
```

**Validation:**
- Email format
- Phone format
- Date of birth (not future)
- Required fields

**Components:**
- PatientForm
- FormInputs
- SubmitButton

---

#### 2.3 Patient Profile
**Path:** `src/app/(dashboard)/patients/[id]/page.tsx`

**Purpose:** View complete patient profile and history

**Features:**
- Patient demographics
- Contact information
- Appointment history
- Treatment plans
- Insurance information
- Medical history
- Imaging gallery
- Recent invoices

**API Endpoints Used:**
```
GET /patients/{id}
GET /patients/{id}/invoices
GET /appointments?patient_id={id}
```

**Key State:**
- `patient` - Full patient data
- `invoices` - Patient invoices
- `appointments` - Patient appointments
- `selectedTab` - Active tab

**Components:**
- PatientHeader
- DemographicsCard
- AppointmentHistory
- TreatmentPlans
- InvoicesList
- ImageGallery
- EditPatientModal

---

#### 2.4 Dental Charting
**Path:** `src/app/(dashboard)/patients/[id]/charting/page.tsx`

**Purpose:** Dental examination and record charting

**Features:**
- Interactive tooth model (3D/2D)
- Tooth condition marking
- Periodontal charting
- Soft tissue assessment
- Treatment notes
- Image attachments

**API Endpoints Used:**
```
GET /patients/{id}
PATCH /patients/{id}/dental-records
PATCH /patients/{id}/periodontal-records
POST /patients/{id}/soft-tissue-records
```

**Record Types:**
1. **Dental Records** - Tooth conditions
2. **Periodontal** - Pocket depths, recession, mobility
3. **Occlusal** - Bite assessment
4. **Soft Tissue** - Gingiva health
5. **Orthodontic** - Appliance & alignment
6. **Endodontic** - Root canal info
7. **Restorative** - Filling/restoration info

**Components:**
- ToothModel (3D/2D)
- ChartingEditor
- RecordForm
- NotesInput
- ImageUpload

---

#### 2.5 Chart Type Pages
**Paths:** 
- `orthodontic/new/page.tsx` - Create orthodontic record
- `orthodontic/[recordId]/page.tsx` - Edit orthodontic record
- `tooth/[toothId]/page.tsx` - Single tooth detail
- Other chart types similarly organized

**Purpose:** Specialized charting for specific procedures

**API Endpoints Used:**
```
POST /patients/{id}/orthodontic-records
PATCH /patients/{id}/orthodontic-records/{recordId}
GET /patients/{id}/orthodontic-records/{recordId}
```

---

## Appointment Management

### 3. Appointments
**Path:** `src/app/(dashboard)/appointments/page.tsx`

**Purpose:** Schedule and manage appointments

**Features:**
- Calendar view
- Appointment list/grid
- Filters: Doctor, Patient, Status, Date
- Create new appointment
- Reschedule appointment
- Cancel appointment
- Send reminders

**API Endpoints Used:**
```
GET /appointments?patient_id={patientId}&doctor_id={doctorId}&branch_id={branchId}&status={status}&date={date}&page={page}
POST /appointments
PATCH /appointments/{id}
DELETE /appointments/{id}
GET /doctors?branch_id={branchId}
```

**Key State:**
- `appointments` - List of appointments
- `filters` - Applied filters
- `selectedDate` - Current date view
- `doctors` - Available doctors
- `branchId` - Current branch

**Components:**
- CalendarView
- AppointmentList
- AppointmentForm
- FilterBar
- DoctorSelector
- TimeSlotPicker

---

## Billing & Invoicing

### 4.1 Invoices List
**Path:** `src/app/(dashboard)/billing/page.tsx`

**Purpose:** View and manage invoices

**Features:**
- Invoice list with table
- Filters: Status, Branch, Date range
- Search by patient/invoice ID
- Status badges (Draft, Issued, Paid, Overdue)
- Quick actions: View, Edit, Print, Delete
- Batch actions

**API Endpoints Used:**
```
GET /invoices?branch_id={branchId}&status={status}&page={page}&per_page={perPage}
GET /invoices?search={searchQuery}
```

**Components:**
- InvoiceTable
- FilterBar
- StatusBadge
- ActionMenu

---

### 4.2 Create Invoice
**Path:** `src/app/(dashboard)/billing/new/page.tsx`

**Purpose:** Create new invoice for patient

**Features:**
- Patient selection
- Treatment/procedure selection
- Add line items
- Calculate totals
- Insurance coverage input
- Discount application
- Tax calculation
- Payment method selection

**API Endpoints Used:**
```
GET /patients-list
GET /procedures
POST /invoices
{
  patient_id,
  treatments: [{ procedure_id, quantity, cost }],
  other_charges: [{ description, amount }],
  discount,
  tax,
  insurance_coverage,
  status: 'Issued'
}
```

**Components:**
- PatientSelector
- TreatmentLineItems
- PricingCalculator
- TaxCalculator
- InsuranceForm

---

### 4.3 Invoice Detail
**Path:** `src/app/(dashboard)/billing/[id]/page.tsx`

**Purpose:** View and edit invoice

**Features:**
- Full invoice details
- Payment tracking
- Add payment
- Print invoice
- Download PDF
- Edit invoice (if unpaid)
- View payment history
- Email invoice

**API Endpoints Used:**
```
GET /invoices/{id}
POST /invoices/{id}/payments
PATCH /invoices/{id}
GET /invoices/{id}/payment-history
```

**Payment Flow:**
1. Display outstanding balance
2. Enter payment amount/method
3. Record transaction
4. Update invoice status
5. Send receipt

**Components:**
- InvoiceHeader
- LineItemsTable
- PaymentForm
- PaymentHistory
- PrintButton
- EmailButton

---

## Employee Management

### 5.1 Employees List
**Path:** `src/app/(dashboard)/employees/page.tsx`

**Purpose:** Manage all employees

**Features:**
- Employee table
- Filters: Role, Status, Branch
- Search by name/email
- Create new employee
- Bulk actions
- Status indicators

**API Endpoints Used:**
```
GET /employees?branch_id={branchId}
GET /doctors?branch_id={branchId}
```

**Components:**
- EmployeeTable
- FilterBar
- RoleFilter
- StatusBadge

---

### 5.2 Employee Detail
**Path:** `src/app/(dashboard)/employees/[id]/page.tsx`

**Purpose:** View employee profile and payroll

**Features:**
- Employee information
- Hire date, role, salary
- Payroll history
- Attendance summary
- Leave balance
- Performance stats
- Edit profile button

**API Endpoints Used:**
```
GET /employees/{id}
GET /management/payrolls?employee_id={employeeId}
GET /management/attendance?employee_id={employeeId}
GET /management/get-leave-requests?employee_id={employeeId}
```

**Components:**
- EmployeeHeader
- SalaryCard
- PayrollHistory
- AttendanceSummary
- LeaveBalance

---

## HR Management

### 6.1 Staff Management
**Path:** `src/app/(dashboard)/hrm/staff/page.tsx`

**Purpose:** HR staff directory

**Features:**
- Staff list
- Department filtering
- Search functionality
- Quick actions
- Hire/terminate employees
- Bulk email

**API Endpoints Used:**
```
GET /employees
POST /employees
PATCH /employees/{id}
DELETE /employees/{id}
```

---

### 6.2 Attendance Tracking
**Path:** `src/app/(dashboard)/hrm/attendance/page.tsx`

**Purpose:** Track employee attendance

**Features:**
- Attendance calendar
- Mark present/absent/leave
- Date filtering
- Attendance report
- Bulk attendance entry
- Summary stats

**API Endpoints Used:**
```
GET /management/attendance?branch_id={branchId}&date={date}
POST /management/attendance
PATCH /management/attendance/{id}
```

**Components:**
- AttendanceCalendar
- AttendanceForm
- SummaryStats

---

### 6.3 Leave Requests
**Path:** `src/app/(dashboard)/hrm/leave/page.tsx`

**Purpose:** Manage employee leave requests

**Features:**
- Leave request list
- Status filtering (Pending, Approved, Rejected)
- Approve/reject requests
- Leave type display
- Date range display
- Leave balance check

**API Endpoints Used:**
```
GET /management/get-leave-requests?branch_id={branchId}&status={status}
POST /management/leave-requests
PATCH /management/leave-requests/{id}
```

**Leave Types:**
- Vacation
- Sick Leave
- Personal
- Unpaid
- Other

---

### 6.4 Payroll Management
**Path:** `src/app/(dashboard)/hrm/payroll/page.tsx`

**Purpose:** Calculate and process payroll

**Features:**
- Monthly payroll view
- Employee salary list
- Deduction breakdown
- Tax calculation
- Approve payroll
- Generate payslips
- Payment tracking

**API Endpoints Used:**
```
GET /management/payrolls?branch_id={branchId}
POST /management/payrolls
PATCH /management/payrolls/{id}
GET /employees/{id}
```

**Payroll Calculation:**
- Base salary
- Bonuses
- Deductions (tax, insurance)
- Net pay calculation
- Status workflow (Draft → Approved → Paid)

---

### 6.5 Staff Advances
**Path:** `src/app/(dashboard)/hrm/staff-advances/page.tsx`

**Purpose:** Manage salary advance requests

**Features:**
- Advance request list
- Request approval workflow
- Amount validation
- Deduction tracking
- Request history

**API Endpoints Used:**
```
GET /management/staff-advances?branch_id={branchId}
POST /management/staff-advances
PATCH /management/staff-advances/{id}
```

---

### 6.6 Staff Salaries
**Path:** `src/app/(dashboard)/hrm/staff-salaries/page.tsx`

**Purpose:** Manage employee salaries

**Features:**
- Salary structure
- Salary increment history
- Tax information
- Benefits configuration
- Update salary
- Export to payroll

**API Endpoints Used:**
```
GET /employees
PATCH /employees/{id}
POST /management/salary-structures
```

---

### 6.7 Staff Positions
**Path:** `src/app/(dashboard)/hrm/staff-position/page.tsx`

**Purpose:** Manage job positions and roles

**Features:**
- Position list
- Department assignment
- Salary grade
- Vacancy tracking
- Bulk position management

**API Endpoints Used:**
```
GET /settings/roles
POST /settings/roles
PATCH /settings/roles/{id}
```

---

## Inventory Management

### 7. Inventory
**Path:** `src/app/(dashboard)/inventory/page.tsx`

**Purpose:** Track dental supplies and materials

**Features:**
- Inventory list
- Stock levels
- Reorder level alerts
- Supplier information
- Price tracking
- Low stock notifications
- Add/update items
- Stock movement log

**API Endpoints Used:**
```
GET /management/inventory?branch_id={branchId}&page={page}&per_page={perPage}
POST /management/inventory
PATCH /management/inventory/{id}
DELETE /management/inventory/{id}
```

**Components:**
- InventoryTable
- LowStockAlert
- SupplierInfo
- PriceHistory
- StockMovement

---

## Laboratory Management

### 8. Laboratory Orders
**Path:** `src/app/(dashboard)/laboratory/page.tsx`

**Purpose:** Manage laboratory orders for external labs

**Features:**
- Lab order list
- Order status tracking
- Client selection
- Item type specification
- Due date tracking
- Status update
- Send to lab
- Receive completed work

**API Endpoints Used:**
```
GET /management/lab-orders?branch_id={branchId}&status={status}
POST /management/lab-orders
PATCH /management/lab-orders/{id}/status
GET /clients
```

**Order Workflow:**
1. Create order (Pending)
2. Send to lab (In Progress)
3. Lab completes work
4. Mark as completed
5. Archive

**Components:**
- LabOrderTable
- StatusTimeline
- ClientSelector
- OrderForm

---

## Accounting & Expenses

### 9. Accounting
**Path:** `src/app/(dashboard)/accounting/page.tsx`

**Purpose:** Track expenses and operational costs

**Features:**
- Expense list
- Category breakdown
- Date filtering
- Amount ranges
- Add expense
- Expense categories
- Receipt attachment
- Approval workflow

**API Endpoints Used:**
```
GET /expense-records?branch_id={branchId}&category={category}&date_from={from}&date_to={to}
POST /expense-records
PATCH /expense-records/{id}
DELETE /expense-records/{id}
```

**Expense Categories:**
- Supplies
- Equipment
- Utilities
- Rent
- Insurance
- Maintenance
- Staff
- Other

**Components:**
- ExpenseTable
- ExpenseForm
- CategoryFilter
- DateRangeFilter

---

## Reports & Analytics

### 10. Reports
**Path:** `src/app/(dashboard)/reports/page.tsx`

**Purpose:** View comprehensive business reports

**Features:**
- Financial reports
- Patient statistics
- Appointment analytics
- Revenue trends
- Expense breakdown
- Tax reports
- Custom date ranges
- Export to PDF/Excel

**API Endpoints Used:**
```
GET /reports/overview?branch_id={branchId}&start_date={from}&end_date={to}
GET /financial-summary?branch_id={branchId}
GET /practice-trends?branch_id={branchId}
GET /patients?branch_id={branchId}
GET /appointments?branch_id={branchId}
```

**Report Types:**
1. Financial Report
2. Patient Demographics
3. Appointment Summary
4. Revenue by Procedure
5. Staff Performance
6. Inventory Usage

**Components:**
- ReportSelector
- DateRangePicker
- ChartDisplay
- ExportButton
- FilterPanel

---

## Settings & Configuration

### 11.1 Settings
**Path:** `src/app/(dashboard)/settings/page.tsx`

**Purpose:** System configuration and preferences

**Features:**
- Branch settings
- Treatment catalog
- Business information
- Tax configuration
- Email settings
- Notification preferences
- User permissions

**API Endpoints Used:**
```
GET /settings/roles
POST /settings/roles
PATCH /settings/roles
GET /procedures
POST /procedures
PATCH /procedures/{id}
```

**Tabs:**
1. Branch Settings
2. Treatments Catalog
3. Business Info
4. Tax Config
5. Notifications

---

### 11.2 User Profile
**Path:** `src/app/(dashboard)/profile/page.tsx`

**Purpose:** User profile management

**Features:**
- Profile information
- Avatar upload
- Change password
- Notification settings
- Activity log
- Session management
- Two-factor authentication

**API Endpoints Used:**
```
GET /profile
PATCH /profile
POST /profile/change-password
GET /profile/activity-logs
```

**Components:**
- ProfileHeader
- EditProfileForm
- PasswordChangeForm
- ActivityLog

---

## Branch & Multi-Location

### 12. Branches
**Path:** `src/app/(dashboard)/branches/page.tsx`

**Purpose:** Manage multiple branch locations

**Features:**
- Branch list
- Branch details
- Staff per branch
- Inventory per branch
- Branch-specific reports
- Create new branch
- Edit branch info

**API Endpoints Used:**
```
GET /all-branch
POST /businesses
GET /businesses
```

**Components:**
- BranchList
- BranchCard
- BranchForm
- StaffPerBranch

---

## Client Management

### 13. Clients
**Path:** `src/app/(dashboard)/clients/page.tsx`

**Purpose:** Manage laboratory clients and external vendors

**Features:**
- Client list
- Contact information
- Order history
- Payment terms
- Add/edit client
- Bulk email

**API Endpoints Used:**
```
GET /clients
POST /clients
PUT /clients/{id}
DELETE /clients/{id}
```

---

## Insurance Management

### 14.1 Insurance
**Path:** `src/app/(dashboard)/insurance/page.tsx`

**Purpose:** Insurance plan and claim management

**Features:**
- Insurance plans
- Patient insurance
- Claim tracking
- Coverage verification
- Payment reconciliation

**API Endpoints Used:**
```
GET /insurance-plans
GET /patients/{id}/insurance
POST /insurance-claims
```

---

### 14.2 Insurance Setup
**Path:** `src/app/(dashboard)/insurance-setup/page.tsx`

**Purpose:** Configure insurance settings

**Features:**
- Insurance plan creation
- Coverage details
- Deductible setup
- Co-pay configuration
- Network management

**Components:**
- InsurancePlanForm
- CoverageTable
- DeductibleInput

---

## Queue Management

### 15. Queue
**Path:** `src/app/(dashboard)/queue/page.tsx`

**Purpose:** Patient queue management for daily operations

**Features:**
- Today's appointments queue
- Token system
- Waiting area display
- Call next button
- Status updates
- Estimated wait time

**API Endpoints Used:**
```
GET /appointments?date={today}&status=Scheduled
PATCH /appointments/{id}
```

**Components:**
- QueueDisplay
- TokenCard
- CallNextButton
- WaitingList

---

## Activity Logs

### 16. Activity Logs
**Path:** `src/app/(dashboard)/activity-logs/page.tsx`

**Purpose:** Audit trail and activity logging

**Features:**
- User actions log
- Data changes log
- Date filtering
- User filtering
- Action type filtering
- Export audit log

**API Endpoints Used:**
```
GET /activity-logs
GET /activity-logs?user_id={userId}&action={action}&date_from={from}
```

---

## Admin Tools

### 17. Migration
**Path:** `src/app/(dashboard)/admin/migration/page.tsx`

**Purpose:** Database migration and maintenance

**Features:**
- Data migration tools
- Database backup
- Data import
- Troubleshooting

**API Endpoints Used:**
```
POST /admin/migrate
POST /admin/backup
POST /admin/import
```

---

## Pharmacy

### 18. Pharmacy
**Path:** `src/app/(dashboard)/pharmacy/page.tsx`

**Purpose:** Medicine and prescription management

**Features:**
- Medicine inventory
- Prescription tracking
- Dosage information
- Expiry tracking
- Supplier management

**API Endpoints Used:**
```
GET /medicines
GET /prescriptions
POST /prescriptions
```

---

## Payroll (Alternative)

### 19. Payroll
**Path:** `src/app/(dashboard)/payroll/page.tsx`

**Purpose:** Alternative payroll interface

**Features:**
- Similar to HRM/Payroll
- Monthly view
- Processing workflow

---

## Testing & Utilities

### 20. Printer Test
**Path:** `src/app/(dashboard)/printer-test/page.tsx`

**Purpose:** Test printer connectivity and setup

**Features:**
- Printer detection
- Test print
- Receipt preview
- Configuration test
- Thermal printer settings

---

## Charting (Shared)

### 21. Charting
**Path:** `src/app/(dashboard)/charting/page.tsx`

**Purpose:** Shared charting interface (alternative entry point)

**Features:**
- Patient selection for charting
- Quick charting access
- Recent patients

---

## Layout & Navigation

### Dashboard Layout
**Path:** `src/app/(dashboard)/layout.tsx`

**Contains:**
- Sidebar navigation
- Header/top bar
- User menu
- Branch selector
- Breadcrumb navigation
- Notification center

**Key Components:**
- Navigation menu
- ThemeToggle
- NotificationBell
- UserDropdown
- BranchSelector

---

## Page Summary Table

| Page | Path | Purpose | Key APIs |
|------|------|---------|----------|
| Dashboard | `/dashboard` | KPIs & overview | `/dashboard-summary`, `/practice-trends` |
| Patients | `/patients` | Patient list | `/patients` |
| New Patient | `/patients/new` | Create patient | `POST /patients` |
| Patient Profile | `/patients/{id}` | View patient | `GET /patients/{id}` |
| Charting | `/patients/{id}/charting` | Dental records | `PATCH /dental-records` |
| Appointments | `/appointments` | Schedule appointments | `/appointments`, `/doctors` |
| Billing | `/billing` | Invoices | `/invoices` |
| New Invoice | `/billing/new` | Create invoice | `POST /invoices` |
| Employees | `/employees` | Employee list | `/employees` |
| HR - Attendance | `/hrm/attendance` | Track attendance | `/management/attendance` |
| HR - Leave | `/hrm/leave` | Leave requests | `/management/get-leave-requests` |
| HR - Payroll | `/hrm/payroll` | Payroll | `/management/payrolls` |
| Inventory | `/inventory` | Stock management | `/management/inventory` |
| Laboratory | `/laboratory` | Lab orders | `/management/lab-orders` |
| Accounting | `/accounting` | Expenses | `/expense-records` |
| Reports | `/reports` | Analytics | `/reports/overview` |
| Settings | `/settings` | Configuration | `/settings/roles`, `/procedures` |
| Branches | `/branches` | Branch management | `/all-branch` |
| Insurance | `/insurance` | Insurance plans | Insurance APIs |
| Queue | `/queue` | Patient queue | `/appointments` (today) |
| Activity Logs | `/activity-logs` | Audit trail | `/activity-logs` |
| Pharmacy | `/pharmacy` | Medicines | Medicine APIs |
| Printer Test | `/printer-test` | Printer setup | Local printer APIs |

---

## Common Page Patterns

### Data Fetching Pattern
```typescript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [filters, setFilters] = useState({});

useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await api.get('/endpoint', { params: filters });
      setData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [filters]);
```

### Table with Pagination Pattern
```typescript
const [page, setPage] = useState(1);
const [perPage, setPerPage] = useState(20);
const [total, setTotal] = useState(0);

// Fetch with pagination
const params = { page, per_page: perPage };
```

### Form Submission Pattern
```typescript
const handleSubmit = async (formData) => {
  try {
    await api.post('/endpoint', formData);
    // Refresh data or redirect
    toast.success('Success');
  } catch (error) {
    // Show validation errors
    toast.error(error.message);
  }
};
```

---

## API Usage Statistics

- **Most Used:** `/patients`, `/appointments`, `/invoices`
- **Highest Load:** Dashboard summary, Patient list
- **Real-time Updates:** Queue, Appointments
- **Heavy Operations:** Payroll, Reports, Lab orders

---

**End of Dashboard Pages Profile**
