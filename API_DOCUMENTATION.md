# CHART DENTAL - API DOCUMENTATION

**Base URL:** `https://stagingapi.poslycloud.com/api`

**Version:** 1.0  
**Last Updated:** 2026-08-19

---

## Table of Contents

1. [Authentication APIs](#authentication-apis)
2. [Patient Management APIs](#patient-management-apis)
3. [Appointment APIs](#appointment-apis)
4. [Invoice APIs](#invoice-apis)
5. [Employee Management APIs](#employee-management-apis)
6. [Payroll APIs](#payroll-apis)
7. [Inventory APIs](#inventory-apis)
8. [Laboratory APIs](#laboratory-apis)
9. [Treatment & Procedures APIs](#treatment--procedures-apis)
10. [Charting & Dental Records APIs](#charting--dental-records-apis)
11. [HR Management APIs](#hr-management-apis)
12. [Expense & Financial APIs](#expense--financial-apis)
13. [Reports & Dashboard APIs](#reports--dashboard-apis)
14. [Business & Branch APIs](#business--branch-apis)
15. [Client APIs](#client-apis)

---

## Authentication APIs

### 1. Login
**Endpoint:** `POST /login`

**Purpose:** Authenticate user and obtain session token

**Request Payload:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (Success - 200):**
```json
{
  "user": {
    "id": "1",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "Doctor",
    "status": "Active"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Checks:**
- ✅ Email format validation
- ✅ Password strength (minimum requirements)
- ✅ Account status (active/inactive)
- ✅ Token generation and storage
- ✅ HTTPS requirement for production

---

### 2. Logout
**Endpoint:** `POST /logout`

**Purpose:** Clear user session

**Request Payload:**
```json
{}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Checks:**
- ✅ Clear token from client storage
- ✅ Invalidate session on server
- ✅ Redirect to login page

---

### 3. Forgot Password
**Endpoint:** `POST /forgot-password`

**Purpose:** Initiate password reset flow with OTP

**Request Payload:**
```json
{
  "identifier": "user@example.com"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "OTP sent successfully.",
  "debug_otp": "123456"
}
```

**Response (Error - 404):**
```json
{
  "success": false,
  "message": "User not found"
}
```

**Checks:**
- ✅ Email/phone validation
- ✅ User existence verification
- ✅ OTP generation (6 digits)
- ✅ OTP expiration (typically 10-15 minutes)
- ✅ Rate limiting (max 3 attempts per hour)

---

### 4. Verify OTP
**Endpoint:** `POST /verify-otp`

**Purpose:** Verify OTP for password reset

**Request Payload:**
```json
{
  "identifier": "user@example.com",
  "otp": "123456"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "OTP verified successfully."
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Invalid or expired OTP."
}
```

**Checks:**
- ✅ OTP format validation (numeric, 6 digits)
- ✅ OTP expiration check
- ✅ User identifier matching
- ✅ Attempt count limit (max 3 incorrect attempts)

---

### 5. Reset Password
**Endpoint:** `POST /user-reset-password`

**Purpose:** Reset user password after OTP verification

**Request Payload:**
```json
{
  "identifier": "user@example.com",
  "password": "newPassword123"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Password reset successfully."
}
```

**Response (Error - 422):**
```json
{
  "success": false,
  "message": "Password does not meet requirements"
}
```

**Checks:**
- ✅ Password strength (min 8 chars, uppercase, lowercase, numbers)
- ✅ Previous password validation
- ✅ Password history (last 5 passwords)
- ✅ Session invalidation

---

### 6. Resend Employee Password
**Endpoint:** `POST /employees/{id}/resend-password`

**Purpose:** Resend initial password for new employees

**Request Payload:**
```json
{}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Password resent successfully."
}
```

**Checks:**
- ✅ Employee exists validation
- ✅ Account status check
- ✅ Email delivery confirmation
- ✅ Rate limiting per employee

---

## Patient Management APIs

### 1. Get All Patients
**Endpoint:** `GET /patients`

**Purpose:** Retrieve list of patients with pagination and filters

**Request Parameters:**
```
GET /patients?branch_id=1&status=Active&gender=Male&page=1&per_page=20
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| branch_id | number | No | Filter by branch |
| status | string | No | Filter by status (Active/Inactive) |
| gender | string | No | Filter by gender (Male/Female/Other) |
| page | number | No | Page number (default: 1) |
| per_page | number | No | Records per page (default: 20) |

**Response (Success - 200):**
```json
{
  "data": [
    {
      "id": "1",
      "first_name": "John",
      "last_name": "Doe",
      "avatar": "https://...",
      "email": "john@example.com",
      "phone": "+1234567890",
      "address": "123 Main St",
      "gender": "Male",
      "dateOfBirth": "1990-05-15",
      "lastVisit": "2026-08-10",
      "nextVisit": "2026-08-25",
      "status": "Active",
      "history": "Dental history notes",
      "branchId": "1",
      "dentalRecords": [],
      "treatmentPlans": [],
      "imaging": [],
      "periodontalRecords": [],
      "orthodonticRecords": [],
      "endodonticRecords": [],
      "restorativeRecords": []
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "per_page": 20,
    "last_page": 8
  }
}
```

**Checks:**
- ✅ Authentication verification
- ✅ Branch authorization (user can only see assigned branch)
- ✅ Pagination validation (page >= 1)
- ✅ Status filter validation
- ✅ Gender filter validation

---

### 2. Get Patient List (Simplified)
**Endpoint:** `GET /patients-list`

**Purpose:** Get simplified patient list (name, email, phone only)

**Request Parameters:**
```
GET /patients-list?branch_id=1&status=Active
```

**Response (Success - 200):**
```json
[
  {
    "id": "1",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "gender": "Male",
    "dateOfBirth": "1990-05-15",
    "status": "Active",
    "branchId": "1"
  }
]
```

**Checks:**
- ✅ Patient status verification
- ✅ Active patient filtering
- ✅ Data minimization (no sensitive fields)

---

### 3. Get Patient by ID
**Endpoint:** `GET /patients/{id}`

**Purpose:** Retrieve complete patient profile with all records

**Request Parameters:**
```
GET /patients/1
```

**Response (Success - 200):**
```json
{
  "id": "1",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "gender": "Male",
  "dateOfBirth": "1990-05-15",
  "status": "Active",
  "history": "Medical history...",
  "branchId": "1",
  "dentalRecords": [
    {
      "toothId": 11,
      "condition": "Cavity",
      "notes": "Small cavity on buccal"
    }
  ],
  "treatmentPlans": [
    {
      "id": "101",
      "procedure": "Root Canal",
      "tooth": "11",
      "status": "Pending",
      "cost": 500.00,
      "date": "2026-08-20"
    }
  ],
  "periodontalRecords": [
    {
      "toothId": 11,
      "pockets": {"pb": 3, "db": 3, "mb": 2},
      "recession": 1,
      "mobility": "0",
      "furcation": "I"
    }
  ],
  "orthodonticRecords": [
    {
      "id": "1",
      "appliance": "Fixed",
      "applianceLocation": "Upper",
      "treatmentPhase": "Phase 1",
      "wireSize": "0.018",
      "wireSizeUpper": "0.018",
      "wireSizeLower": "0.016",
      "archwireMaterial": "NiTi",
      "elastics": "Heavy",
      "compliance": "Good",
      "oralHygiene": "Good",
      "bracketChanges": [],
      "brokenBrackets": [],
      "nextVisitGoals": "Adjust ligatures",
      "monthsInTreatment": 6,
      "notes": "Progress is good",
      "date": "2026-08-19"
    }
  ],
  "endodonticRecords": [
    {
      "id": "1",
      "date": "2026-08-15",
      "toothId": 11,
      "pulpalDiagnosis": "Irreversible Pulpitis",
      "periapicalDiagnosis": "Normal",
      "canals": ["MB", "DB", "P"],
      "obturationMaterial": "Gutta-Percha",
      "postType": "Fiber Post",
      "notes": "Treatment completed"
    }
  ],
  "restorativeRecords": [
    {
      "id": "1",
      "toothId": 11,
      "surface": "O",
      "material": "Composite",
      "notes": "Direct composite restoration",
      "createdAt": "2026-08-15"
    }
  ],
  "imaging": [
    {
      "id": "1",
      "type": "CBCT",
      "tooth": "11",
      "date": "2026-08-15",
      "imageUrl": "https://..."
    }
  ]
}
```

**Response (Error - 404):**
```json
{
  "error": "Patient not found"
}
```

**Checks:**
- ✅ Patient existence validation
- ✅ Access control (user can only view assigned branch patients)
- ✅ Data integrity (all related records present)
- ✅ Date format validation (ISO 8601)

---

### 4. Create Patient (Implied)
**Endpoint:** `POST /patients`

**Purpose:** Create new patient record

**Request Payload:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "gender": "Male",
  "date_of_birth": "1990-05-15",
  "branch_id": 1,
  "status": "Active",
  "history": "Patient medical history"
}
```

**Response (Success - 201):**
```json
{
  "id": "1",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "gender": "Male",
  "date_of_birth": "1990-05-15",
  "branch_id": 1,
  "status": "Active"
}
```

**Checks:**
- ✅ Email format validation
- ✅ Phone format validation
- ✅ Duplicate email/phone check
- ✅ Branch exists validation
- ✅ Date of birth validation (not future date)
- ✅ Gender enum validation

---

## Appointment APIs

### 1. Get Appointments
**Endpoint:** `GET /appointments`

**Purpose:** Retrieve list of appointments with filters

**Request Parameters:**
```
GET /appointments?patient_id=1&doctor_id=2&branch_id=1&status=Scheduled&date=2026-08-20&page=1&per_page=20
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| patient_id | number | No | Filter by patient |
| doctor_id | number | No | Filter by doctor |
| branch_id | number | No | Filter by branch |
| status | string | No | Filter by status |
| date | string | No | Filter by specific date (YYYY-MM-DD) |
| date_from | string | No | Filter from date (YYYY-MM-DD) |
| date_to | string | No | Filter to date (YYYY-MM-DD) |
| search | string | No | Search by patient/doctor name |
| page | number | No | Page number |
| per_page | number | No | Records per page |

**Response (Success - 200):**
```json
{
  "data": [
    {
      "id": "1",
      "patientName": "John Doe",
      "patientId": "1",
      "doctorName": "Dr. Smith",
      "doctorId": "2",
      "treatment": "Cleaning",
      "status": "Scheduled",
      "date": "2026-08-20",
      "time": "10:00 AM",
      "branchId": "1",
      "tokenNumber": "A001"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "per_page": 20,
    "last_page": 3
  }
}
```

**Checks:**
- ✅ Date range validation (from <= to)
- ✅ Status enum validation
- ✅ Patient exists verification
- ✅ Doctor availability check
- ✅ Time format validation (HH:MM AM/PM)

---

### 2. Create Appointment
**Endpoint:** `POST /appointments`

**Purpose:** Create new appointment

**Request Payload:**
```json
{
  "patient_name": "John Doe",
  "patient_id": "1",
  "doctor_name": "Dr. Smith",
  "doctor_id": "2",
  "treatment": "Cleaning",
  "date": "2026-08-20",
  "time": "10:00 AM",
  "branch_id": "1"
}
```

**Response (Success - 201):**
```json
{
  "id": "1",
  "patientName": "John Doe",
  "patientId": "1",
  "doctorName": "Dr. Smith",
  "doctorId": "2",
  "treatment": "Cleaning",
  "status": "Scheduled",
  "date": "2026-08-20",
  "time": "10:00 AM",
  "branchId": "1",
  "tokenNumber": "A001"
}
```

**Response (Error - 422):**
```json
{
  "errors": {
    "patient_id": ["Patient not found"],
    "doctor_id": ["Doctor not available at this time"],
    "date": ["Cannot book appointment in the past"]
  }
}
```

**Checks:**
- ✅ All required fields present
- ✅ Patient and doctor existence validation
- ✅ Future date enforcement
- ✅ Doctor availability check
- ✅ Branch exists and is active
- ✅ Duplicate appointment prevention
- ✅ Time slot availability
- ✅ Conflict with doctor's schedule

---

## Invoice APIs

### 1. Get Invoices
**Endpoint:** `GET /invoices`

**Purpose:** Retrieve list of invoices

**Request Parameters:**
```
GET /invoices?branch_id=1&status=Paid&page=1&per_page=20
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| branch_id | number | No | Filter by branch |
| status | string | No | Filter by status (Draft/Issued/Paid/Overdue) |
| page | number | No | Page number |
| per_page | number | No | Records per page |

**Response (Success - 200):**
```json
{
  "data": [
    {
      "id": "1",
      "patientName": "John Doe",
      "patientId": "1",
      "amount": 1500.00,
      "paidAmount": 1500.00,
      "status": "Paid",
      "issueDate": "2026-08-10",
      "dueDate": "2026-09-10",
      "branchId": "1",
      "discount": 0,
      "tax": 150.00,
      "insuranceCoverage": 750.00,
      "patientResponsibility": 750.00,
      "insuranceResponsibility": 750.00,
      "patientPaidAmount": 750.00,
      "insurancePaidAmount": 750.00,
      "patientBalance": 0,
      "insuranceBalance": 0,
      "branch": {
        "id": "1",
        "name": "Main Branch",
        "currency": "USD",
        "address": "123 Main St"
      },
      "treatments": [
        {
          "procedureId": "101",
          "procedure": "Root Canal",
          "cost": 1000.00,
          "tooth": "11",
          "insuranceAmount": 750.00,
          "patientAmount": 250.00
        }
      ],
      "otherCharges": [
        {
          "description": "Lab fee",
          "amount": 500.00
        }
      ],
      "medicines": []
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 20,
    "last_page": 5
  }
}
```

**Checks:**
- ✅ Amount calculations (total = treatments + charges + tax - discount)
- ✅ Insurance coverage validation
- ✅ Status enum validation
- ✅ Date consistency (issueDate <= dueDate)
- ✅ Payment amount <= total amount

---

### 2. Get Invoice by ID
**Endpoint:** `GET /invoices/{id}`

**Purpose:** Retrieve single invoice details

**Response (Success - 200):**
```json
{
  "id": "1",
  "patientName": "John Doe",
  "patientId": "1",
  "amount": 1500.00,
  "paidAmount": 1500.00,
  "status": "Paid",
  "issueDate": "2026-08-10",
  "dueDate": "2026-09-10",
  "branchId": "1",
  "transactions": [
    {
      "id": "1",
      "date": "2026-08-15",
      "amount": 750.00,
      "method": "Cash"
    },
    {
      "id": "2",
      "date": "2026-08-20",
      "amount": 750.00,
      "method": "Credit Card"
    }
  ],
  "treatments": [
    {
      "procedureId": "101",
      "procedure": "Root Canal",
      "cost": 1000.00,
      "tooth": "11",
      "insuranceAmount": 750.00,
      "patientAmount": 250.00
    }
  ]
}
```

**Checks:**
- ✅ Invoice exists validation
- ✅ Access control (user can only view branch invoices)
- ✅ Transaction sum matches paid amount

---

### 3. Get Patient Invoices
**Endpoint:** `GET /patients/{id}/invoices`

**Purpose:** Get all invoices for specific patient

**Response (Success - 200):**
```json
[
  {
    "id": "1",
    "patientName": "John Doe",
    "patientId": "1",
    "amount": 1500.00,
    "paidAmount": 1500.00,
    "status": "Paid",
    "issueDate": "2026-08-10"
  },
  {
    "id": "2",
    "patientName": "John Doe",
    "patientId": "1",
    "amount": 800.00,
    "paidAmount": 0,
    "status": "Overdue",
    "issueDate": "2026-07-15"
  }
]
```

**Checks:**
- ✅ Patient exists validation
- ✅ Invoice status consistency
- ✅ Balance calculations accurate

---

## Employee Management APIs

### 1. Get All Employees
**Endpoint:** `GET /employees`

**Purpose:** Get list of employees

**Request Parameters:**
```
GET /employees?branch_id=1
```

**Response (Success - 200):**
```json
[
  {
    "id": "1",
    "name": "Dr. Smith",
    "avatar": "https://...",
    "email": "smith@example.com",
    "role": "Doctor",
    "status": "Active",
    "salary": 5000.00,
    "hire_date": "2020-01-15",
    "gender": "Male",
    "branchId": "1"
  }
]
```

**Checks:**
- ✅ Branch authorization
- ✅ Active status filtering
- ✅ Salary field encryption/masking for non-HR roles

---

### 2. Get Employee by ID
**Endpoint:** `GET /employees/{id}`

**Purpose:** Get complete employee profile with payroll

**Response (Success - 200):**
```json
{
  "employee": {
    "id": "1",
    "name": "Dr. Smith",
    "email": "smith@example.com",
    "role": "Doctor",
    "status": "Active",
    "salary": 5000.00,
    "hire_date": "2020-01-15",
    "branchId": "1"
  },
  "payrolls": [
    {
      "id": "1",
      "employeeId": "1",
      "employeeName": "Dr. Smith",
      "payPeriod": "2026-08",
      "grossPay": 5000.00,
      "deductions": 500.00,
      "netPay": 4500.00,
      "payDate": "2026-08-31",
      "status": "Paid",
      "branchId": "1"
    }
  ],
  "stats": {
    "totalEarnings": 45000.00,
    "totalDeductions": 4500.00,
    "averageMonthly": 4500.00
  }
}
```

**Checks:**
- ✅ Employee exists
- ✅ Role-based access control
- ✅ Payroll calculations verified

---

### 3. Get Doctors
**Endpoint:** `GET /doctors`

**Purpose:** Get list of doctors (employees with doctor role)

**Response (Success - 200):**
```json
[
  {
    "id": "1",
    "name": "Dr. Smith",
    "email": "smith@example.com",
    "role": "Doctor",
    "status": "Active",
    "branchId": "1",
    "branch": {
      "id": "1",
      "name": "Main Branch",
      "address": "123 Main St"
    }
  }
]
```

**Checks:**
- ✅ Only active doctors returned
- ✅ Role validation (Doctor role)

---

### 4. Resend Employee Password
**Endpoint:** `POST /employees/{id}/resend-password`

**Purpose:** Send new password to employee

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Password resent successfully."
}
```

**Checks:**
- ✅ Employee exists
- ✅ Email validity
- ✅ Rate limiting (1 resend per day max)

---

## Payroll APIs

### 1. Get Payrolls
**Endpoint:** `GET /management/payrolls`

**Purpose:** Get payroll records

**Request Parameters:**
```
GET /management/payrolls?branch_id=1
```

**Response (Success - 200):**
```json
[
  {
    "id": "1",
    "employeeId": "1",
    "employeeName": "Dr. Smith",
    "payPeriod": "2026-08",
    "grossPay": 5000.00,
    "deductions": 500.00,
    "netPay": 4500.00,
    "payDate": "2026-08-31",
    "status": "Paid",
    "branchId": "1",
    "approvalStatus": "Approved"
  }
]
```

**Checks:**
- ✅ Payroll calculations (netPay = grossPay - deductions)
- ✅ Date validation
- ✅ Status enum (Draft/Pending/Approved/Paid/Rejected)
- ✅ Approval workflow compliance

---

## Inventory APIs

### 1. Get Inventory
**Endpoint:** `GET /management/inventory`

**Purpose:** Get inventory items

**Request Parameters:**
```
GET /management/inventory?branch_id=1&page=1&per_page=20
```

**Response (Success - 200):**
```json
{
  "data": [
    {
      "id": "1",
      "name": "Dental Composite A2",
      "supplier": "3M",
      "stock": 50,
      "reorderLevel": 20,
      "price": 25.99,
      "status": "Available",
      "branchId": "1"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "per_page": 20
  }
}
```

**Checks:**
- ✅ Stock >= 0
- ✅ Low stock alerts (stock < reorderLevel)
- ✅ Price > 0
- ✅ Status enum validation

---

## Laboratory APIs

### 1. Get Lab Orders
**Endpoint:** `GET /management/lab-orders`

**Purpose:** Get laboratory orders

**Request Parameters:**
```
GET /management/lab-orders?branch_id=1&status=Pending&page=1&per_page=20
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| branch_id | number | No | Filter by branch |
| status | string | No | Filter by status |
| client_id | number | No | Filter by client |
| doctor_id | number | No | Filter by doctor |
| sent_date_from | string | No | Filter sent date from |
| sent_date_to | string | No | Filter sent date to |
| due_date_from | string | No | Filter due date from |
| due_date_to | string | No | Filter due date to |
| sort_by | string | No | Sort field |
| sort_order | string | No | Sort order (asc/desc) |

**Response (Success - 200):**
```json
{
  "data": [
    {
      "id": "1",
      "clientId": "1",
      "client": {
        "id": "1",
        "name": "Lab XYZ"
      },
      "patientName": "John Doe",
      "lab": "Lab XYZ",
      "item": "Crown",
      "tooth": "11",
      "status": "Pending",
      "sentDate": "2026-08-15",
      "dueDate": "2026-08-22",
      "branchId": "1",
      "doctor": {
        "id": "2",
        "name": "Dr. Smith"
      },
      "cost": 300.00
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "per_page": 20
  }
}
```

**Checks:**
- ✅ Dates validation (sentDate <= dueDate)
- ✅ Status enum validation
- ✅ Cost > 0
- ✅ Client exists
- ✅ Doctor exists

---

### 2. Update Lab Order Status
**Endpoint:** `PATCH /management/lab-orders/{id}/status`

**Purpose:** Update lab order status

**Request Payload:**
```json
{
  "status": "Completed"
}
```

**Response (Success - 200):**
```json
{
  "id": "1",
  "status": "Completed",
  "patientName": "John Doe",
  "tooth": "11",
  "item": "Crown"
}
```

**Checks:**
- ✅ Order exists
- ✅ Status enum validation
- ✅ Status transition rules (Pending → In Progress → Completed)

---

## Treatment & Procedures APIs

### 1. Get Treatments/Procedures
**Endpoint:** `GET /procedures`

**Purpose:** Get list of system treatments/procedures

**Request Parameters:**
```
GET /procedures?search=root&category=Endodontic
```

**Response (Success - 200):**
```json
[
  {
    "id": "1",
    "procedure": "Root Canal",
    "cost": 500.00,
    "description": "Endodontic treatment",
    "category": "Endodontic"
  },
  {
    "id": "2",
    "procedure": "Crown",
    "cost": 800.00,
    "description": "Restoration",
    "category": "Restorative"
  }
]
```

**Checks:**
- ✅ Cost > 0
- ✅ Procedure name not empty
- ✅ Category validation

---

### 2. Create Treatment
**Endpoint:** `POST /procedures`

**Purpose:** Create new treatment/procedure

**Request Payload:**
```json
{
  "procedure": "New Treatment",
  "cost": 500.00,
  "description": "Treatment description",
  "category": "Preventive"
}
```

**Response (Success - 201):**
```json
{
  "id": "1",
  "procedure": "New Treatment",
  "cost": 500.00,
  "description": "Treatment description",
  "category": "Preventive"
}
```

**Checks:**
- ✅ Cost > 0
- ✅ Unique procedure name
- ✅ Category exists

---

### 3. Update Treatment
**Endpoint:** `PUT /procedures/{id}`

**Purpose:** Update procedure details

**Request Payload:**
```json
{
  "cost": 550.00,
  "description": "Updated description"
}
```

**Response (Success - 200):**
```json
{
  "id": "1",
  "procedure": "Root Canal",
  "cost": 550.00,
  "description": "Updated description"
}
```

---

### 4. Delete Treatment
**Endpoint:** `DELETE /procedures/{id}`

**Purpose:** Delete procedure

**Response (Success - 204):**
```json
{}
```

**Checks:**
- ✅ Procedure exists
- ✅ No invoices referencing this procedure
- ✅ No active treatment plans using this

---

## Charting & Dental Records APIs

### Dental Records Structure:
```json
{
  "periodontalRecords": [
    {
      "toothId": 11,
      "pockets": {"pb": 3, "db": 3, "mb": 2},
      "recession": 1,
      "mobility": "0",
      "furcation": "I",
      "conditions": {}
    }
  ],
  "occlusalRecords": {
    "overbite": 2.5,
    "overjet": 3.0,
    "crossbite": "None",
    "openbite": "None",
    "malocclusion": "Class I"
  },
  "softTissueRecords": [
    {
      "area": "Gingiva",
      "condition": "Healthy",
      "notes": "Good oral hygiene"
    }
  ],
  "orthodonticRecords": [
    {
      "id": "1",
      "appliance": "Fixed",
      "applianceLocation": "Upper",
      "treatmentPhase": "Phase 1",
      "wireSize": "0.018",
      "archwireMaterial": "NiTi",
      "elastics": "Heavy",
      "compliance": "Good",
      "oralHygiene": "Good",
      "nextVisitGoals": "Adjust ligatures",
      "monthsInTreatment": 6,
      "notes": "Progress is good",
      "date": "2026-08-19"
    }
  ],
  "endodonticRecords": [
    {
      "id": "1",
      "date": "2026-08-15",
      "toothId": 11,
      "pulpalDiagnosis": "Irreversible Pulpitis",
      "periapicalDiagnosis": "Normal",
      "canals": ["MB", "DB", "P"],
      "obturationMaterial": "Gutta-Percha",
      "postType": "Fiber Post",
      "notes": "Treatment completed"
    }
  ],
  "restorativeRecords": [
    {
      "id": "1",
      "toothId": 11,
      "surface": "O",
      "material": "Composite",
      "notes": "Direct composite restoration",
      "createdAt": "2026-08-15"
    }
  ]
}
```

**Checks:**
- ✅ Tooth ID validation (1-32)
- ✅ Pocket depth ranges (0-10mm)
- ✅ Recession values (0-10mm)
- ✅ Mobility grades (0-3)
- ✅ Furcation classification (I, II, III)
- ✅ Overbite/overjet values (numeric)
- ✅ Dates in ISO format
- ✅ Surface codes (O, B, L, M, D, I)

---

## HR Management APIs

### 1. Get Attendance
**Endpoint:** `GET /management/attendance`

**Purpose:** Get attendance records

**Request Parameters:**
```
GET /management/attendance?branch_id=1
```

**Response (Success - 200):**
```json
[
  {
    "id": "1",
    "employeeId": "1",
    "employeeName": "Dr. Smith",
    "date": "2026-08-19",
    "status": "Present",
    "checkIn": "09:00",
    "checkOut": "17:30",
    "branchId": "1"
  }
]
```

**Checks:**
- ✅ Employee exists
- ✅ Check-in < Check-out
- ✅ Date is not future
- ✅ Status enum (Present/Absent/Leave/Late)

---

### 2. Get Leave Requests
**Endpoint:** `GET /management/get-leave-requests`

**Purpose:** Get employee leave requests

**Request Parameters:**
```
GET /management/get-leave-requests?branch_id=1&status=Approved
```

**Response (Success - 200):**
```json
[
  {
    "id": "1",
    "employeeId": "1",
    "employeeName": "Dr. Smith",
    "leaveType": "Vacation",
    "startDate": "2026-09-01",
    "endDate": "2026-09-07",
    "reason": "Holiday",
    "status": "Approved",
    "branchId": "1"
  }
]
```

**Checks:**
- ✅ Start date <= End date
- ✅ Leave type validation
- ✅ Status enum (Pending/Approved/Rejected)
- ✅ Leave balance validation

---

### 3. Get Staff Advances
**Endpoint:** `GET /management/staff-advances`

**Purpose:** Get salary advances for staff

**Response (Success - 200):**
```json
[
  {
    "id": "1",
    "employeeId": "1",
    "employeeName": "Dr. Smith",
    "amount": 1000.00,
    "date": "2026-08-15",
    "reason": "Personal emergency",
    "status": "Approved",
    "branchId": "1"
  }
]
```

**Checks:**
- ✅ Amount > 0
- ✅ Amount <= Monthly salary
- ✅ Status enum (Pending/Approved/Rejected)
- ✅ Employee exists

---

## Expense & Financial APIs

### 1. Get Expenses
**Endpoint:** `GET /expense-records`

**Purpose:** Get expense records

**Request Parameters:**
```
GET /expense-records?branch_id=1&category=Supplies&date_from=2026-08-01&date_to=2026-08-31
```

**Response (Success - 200):**
```json
{
  "data": [
    {
      "id": "1",
      "branchId": "1",
      "date": "2026-08-15",
      "category": "Supplies",
      "description": "Dental supplies purchase",
      "amount": 500.00,
      "type": "operation"
    },
    {
      "id": "2",
      "branchId": "1",
      "date": "2026-08-31",
      "category": "Payroll",
      "description": "Payroll for Dr. Smith",
      "amount": 5000.00,
      "type": "payroll",
      "employeeName": "Dr. Smith",
      "payPeriod": "2026-08",
      "netPay": 4500.00,
      "deductions": 500.00
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 20
  }
}
```

**Checks:**
- ✅ Amount > 0
- ✅ Date <= Today
- ✅ Category validation
- ✅ Type enum (operation/payroll)

---

### 2. Get Financial Summary
**Endpoint:** `GET /financial-summary`

**Purpose:** Get comprehensive financial overview

**Request Parameters:**
```
GET /financial-summary?branch_id=1&date_from=2026-01-01&date_to=2026-08-31
```

**Response (Success - 200):**
```json
{
  "branchId": "1",
  "from": "2026-01-01",
  "to": "2026-08-31",
  "totalIncome": 50000.00,
  "totalExpenses": 30000.00,
  "netProfit": 20000.00,
  "monthlyFinancials": [
    {
      "month": "Jan",
      "income": 6000.00,
      "expense": 3500.00,
      "netProfit": 2500.00
    },
    {
      "month": "Feb",
      "income": 6500.00,
      "expense": 3600.00,
      "netProfit": 2900.00
    }
  ]
}
```

**Checks:**
- ✅ netProfit = totalIncome - totalExpenses
- ✅ Monthly profits sum to total
- ✅ Amounts >= 0
- ✅ Date range valid

---

### 3. Get Expense Summary
**Endpoint:** `GET /expense-records`

**Purpose:** Get summarized expense data

**Response (Success - 200):**
```json
{
  "branch": {
    "id": "1",
    "name": "Main Branch",
    "address": "123 Main St"
  },
  "total": 30000.00,
  "totalPayroll": 20000.00,
  "totalOperationalExpenses": 10000.00,
  "records": [
    {
      "id": "1",
      "type": "payroll",
      "category": "Payroll",
      "amount": 5000.00,
      "employeeName": "Dr. Smith",
      "date": "2026-08-31"
    }
  ]
}
```

**Checks:**
- ✅ total = totalPayroll + totalOperationalExpenses
- ✅ All amounts >= 0

---

## Reports & Dashboard APIs

### 1. Get Dashboard Summary
**Endpoint:** `GET /dashboard-summary`

**Purpose:** Get dashboard KPI data

**Request Parameters:**
```
GET /dashboard-summary?branch_id=1
```

**Response (Success - 200):**
```json
{
  "totalRevenue": 50000.00,
  "activePatients": 250,
  "appointmentsLast30Days": 75,
  "newPatientsLast30Days": 15,
  "practiceOverview": "Practice performing well",
  "upcomingAppointments": [
    {
      "id": "1",
      "patientName": "John Doe",
      "doctorName": "Dr. Smith",
      "date": "2026-08-20",
      "time": "10:00 AM",
      "status": "Scheduled",
      "treatment": "Cleaning",
      "tokenNumber": "A001"
    }
  ],
  "recentPatients": [
    {
      "id": "1",
      "firstName": "John",
      "lastName": "Doe",
      "lastVisit": "2026-08-19"
    }
  ]
}
```

**Checks:**
- ✅ All numeric values >= 0
- ✅ Appointment dates in future
- ✅ Patient data consistency

---

### 2. Get Practice Trends
**Endpoint:** `GET /practice-trends`

**Purpose:** Get historical trend data

**Request Parameters:**
```
GET /practice-trends?branch_id=1
```

**Response (Success - 200):**
```json
{
  "trend": [
    {
      "date": "2026-08-01",
      "revenue": 2000.00,
      "appointments": 10,
      "newPatients": 2
    },
    {
      "date": "2026-08-02",
      "revenue": 2500.00,
      "appointments": 12,
      "newPatients": 1
    }
  ]
}
```

**Checks:**
- ✅ Dates in chronological order
- ✅ All metrics >= 0

---

### 3. Get Reports Overview
**Endpoint:** `GET /reports/overview`

**Purpose:** Get comprehensive reports

**Request Parameters:**
```
GET /reports/overview?branch_id=1&start_date=2026-08-01&end_date=2026-08-31
```

**Response (Success - 200):**
```json
{
  "categories": [...],
  "financial_summary": {
    "total_income": 50000.00,
    "total_expenses": 30000.00,
    "net_profit": 20000.00
  },
  "appointment_summary": {
    "total_appointments": 100,
    "status_distribution": {
      "Scheduled": 60,
      "Completed": 35,
      "Cancelled": 5
    }
  },
  "patient_summary": {
    "total_patients": 250,
    "status_distribution": {
      "Active": 200,
      "Inactive": 50
    },
    "gender_distribution": {
      "Male": 120,
      "Female": 130
    },
    "age_distribution": {
      "0-18": 30,
      "18-35": 80,
      "35-50": 90,
      "50+": 50
    }
  }
}
```

**Checks:**
- ✅ Sum of distributions match totals
- ✅ Financial calculations correct

---

## Business & Branch APIs

### 1. Get Businesses
**Endpoint:** `GET /businesses`

**Purpose:** Get all businesses/organizations

**Response (Success - 200):**
```json
[
  {
    "id": "1",
    "name": "Dental Clinic XYZ",
    "address": "123 Main St",
    "phone": "+1234567890",
    "email": "info@dental.com",
    "currency": "USD",
    "status": "Active"
  }
]
```

**Checks:**
- ✅ Business exists
- ✅ Status enum

---

### 2. Add Business
**Endpoint:** `POST /businesses`

**Purpose:** Create new business

**Request Payload:**
```json
{
  "name": "New Dental Clinic",
  "address": "456 Oak Ave",
  "phone": "+1987654321",
  "email": "clinic@example.com",
  "currency": "USD"
}
```

**Response (Success - 201):**
```json
{
  "id": "1",
  "name": "New Dental Clinic",
  "address": "456 Oak Ave",
  "phone": "+1987654321",
  "email": "clinic@example.com",
  "currency": "USD"
}
```

**Checks:**
- ✅ Email format validation
- ✅ Phone format validation
- ✅ Unique business name
- ✅ Currency validation

---

### 3. Get Branches
**Endpoint:** `GET /all-branch`

**Purpose:** Get all branch locations

**Response (Success - 200):**
```json
[
  {
    "id": 1,
    "name": "Main Branch",
    "address": "123 Main St",
    "phone": "+1234567890",
    "email": "main@dental.com",
    "businessId": "1",
    "status": "Active",
    "currency": "USD"
  }
]
```

**Checks:**
- ✅ Branch exists
- ✅ Status validation
- ✅ Business relationship valid

---

## Client APIs

### 1. Get Clients
**Endpoint:** `GET /clients`

**Purpose:** Get laboratory clients

**Response (Success - 200):**
```json
[
  {
    "id": "1",
    "name": "Lab XYZ",
    "email": "lab@xyz.com",
    "phone": "+1234567890",
    "address": "789 Lab Street",
    "contact_person": "John Manager",
    "status": "Active"
  }
]
```

**Checks:**
- ✅ Client exists
- ✅ Status enum

---

### 2. Create Client
**Endpoint:** `POST /clients`

**Purpose:** Add new laboratory client

**Request Payload:**
```json
{
  "name": "New Lab",
  "email": "newlab@example.com",
  "phone": "+1111111111",
  "address": "999 Lab Way",
  "contact_person": "Manager Name",
  "status": "Active"
}
```

**Response (Success - 201):**
```json
{
  "id": "1",
  "name": "New Lab",
  "email": "newlab@example.com",
  "phone": "+1111111111",
  "address": "999 Lab Way",
  "contact_person": "Manager Name",
  "status": "Active"
}
```

**Checks:**
- ✅ Email validation
- ✅ Phone validation
- ✅ Unique email

---

### 3. Update Client
**Endpoint:** `PUT /clients/{id}`

**Purpose:** Update client details

**Request Payload:**
```json
{
  "name": "Updated Lab Name",
  "email": "updated@example.com"
}
```

**Response (Success - 200):**
```json
{
  "id": "1",
  "name": "Updated Lab Name",
  "email": "updated@example.com",
  "phone": "+1111111111",
  "address": "999 Lab Way"
}
```

---

### 4. Delete Client
**Endpoint:** `DELETE /clients/{id}`

**Purpose:** Remove client

**Response (Success - 204):**
```json
{}
```

**Checks:**
- ✅ No pending lab orders
- ✅ No active invoices

---

## Common Response Patterns

### Success Response (200/201):
```json
{
  "data": {...} | [...],
  "message": "Operation successful",
  "meta": { "total": 100, "page": 1 }
}
```

### Validation Error (422):
```json
{
  "errors": {
    "field_name": ["Error message 1", "Error message 2"],
    "another_field": ["Error message"]
  },
  "message": "Validation failed"
}
```

### Authentication Error (401):
```json
{
  "message": "Unauthenticated",
  "error": "Invalid or expired token"
}
```

### Authorization Error (403):
```json
{
  "message": "Forbidden",
  "error": "You don't have permission to access this resource"
}
```

### Not Found Error (404):
```json
{
  "message": "Not found",
  "error": "Resource not found"
}
```

### Server Error (500):
```json
{
  "message": "Server error",
  "error": "An unexpected error occurred"
}
```

---

## Authentication Headers

All authenticated requests must include:

```
Authorization: Bearer {token}
Content-Type: application/json
```

---

## General Validation Rules

### Applied to All Requests:

1. **Required Fields:** All fields marked as required must be present and non-null
2. **String Length:** No strings exceed 255 characters unless specified
3. **Numeric Ranges:** All numeric values must be within valid ranges
4. **Date Format:** All dates must be ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.000Z)
5. **Email Format:** Must be valid email (RFC 5322)
6. **Phone Format:** International format (+country code)
7. **Enum Validation:** Only predefined values accepted
8. **XSS Prevention:** All string inputs sanitized
9. **SQL Injection Prevention:** Parameterized queries used
10. **Rate Limiting:** 100 requests per minute per user

---

## Error Handling Best Practices

1. **Check Status Code First**
   - 2xx = Success
   - 4xx = Client Error
   - 5xx = Server Error

2. **Handle Common Errors:**
   - 401: Re-authenticate user
   - 403: Show permission error
   - 404: Show not found error
   - 422: Display validation errors
   - 500: Retry with exponential backoff

3. **Implement Retry Logic:**
   - 5xx errors: Retry up to 3 times
   - Network timeout: Retry up to 2 times
   - Use exponential backoff (1s, 2s, 4s)

4. **Log All Errors:**
   - Include request details
   - Include response details
   - Include timestamp
   - Include user ID

---

## API Versioning

Current API Version: **v1**

Future versions will maintain backward compatibility or provide migration guides.

---

## Rate Limiting

- **Limit:** 100 requests per minute per user
- **Headers:** 
  - `X-RateLimit-Limit: 100`
  - `X-RateLimit-Remaining: 95`
  - `X-RateLimit-Reset: 1692518400`

---

## Security Considerations

1. **SSL/TLS:** All requests must use HTTPS
2. **Token Expiration:** Tokens expire after 24 hours
3. **CORS:** Only whitelisted domains allowed
4. **Data Encryption:** Sensitive data encrypted at rest
5. **Audit Logging:** All modifications logged with user ID and timestamp
6. **Input Validation:** All inputs validated server-side
7. **Output Encoding:** All outputs properly encoded

---

## Performance Tips

1. **Use Pagination:** Always paginate large result sets
2. **Filter Early:** Apply filters at API level, not client
3. **Cache Data:** Cache static data locally (businesses, treatments)
4. **Batch Requests:** When possible, batch multiple operations
5. **Limit Responses:** Only request needed fields in response

---

## Troubleshooting

### Common Issues:

1. **401 Unauthorized**
   - Check token validity
   - Check token expiration
   - Re-login if needed

2. **403 Forbidden**
   - Verify user role
   - Check branch permissions
   - Verify resource ownership

3. **422 Validation Error**
   - Check all required fields
   - Validate field formats
   - Check enum values

4. **500 Server Error**
   - Retry with exponential backoff
   - Check API status
   - Contact support if persists

---

## Support & Contact

- **Documentation:** See this file
- **Issues:** Report via GitHub Issues
- **Email:** support@charldental.com
- **Status Page:** status.charldental.com

---

**End of API Documentation**
