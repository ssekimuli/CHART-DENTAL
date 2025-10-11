
# Prompt for Building the Dentio Backend REST API

You are a senior backend engineer tasked with creating a comprehensive REST API for **Dentio**, a modern dental practice management application. The frontend is already built, and your API must provide all the necessary data and functionality to power it.

## I. Core Principles

1.  **Stateless & RESTful**: All endpoints must be stateless. Use standard HTTP methods (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`) and appropriate status codes.
2.  **JSON API**: All requests and responses must use JSON. Use snake_case for all JSON properties.
3.  **Authentication**: All endpoints, unless specified otherwise, must be protected and require authentication. Assume a JWT-based authentication system where the authenticated user's details (like `user_id`, `role`, `branch_id`) are available in the request context.
4.  **Authorization**: Implement role-based access control (RBAC). A "Super Admin" can access data for any branch, while other roles are restricted to their assigned `branch_id`.
5.  **Validation**: All incoming data (request bodies, query parameters) must be rigorously validated.
6.  **Error Handling**: Use standard HTTP status codes for errors (e.g., `400` for bad requests, `401` for unauthorized, `403` for forbidden, `404` for not found, `500` for server errors) and provide a consistent JSON error response format: `{ "error": "A descriptive error message." }`.

---

## II. Data Models

Define the database schemas for the following entities.

**1. Branch**
   - `id` (string, primary key)
   - `name` (string, required)
   - `address` (string, required)

#### Sample
```json
{
  "id": "b1",
  "name": "Downtown Clinic",
  "address": "123 Main St, Cityville"
}
```

**2. Employee**
   - `id` (string, primary key)
   - `name` (string, required)
   - `avatar` (string, url)
   - `email` (string, unique, required)
   - `password_hash` (string, required)
   - `role` (enum: 'Super Admin', 'Account', 'HR', 'Dentist', 'Hygienist', 'Receptionist', 'Assistant')
   - `status` (enum: 'Active', 'On Leave')
   - `salary` (number, required)
   - `hire_date` (date, required)
   - `branch_id` (string, foreign key to Branch)

#### Sample
```json
{
  "id": "emp1",
  "name": "Dr. Lisa Cuddy",
  "avatar": "https://example.com/avatars/lisa.jpg",
  "email": "lisa.cuddy@example.com",
  "role": "Super Admin",
  "status": "Active",
  "salary": 150000,
  "hire_date": "2020-01-15",
  "branch_id": "b1"
}
```

**3. Patient**
   - `id` (string, primary key)
   - `name` (string, required)
   - `avatar` (string, url)
   - `email` (string, unique, required)
   - `date_of_birth` (date, required)
   - `last_visit` (date)
   - `status` (enum: 'Active', 'Inactive')
   - `history` (text)
   - `branch_id` (string, foreign key to Branch)
   - **Nested JSONB Fields**:
     - `dental_records` (JSON array of `DentalRecord` objects)
     - `periodontal_records` (JSON array of `PeriodontalMeasurement` objects)
     - `occlusal_records` (JSON object: `OcclusalRecord`)
     - `soft_tissue_records` (JSON array of `SoftTissueRecord` objects)
     - `orthodontic_records` (JSON array of `OrthodonticRecord` objects)

#### Sample
```json
{
  "id": "p1",
  "name": "John Doe",
  "avatar": "https://example.com/avatars/johndoe.jpg",
  "email": "john.doe@example.com",
  "date_of_birth": "1985-05-20",
  "last_visit": "2024-05-10",
  "status": "Active",
  "history": "Patient has a history of grinding teeth (bruxism). No known allergies.",
  "branch_id": "b1",
  "dental_records": [
    { "tooth_id": 16, "condition": "Caries", "notes": "Distal caries, requires attention." }
  ],
  "periodontal_records": [
    { "tooth_id": 16, "pockets": { "distobuccal": 3, "buccal": 2, "mesiobuccal": 3 }, "recession": 1, "conditions": { "bleeding": true } }
  ],
  "occlusal_records": {
    "overbite": 2, "overjet": 2, "crossbite": "None", "openbite": "None", "malocclusion": "Class I"
  },
  "soft_tissue_records": [],
  "orthodontic_records": []
}
```

**4. TreatmentPlan**
   - `id` (string, primary key)
   - `patient_id` (string, foreign key to Patient)
   - `procedure` (string, required)
   - `tooth` (integer, nullable)
   - `status` (enum: 'Proposed', 'In Progress', 'Completed', 'Cancelled')
   - `cost` (number, required)
   - `date` (date, required)
   - `invoice_id` (string, nullable, foreign key to Invoice)

#### Sample
```json
{
  "id": "tp1",
  "patient_id": "p1",
  "procedure": "Crown for #48",
  "tooth": 48,
  "status": "Proposed",
  "cost": 1200,
  "date": "2024-06-01",
  "invoice_id": null
}
```

**5. PatientImage**
   - `id` (string, primary key)
   - `patient_id` (string, foreign key to Patient)
   - `url` (string, url, required)
   - `description` (string)
   - `date` (date, required)

#### Sample
```json
{
  "id": "img1",
  "patient_id": "p1",
  "url": "https://example.com/images/xray1.jpg",
  "description": "Initial panoramic X-ray",
  "date": "2023-01-15"
}
```

**6. Appointment**
   - `id` (string, primary key)
   - `patient_id` (string, foreign key to Patient)
   - `doctor_id` (string, foreign key to Employee)
   - `treatment` (string, required)
   - `status` (enum: "Scheduled", "Completed", "Cancelled", "Waiting", "In Session", "On Hold")
   - `date` (date, required)
   - `time` (string, required)
   - `branch_id` (string, foreign key to Branch)
   - `token_number` (string, required)

#### Sample
```json
{
  "id": "a1",
  "patient_id": "p1",
  "doctor_id": "emp1",
  "treatment": "Check-up",
  "status": "Scheduled",
  "date": "2024-07-20",
  "time": "10:00 AM",
  "branch_id": "b1",
  "token_number": "JDLC1"
}
```

**7. Invoice**
   - `id` (string, primary key)
   - `patient_id` (string, foreign key to Patient)
   - `amount` (number, required)
   - `paid_amount` (number, default: 0)
   - `status` (enum: 'Paid', 'Pending', 'Overdue')
   - `issue_date` (date, required)
   - `due_date` (date, required)
   - `branch_id` (string, foreign key to Branch)
   - `treatments` (JSON array of `InvoiceTreatment` objects)
   - `other_charges` (JSON array of `OtherCharge` objects, nullable)

#### Sample
```json
{
  "id": "inv1",
  "patient_id": "p1",
  "amount": 270,
  "paid_amount": 100,
  "status": "Pending",
  "issue_date": "2024-05-10",
  "due_date": "2024-06-10",
  "branch_id": "b1",
  "treatments": [
    { "procedure": "Filling for #16", "cost": 250, "tooth": 16 }
  ],
  "other_charges": [
    { "description": "Late Fee", "amount": 20 }
  ]
}
```

**8. PaymentTransaction**
    - `id` (string, primary key)
    - `invoice_id` (string, foreign key to Invoice)
    - `date` (date, required)
    - `amount` (number, required)
    - `method` (enum: 'Cash', 'Credit Card', 'Insurance', 'Bank Transfer')

#### Sample
```json
{
  "id": "txn1",
  "invoice_id": "inv1",
  "date": "2024-05-12",
  "amount": 100,
  "method": "Insurance"
}
```

**9. Payroll**
   - `id` (string, primary key)
   - `employee_id` (string, foreign key to Employee)
   - `pay_period` (string, required)
   - `gross_pay` (number, required)
   - `net_pay` (number, required)
   - `deductions` (number, required)
   - `pay_date` (date, required)
   - `status` (enum: 'Paid', 'Pending')
   - `branch_id` (string, foreign key to Branch)

#### Sample
```json
{
  "id": "pay1",
  "employee_id": "emp1",
  "pay_period": "2024-06-01 to 2024-06-15",
  "gross_pay": 6250,
  "deductions": 1200,
  "net_pay": 5050,
  "pay_date": "2024-06-15",
  "status": "Paid",
  "branch_id": "b1"
}
```

**10. AttendanceRecord**
    - `id` (string, primary key)
    - `employee_id` (string, foreign key to Employee)
    - `date` (date, required)
    - `status` (enum: 'Present', 'Absent', 'On Leave')
    - `check_in` (time, nullable)
    - `check_out` (time, nullable)
    - `branch_id` (string, foreign key to Branch)

#### Sample
```json
{
  "id": "att1",
  "employee_id": "emp1",
  "date": "2024-07-18",
  "status": "Present",
  "check_in": "08:55:00",
  "check_out": "17:05:00",
  "branch_id": "b1"
}
```

**11. LeaveRequest**
    - `id` (string, primary key)
    - `employee_id` (string, foreign key to Employee)
    - `leave_type` (enum: 'Annual', 'Sick', 'Unpaid', 'Maternity')
    - `start_date` (date, required)
    - `end_date` (date, required)
    - `reason` (text, required)
    - `status` (enum: 'Pending', 'Approved', 'Rejected')
    - `branch_id` (string, foreign key to Branch)

#### Sample
```json
{
  "id": "leave1",
  "employee_id": "emp2",
  "leave_type": "Annual",
  "start_date": "2024-08-01",
  "end_date": "2024-08-05",
  "reason": "Family vacation",
  "status": "Approved",
  "branch_id": "b1"
}
```

**12. StaffAdvance**
    - `id` (string, primary key)
    - `employee_id` (string, foreign key to Employee)
    - `amount` (number, required)
    - `date` (date, required)
    - `reason` (text, required)
    - `status` (enum: 'Pending', 'Approved', 'Paid', 'Rejected')
    - `branch_id` (string, foreign key to Branch)

#### Sample
```json
{
  "id": "adv1",
  "employee_id": "emp3",
  "amount": 500,
  "date": "2024-07-01",
  "reason": "Emergency medical expense",
  "status": "Approved",
  "branch_id": "b2"
}
```

**13. InventoryItem**
    - `id` (string, primary key)
    - `name` (string, required)
    - `supplier` (string)
    - `stock` (integer, required)
    - `reorder_level` (integer, required)
    - `price` (number, required)
    - `branch_id` (string, foreign key to Branch)

#### Sample
```json
{
  "id": "item1",
  "name": "Gloves (Box of 100)",
  "supplier": "Dental Supplies Co.",
  "stock": 50,
  "reorder_level": 20,
  "price": 15.00,
  "branch_id": "b1"
}
```

**14. LaboratoryOrder**
    - `id` (string, primary key)
    - `patient_id` (string, foreign key to Patient)
    - `lab` (string, required)
    - `item` (string, required)
    - `tooth` (integer, nullable)
    - `status` (enum: 'Sent', 'Received', 'Completed', 'Cancelled')
    - `sent_date` (date, required)
    - `due_date` (date, required)
    - `branch_id` (string, foreign key to Branch)

#### Sample
```json
{
  "id": "lab1",
  "patient_id": "p1",
  "lab": "Precision Dental Labs",
  "item": "Zirconia Crown",
  "tooth": 48,
  "status": "Sent",
  "sent_date": "2024-06-02",
  "due_date": "2024-06-16",
  "branch_id": "b1"
}
```

**15. Expense**
    - `id` (string, primary key)
    - `branch_id` (string, foreign key to Branch)
    - `date` (date, required)
    - `category` (enum: 'Supplies', 'Rent', 'Utilities', 'Salaries', 'Marketing', 'Maintenance', 'Other')
    - `description` (string, required)
    - `amount` (number, required)

#### Sample
```json
{
  "id": "exp1",
  "branch_id": "b1",
  "date": "2024-06-01",
  "category": "Rent",
  "description": "June Rent - Downtown Clinic",
  "amount": 5000
}
```

**16. RolePermission**
    - `role` (string, primary key, from Employee role enum)
    - `permissions` (array of strings)

#### Sample
```json
{
  "role": "Dentist",
  "permissions": [
    "dashboard:read",
    "queue:read",
    "patients:read",
    "patients:create",
    "patients:update",
    "charting:read",
    "charting:update",
    "appointments:read",
    "appointments:create",
    "appointments:update",
    "billing:read",
    "laboratory:read",
    "laboratory:create",
    "laboratory:update",
    "profile:read",
    "profile:update"
  ]
}
```

---

## III. API Endpoints

### Authentication
- **`POST /api/auth/login`**: Authenticate user.
  - **Body**: `{ "email": "...", "password": "..." }`
  - **Response**: `{ "token": "...", "user": { ... } }` or `401`
- **`POST /api/auth/forgot-password`**: Initiate password reset.
  - **Body**: `{ "identifier": "email@example.com" }` or `{ "identifier": "+1234567890" }`
  - **Action**: Generates and sends an OTP. Returns `200 OK`.
- **`POST /api/auth/verify-otp`**: Verify OTP for password reset.
  - **Body**: `{ "identifier": "...", "otp": "..." }`
  - **Response**: `{ "reset_token": "..." }` or `400`
- **`POST /api/auth/reset-password`**: Set a new password.
  - **Body**: `{ "reset_token": "...", "new_password": "..." }`
  - **Response**: `200 OK` or `400`
- **`GET /api/auth/profile`**: Get the authenticated user's profile data.
  - **Response**: Returns a `ProfileData` object.

### General
- **`GET /api/branches`**: List all branches.
- **`POST /api/branches`**: Create a new branch (Super Admin only).
  - **Body**: `{ "name": "...", "address": "..." }`
  - **Response**: `201` with the new `Branch` object.
- **`GET /api/treatments`**: List all system-defined treatments and their standard costs.
  - **Response**: `200` with an array of `SystemTreatment` objects.

### Patients
- **`GET /api/patients`**: List all patients. Supports filtering by `branch_id`.
  - **Response**: `200` with an array of `Patient` objects.
- **`POST /api/patients`**: Create a new patient.
  - **Body**: `{ "name": "...", "email": "...", "date_of_birth": "...", "history": "..." }`
  - **Response**: `201` with the new `Patient` object.
- **`GET /api/patients/{id}`**: Get a single patient by ID.
  - **Response**: `200` with a `Patient` object.
- **`PUT /api/patients/{id}`**: Update a patient's details.
  - **Body**: Partial `Patient` object.
  - **Response**: `200` with the updated `Patient` object.
- **`DELETE /api/patients/{id}`**: Delete a patient.
  - **Response**: `204 No Content`.
- **`POST /api/patients/{id}/images`**: Upload an image for a patient.
  - **Body**: `multipart/form-data` with `image` file and `description`.
  - **Response**: `201` with the new `PatientImage` object.
- **`PUT /api/patients/{id}/dental-records`**: Update/Create a dental record for a specific tooth.
  - **Body**: A `DentalRecord` object.
  - **Response**: `200` with the updated `Patient` object.
- **`PUT /api/patients/{id}/periodontal-records`**: Save the entire periodontal chart for a patient.
  - **Body**: An array of `PeriodontalMeasurement` objects.
  - **Response**: `200` with the updated `Patient` object.
- **`PUT /api/patients/{id}/occlusal-records`**: Save the occlusal chart for a patient.
  - **Body**: An `OcclusalRecord` object.
  - **Response**: `200` with the updated `Patient` object.
- **`POST /api/patients/{id}/treatment-plans`**: Add a new treatment to a patient's plan.
  - **Body**: `{ "procedure": "...", "tooth": "...", "status": "...", "cost": "..." }`
  - **Response**: `201` with the updated `Patient` object.
- **`PUT /api/patients/{id}/treatment-plans/{treatment_id}`**: Update a treatment plan item.
  - **Body**: Partial `TreatmentPlan` object.
  - **Response**: `200` with the updated `Patient` object.
- **`DELETE /api/patients/{id}/treatment-plans/{treatment_id}`**: Delete a treatment plan item.
  - **Response**: `200` with the updated `Patient` object.
- **`POST /api/patients/{id}/orthodontic-records`**: Add an orthodontic record.
  - **Body**: An `OrthodonticRecord` object (without `id`).
  - **Response**: `201` with the updated `Patient` object.
- **`PUT /api/patients/{id}/orthodontic-records/{record_id}`**: Update an orthodontic record.
  - **Body**: A partial `OrthodonticRecord` object.
  - **Response**: `200` with the updated `Patient` object.
- **`DELETE /api/patients/{id}/orthodontic-records/{record_id}`**: Delete an orthodontic record.
  - **Response**: `200` with the updated `Patient` object.
- **`POST /api/patients/{id}/soft-tissue-records`**: Add a soft tissue record.
  - **Body**: A `SoftTissueRecord` object (without `id`).
  - **Response**: `201` with the updated `Patient` object.
- **`PUT /api/patients/{id}/soft-tissue-records/{record_id}`**: Update a soft tissue record.
  - **Body**: A partial `SoftTissueRecord` object.
  - **Response**: `200` with the updated `Patient` object.
- **`DELETE /api/patients/{id}/soft-tissue-records/{record_id}`**: Delete a soft tissue record.
  - **Response**: `200` with the updated `Patient` object.

### Appointments
- **`GET /api/appointments`**: List all appointments. Supports filtering by `branch_id`, `doctor_id`, `date_range`, and a list of `statuses`.
  - **Response**: `200` with an array of `Appointment` objects.
- **`POST /api/appointments`**: Create a new appointment.
  - **Body**: `{ "patient_id": "...", "doctor_id": "...", "treatment": "...", "date": "...", "time": "...", "token_number": "..." }`
  - **Response**: `201` with the new `Appointment` object.
- **`PUT /api/appointments/{id}`**: Update an appointment (e.g., change status).
  - **Body**: Partial `Appointment` object.
  - **Response**: `200` with the updated `Appointment` object.
- **`DELETE /api/appointments/{id}`**: Delete an appointment.
  - **Response**: `204 No Content`.
- **`POST /api/queue/{appointment_id}/announce`**: Triggers a text-to-speech announcement for the patient's token number.
  - **Response**: `200 OK` with `{ "audio_url": "..." }`

### Billing & Invoices
- **`GET /api/invoices`**: List invoices. Supports filtering by `branch_id`, `search_query`, `date_range`.
  - **Response**: `200` with an array of `Invoice` objects.
- **`POST /api/invoices`**: Create a new invoice.
  - **Body**: `Omit<Invoice, "id" | "amount" | "paid_amount">`
  - **Response**: `201` with the new `Invoice` object.
- **`GET /api/invoices/{id}`**: Get a single invoice.
  - **Response**: `200` with an `Invoice` object.
- **`PUT /api/invoices/{id}`**: Update an invoice.
  - **Body**: Partial `Invoice` object.
  - **Response**: `200` with the updated `Invoice` object.
- **`DELETE /api/invoices/{id}`**: Delete an invoice.
  - **Response**: `204 No Content`.
- **`POST /api/invoices/{id}/payments`**: Process a payment for an invoice.
  - **Body**: `{ "amount": ..., "method": "..." }`
  - **Response**: `201` with the new `PaymentTransaction` object.

### Accounting
- **`GET /api/expenses`**: List all expenses. Supports filtering by `branch_id`.
  - **Response**: `200` with an array of `Expense` objects.
- **`POST /api/expenses`**: Log a new expense.
  - **Body**: `Omit<Expense, "id">`
  - **Response**: `201` with the new `Expense` object.
- **`GET /api/reports/financial-summary`**: Get financial summary data (total income, expenses, profit, monthly breakdown). Supports `branch_id` filter.
  - **Response**: `200` with a `FinancialSummary` object.

### HRM (Human Resource Management)
- **`GET /api/employees`**: List all employees. Supports filtering by `branch_id`.
  - **Response**: `200` with an array of `Employee` objects.
- **`POST /api/employees`**: Create a new employee.
  - **Body**: `Omit<Employee, "id">`
  - **Response**: `201` with the new `Employee` object.
- **`GET /api/employees/{id}`**: Get a single employee's details.
  - **Response**: `200` with an `Employee` object.
- **`PUT /api/employees/{id}`**: Update an employee.
  - **Body**: Partial `Employee` object.
  - **Response**: `200` with the updated `Employee` object.
- **`DELETE /api/employees/{id}`**: Delete an employee.
  - **Response**: `204 No Content`.
- **`GET /api/payrolls`**: List payrolls. Supports `branchId` filter.
  - **Response**: `200` with an array of `Payroll` objects.
- **`POST /api/payrolls`**: Create a new payroll record.
  - **Body**: `Omit<Payroll, "id">`
  - **Response**: `201` with the new `Payroll` object.
- **`GET /api/attendance`**: Get attendance records. Supports `branch_id` and `date` filters.
  - **Response**: `200` with an array of `AttendanceRecord` objects.
- **`POST /api/attendance`**: Mark attendance for one or more employees.
  - **Body**: An array of `Omit<AttendanceRecord, "id">` objects.
  - **Response**: `201` with an array of created/updated `AttendanceRecord` objects.
- **`GET /api/leave-requests`**: List leave requests. Supports `branch_id` filter.
  - **Response**: `200` with an array of `LeaveRequest` objects.
- **`POST /api/leave-requests`**: Create a new leave request.
  - **Body**: `Omit<LeaveRequest, "id">`
  - **Response**: `201` with the new `LeaveRequest` object.
- **`PATCH /api/leave-requests/{id}/status`**: Update the status of a leave request.
  - **Body**: `{ "status": "Approved" | "Rejected" }`
  - **Response**: `200` with the updated `LeaveRequest` object.
- **`GET /api/staff-advances`**: List staff advances. Supports `branch_id` filter.
  - **Response**: `200` with an array of `StaffAdvance` objects.
- **`POST /api/staff-advances`**: Create a new staff advance request.
  - **Body**: `Omit<StaffAdvance, "id">`
  - **Response**: `201` with the new `StaffAdvance` object.
- **`PATCH /api/staff-advances/{id}/status`**: Update the status of a staff advance.
  - **Body**: `{ "status": "Approved" | "Paid" | "Rejected" }`
  - **Response**: `200` with the updated `StaffAdvance` object.

### Inventory & Laboratory
- **`GET /api/inventory`**: List inventory items. Supports `branch_id` filter.
  - **Response**: `200` with an array of `InventoryItem` objects.
- **`POST /api/inventory`**: Create a new inventory item.
  - **Body**: `Omit<InventoryItem, "id">`
  - **Response**: `201` with the new `InventoryItem` object.
- **`GET /api/lab-orders`**: List lab orders. Supports `branch_id` filter.
  - **Response**: `200` with an array of `LaboratoryOrder` objects.
- **`POST /api/lab-orders`**: Create a new lab order.
  - **Body**: `Omit<LaboratoryOrder, "id">`
  - **Response**: `201` with the new `LaboratoryOrder` object.

### Settings
- **`GET /api/settings/roles`**: List all roles and their permissions.
  - **Response**: `200` with an array of `RolePermission` objects.
- **`PUT /api/settings/roles/{role_id}`**: Update permissions for a specific role (Super Admin only).
  - **Body**: `{ "permissions": [...] }`
  - **Response**: `200` with the updated `RolePermission` object.
- **Note**: General practice settings and user profile settings will be handled via the `/api/branches` and `/api/auth/profile` endpoints respectively.
