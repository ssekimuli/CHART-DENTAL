
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

**4. TreatmentPlan**
   - `id` (string, primary key)
   - `patient_id` (string, foreign key to Patient)
   - `procedure` (string, required)
   - `tooth` (integer, nullable)
   - `status` (enum: 'Proposed', 'In Progress', 'Completed', 'Cancelled')
   - `cost` (number, required)
   - `date` (date, required)
   - `invoice_id` (string, nullable, foreign key to Invoice)

**5. PatientImage**
   - `id` (string, primary key)
   - `patient_id` (string, foreign key to Patient)
   - `url` (string, url, required)
   - `description` (string)
   - `date` (date, required)

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

**8. PaymentTransaction**
    - `id` (string, primary key)
    - `invoice_id` (string, foreign key to Invoice)
    - `date` (date, required)
    - `amount` (number, required)
    - `method` (enum: 'Cash', 'Credit Card', 'Insurance', 'Bank Transfer')

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

**10. AttendanceRecord**
    - `id` (string, primary key)
    - `employee_id` (string, foreign key to Employee)
    - `date` (date, required)
    - `status` (enum: 'Present', 'Absent', 'On Leave')
    - `check_in` (time, nullable)
    - `check_out` (time, nullable)
    - `branch_id` (string, foreign key to Branch)

**11. LeaveRequest**
    - `id` (string, primary key)
    - `employee_id` (string, foreign key to Employee)
    - `leave_type` (enum: 'Annual', 'Sick', 'Unpaid', 'Maternity')
    - `start_date` (date, required)
    - `end_date` (date, required)
    - `reason` (text, required)
    - `status` (enum: 'Pending', 'Approved', 'Rejected')
    - `branch_id` (string, foreign key to Branch)

**12. StaffAdvance**
    - `id` (string, primary key)
    - `employee_id` (string, foreign key to Employee)
    - `amount` (number, required)
    - `date` (date, required)
    - `reason` (text, required)
    - `status` (enum: 'Pending', 'Approved', 'Paid', 'Rejected')
    - `branch_id` (string, foreign key to Branch)

**13. InventoryItem**
    - `id` (string, primary key)
    - `name` (string, required)
    - `supplier` (string)
    - `stock` (integer, required)
    - `reorder_level` (integer, required)
    - `price` (number, required)
    - `branch_id` (string, foreign key to Branch)

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

**15. Expense**
    - `id` (string, primary key)
    - `branch_id` (string, foreign key to Branch)
    - `date` (date, required)
    - `category` (enum: 'Supplies', 'Rent', 'Utilities', 'Salaries', 'Marketing', 'Maintenance', 'Other')
    - `description` (string, required)
    - `amount` (number, required)

**16. RolePermission**
    - `role` (string, primary key, from Employee role enum)
    - `permissions` (array of strings)

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
- **`GET /api/treatments`**: List all system-defined treatments and their standard costs.

### Patients
- **`GET /api/patients`**: List all patients. Supports filtering by `branch_id`.
- **`POST /api/patients`**: Create a new patient.
- **`GET /api/patients/{id}`**: Get a single patient by ID.
- **`PUT /api/patients/{id}`**: Update a patient's details.
- **`DELETE /api/patients/{id}`**: Delete a patient.
- **`POST /api/patients/{id}/images`**: Upload an image for a patient.
- **`PUT /api/patients/{id}/dental-records`**: Update/Create a dental record for a specific tooth.
- **`PUT /api/patients/{id}/periodontal-records`**: Save the entire periodontal chart for a patient.
- **`PUT /api/patients/{id}/occlusal-records`**: Save the occlusal chart for a patient.
- **`POST /api/patients/{id}/treatment-plans`**: Add a new treatment to a patient's plan.
- **`PUT /api/patients/{id}/treatment-plans/{treatment_id}`**: Update a treatment plan item.
- **`DELETE /api/patients/{id}/treatment-plans/{treatment_id}`**: Delete a treatment plan item.
- **`POST /api/patients/{id}/orthodontic-records`**: Add an orthodontic record.
- **`PUT /api/patients/{id}/orthodontic-records/{record_id}`**: Update an orthodontic record.
- **`DELETE /api/patients/{id}/orthodontic-records/{record_id}`**: Delete an orthodontic record.
- **`POST /api/patients/{id}/soft-tissue-records`**: Add a soft tissue record.
- **`PUT /api/patients/{id}/soft-tissue-records/{record_id}`**: Update a soft tissue record.
- **`DELETE /api/patients/{id}/soft-tissue-records/{record_id}`**: Delete a soft tissue record.

### Appointments
- **`GET /api/appointments`**: List all appointments. Supports filtering by `branch_id`, `doctor_id`, `date_range`.
- **`POST /api/appointments`**: Create a new appointment.
- **`PUT /api/appointments/{id}`**: Update an appointment (e.g., change status).
- **`DELETE /api/appointments/{id}`**: Delete an appointment.

### Billing & Invoices
- **`GET /api/invoices`**: List invoices. Supports filtering by `branch_id`, `search_query`, `date_range`.
- **`POST /api/invoices`**: Create a new invoice.
- **`GET /api/invoices/{id}`**: Get a single invoice.
- **`PUT /api/invoices/{id}`**: Update an invoice.
- **`DELETE /api/invoices/{id}`**: Delete an invoice.
- **`POST /api/invoices/{id}/payments`**: Process a payment for an invoice.

### Accounting
- **`GET /api/expenses`**: List all expenses. Supports filtering by `branch_id`.
- **`POST /api/expenses`**: Log a new expense.
- **`GET /api/reports/financial-summary`**: Get financial summary data (total income, expenses, profit, monthly breakdown). Supports `branch_id` filter.

### HRM (Human Resource Management)
- **`GET /api/employees`**: List all employees. Supports filtering by `branch_id`.
- **`POST /api/employees`**: Create a new employee.
- **`GET /api/employees/{id}`**: Get a single employee's details.
- **`PUT /api/employees/{id}`**: Update an employee.
- **`DELETE /api/employees/{id}`**: Delete an employee.
- **`GET /api/payrolls`**: List payrolls. Supports `branchId` filter.
- **`POST /api/payrolls`**: Create a new payroll record.
- **`GET /api/attendance`**: Get attendance records. Supports `branch_id` and `date` filters.
- **`POST /api/attendance`**: Mark attendance for one or more employees.
- **`GET /api/leave-requests`**: List leave requests. Supports `branch_id` filter.
- **`POST /api/leave-requests`**: Create a new leave request.
- **`PATCH /api/leave-requests/{id}/status`**: Update the status of a leave request.
- **`GET /api/staff-advances`**: List staff advances. Supports `branch_id` filter.
- **`POST /api/staff-advances`**: Create a new staff advance request.
- **`PATCH /api/staff-advances/{id}/status`**: Update the status of a staff advance.

### Inventory & Laboratory
- **`GET /api/inventory`**: List inventory items. Supports `branch_id` filter.
- **`POST /api/inventory`**: Create a new inventory item.
- **`GET /api/lab-orders`**: List lab orders. Supports `branch_id` filter.
- **`POST /api/lab-orders`**: Create a new lab order.

### Settings
- **`GET /api/settings/roles`**: List all roles and their permissions.
- **`PUT /api/settings/roles/{role_id}`**: Update permissions for a specific role (Super Admin only).
- **Note**: General practice settings and user profile settings will be handled via the `/api/branches` and `/api/auth/profile` endpoints respectively.
