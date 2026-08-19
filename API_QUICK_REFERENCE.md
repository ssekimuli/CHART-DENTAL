# CHART DENTAL - API QUICK REFERENCE

Quick lookup for common API operations and status codes.

---

## Base URL
```
https://stagingapi.poslycloud.com/api
```

---

## Common HTTP Status Codes

| Code | Meaning | When | Action |
|------|---------|------|--------|
| 200 | OK | Successful GET, PUT, PATCH | Use returned data |
| 201 | Created | Successful POST (create) | Use returned resource + ID |
| 204 | No Content | Successful DELETE | No data returned |
| 400 | Bad Request | Malformed request | Check syntax/headers |
| 401 | Unauthorized | Missing/invalid token | Re-authenticate |
| 403 | Forbidden | User lacks permission | Check user role |
| 404 | Not Found | Resource doesn't exist | Verify ID/path |
| 422 | Validation Error | Invalid data | Check error messages |
| 429 | Too Many Requests | Rate limited | Wait before retry |
| 500 | Server Error | Backend issue | Retry with backoff |
| 502 | Bad Gateway | Service unavailable | Retry later |
| 503 | Service Unavailable | Maintenance | Check status page |

---

## Authentication

### Get Token
```bash
POST /login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Use Token
```bash
GET /patients
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json
```

### Logout
```bash
POST /logout
Authorization: Bearer {token}
```

---

## Patient Operations

### List All Patients
```bash
GET /patients?branch_id=1&status=Active&page=1&per_page=20
```

### Get Single Patient
```bash
GET /patients/1
```

### Create Patient
```bash
POST /patients
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "gender": "Male",
  "date_of_birth": "1990-05-15",
  "branch_id": 1
}
```

### Quick Patient Lookup
```bash
GET /patients-list?status=Active
```
Returns: `[{ id, name, email, phone, ... }]`

---

## Appointment Operations

### List Appointments
```bash
GET /appointments?branch_id=1&status=Scheduled&date=2026-08-20
```

### Create Appointment
```bash
POST /appointments

{
  "patient_id": "1",
  "patient_name": "John Doe",
  "doctor_id": "2",
  "doctor_name": "Dr. Smith",
  "date": "2026-08-20",
  "time": "10:00 AM",
  "treatment": "Cleaning",
  "branch_id": "1"
}
```

### Get Available Doctors
```bash
GET /doctors?branch_id=1
```

---

## Invoice Operations

### List Invoices
```bash
GET /invoices?branch_id=1&status=Paid&page=1
```

### Get Invoice Details
```bash
GET /invoices/1
```

### Get Patient Invoices
```bash
GET /patients/1/invoices
```

### Create Payment
```bash
POST /invoices/1/payments

{
  "amount": 500.00,
  "method": "Credit Card",
  "reference_number": "CC123456",
  "notes": "Payment for treatment"
}
```

---

## Dental Records

### Add Dental Record
```bash
PATCH /patients/1/dental-records

{
  "tooth_id": 11,
  "condition": "Cavity",
  "notes": "Small cavity on buccal"
}
```

### Add Periodontal Record
```bash
PATCH /patients/1/periodontal-records

{
  "tooth_id": 11,
  "pockets": {
    "pb": 3,
    "db": 3,
    "mb": 2,
    "dl": 3,
    "bl": 2,
    "ml": 3
  },
  "recession": 1,
  "mobility": "0"
}
```

### Add Orthodontic Record
```bash
POST /patients/1/orthodontic-records

{
  "appliance": "Fixed",
  "appliance_location": "Upper",
  "treatment_phase": "Phase 1",
  "wire_size": "0.018",
  "archwire_material": "NiTi",
  "elastics": "Heavy",
  "compliance": "Good",
  "oral_hygiene": "Good",
  "months_in_treatment": 6
}
```

### Add Endodontic Record
```bash
POST /patients/1/endodontic-records

{
  "tooth_id": 11,
  "pulpal_diagnosis": "Irreversible Pulpitis",
  "periapical_diagnosis": "Normal",
  "canals": ["MB", "DB", "P"],
  "obturation_material": "Gutta-Percha",
  "post_type": "Fiber Post"
}
```

---

## Employee Operations

### List Employees
```bash
GET /employees?branch_id=1
```

### Get Employee Details
```bash
GET /employees/1
```

### Get Doctors
```bash
GET /doctors?branch_id=1
```

### Resend Employee Password
```bash
POST /employees/1/resend-password
```

---

## Payroll Operations

### List Payrolls
```bash
GET /management/payrolls?branch_id=1
```

### Create Payroll
```bash
POST /management/payrolls

{
  "employee_id": "1",
  "pay_period": "2026-08",
  "gross_pay": 5000.00,
  "deductions": 500.00,
  "net_pay": 4500.00,
  "branch_id": "1"
}
```

---

## HR Operations

### Get Attendance
```bash
GET /management/attendance?branch_id=1&date=2026-08-19
```

### Get Leave Requests
```bash
GET /management/get-leave-requests?branch_id=1&status=Approved
```

### Get Staff Advances
```bash
GET /management/staff-advances?branch_id=1&status=Pending
```

---

## Inventory Operations

### List Inventory
```bash
GET /management/inventory?branch_id=1&page=1&per_page=20
```

### Create Inventory Item
```bash
POST /management/inventory

{
  "name": "Dental Composite A2",
  "supplier": "3M",
  "stock": 50,
  "reorder_level": 20,
  "price": 25.99,
  "branch_id": 1
}
```

---

## Laboratory Orders

### List Lab Orders
```bash
GET /management/lab-orders?branch_id=1&status=Pending
```

### Create Lab Order
```bash
POST /management/lab-orders

{
  "patient_name": "John Doe",
  "tooth": "11",
  "item": "Crown",
  "client_id": "1",
  "doctor_id": "2",
  "due_date": "2026-08-22",
  "branch_id": "1"
}
```

### Update Lab Order Status
```bash
PATCH /management/lab-orders/1/status

{
  "status": "Completed"
}
```

---

## Procedures/Treatments

### List Treatments
```bash
GET /procedures?search=root&category=Endodontic
```

### Create Treatment
```bash
POST /procedures

{
  "procedure": "Root Canal",
  "cost": 500.00,
  "category": "Endodontic",
  "description": "Endodontic treatment"
}
```

### Update Treatment
```bash
PUT /procedures/1

{
  "cost": 550.00,
  "description": "Updated description"
}
```

### Delete Treatment
```bash
DELETE /procedures/1
```

---

## Financial Operations

### Get Financial Summary
```bash
GET /financial-summary?branch_id=1&date_from=2026-01-01&date_to=2026-08-31
```

### Get Expense Records
```bash
GET /expense-records?branch_id=1&category=Supplies
```

### Get Expense Summary
```bash
GET /expense-records?branch_id=1&summary=true
```

---

## Reports

### Dashboard Summary
```bash
GET /dashboard-summary?branch_id=1
```

### Practice Trends
```bash
GET /practice-trends?branch_id=1
```

### Reports Overview
```bash
GET /reports/overview?branch_id=1&start_date=2026-08-01&end_date=2026-08-31
```

---

## Business & Branches

### Get Businesses
```bash
GET /businesses
```

### Add Business
```bash
POST /businesses

{
  "name": "New Clinic",
  "address": "123 Street",
  "phone": "+1234567890",
  "email": "clinic@example.com",
  "currency": "USD"
}
```

### Get Branches
```bash
GET /all-branch
```

---

## Client Management

### List Clients
```bash
GET /clients
```

### Create Client
```bash
POST /clients

{
  "name": "Lab XYZ",
  "email": "lab@xyz.com",
  "phone": "+1234567890",
  "address": "789 Lab Street",
  "contact_person": "John Manager"
}
```

### Update Client
```bash
PUT /clients/1

{
  "name": "Updated Lab Name",
  "email": "updated@xyz.com"
}
```

### Delete Client
```bash
DELETE /clients/1
```

---

## Common Query Parameters

| Parameter | Type | Example | Use Case |
|-----------|------|---------|----------|
| branch_id | number | ?branch_id=1 | Filter by branch |
| page | number | ?page=1 | Pagination |
| per_page | number | ?per_page=20 | Records per page |
| status | string | ?status=Active | Filter by status |
| date | string | ?date=2026-08-20 | Filter by specific date |
| date_from | string | ?date_from=2026-01-01 | Date range start |
| date_to | string | ?date_to=2026-08-31 | Date range end |
| search | string | ?search=cavity | Text search |
| sort_by | string | ?sort_by=date | Sort field |
| sort_order | string | ?sort_order=desc | Sort order (asc/desc) |

---

## Status Enums

### Appointment Status
```
Scheduled, Completed, Cancelled, No-Show
```

### Invoice Status
```
Draft, Issued, Paid, Overdue, Cancelled
```

### Patient Status
```
Active, Inactive, Suspended
```

### Employee Status
```
Active, Inactive, Terminated
```

### Leave Status
```
Pending, Approved, Rejected, Cancelled
```

### Lab Order Status
```
Pending, In Progress, Completed, Cancelled
```

### Payroll Status
```
Draft, Pending, Approved, Paid, Rejected
```

---

## Tooth ID Reference

### Upper Teeth (Maxilla)
```
Right:  18, 17, 16, 15, 14, 13, 12, 11
Left:   21, 22, 23, 24, 25, 26, 27, 28
```

### Lower Teeth (Mandible)
```
Left:   31, 32, 33, 34, 35, 36, 37, 38
Right:  48, 47, 46, 45, 44, 43, 42, 41
```

---

## Tooth Surface Codes

```
O - Occlusal (top/chewing surface)
B - Buccal (toward cheek)
L - Lingual (toward tongue)
M - Mesial (toward midline)
D - Distal (away from midline)
I - Incisal (cutting edge)
```

---

## Pocket Depth Abbreviations

```
pb - Palatal/Buccal
db - Distal Buccal
mb - Mesial Buccal
dl - Distal Lingual
bl - Buccal Lingual
ml - Mesial Lingual
```

---

## Header Reference

### Required Headers
```
Authorization: Bearer {token}
Content-Type: application/json
```

### Optional Headers
```
X-Branch-Id: 1
X-Request-Id: unique-id-for-tracking
X-API-Version: v1
```

### Response Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1692518400
Content-Type: application/json
```

---

## Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | No/invalid token | Re-login and get new token |
| 403 Forbidden | User lacks permission | Check user role and branch |
| 404 Not Found | Resource doesn't exist | Verify ID/endpoint path |
| 422 Validation Error | Invalid input data | Check error field messages |
| 429 Rate Limited | Too many requests | Wait and retry |
| 500 Server Error | Backend failure | Retry with exponential backoff |
| Timeout | Request too slow | Check network, increase timeout |

---

## cURL Examples

### Login
```bash
curl -X POST "https://stagingapi.poslycloud.com/api/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Get Patients
```bash
curl -X GET "https://stagingapi.poslycloud.com/api/patients?branch_id=1" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

### Create Invoice
```bash
curl -X POST "https://stagingapi.poslycloud.com/api/invoices" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "1",
    "amount": 500.00,
    "status": "Issued"
  }'
```

---

## TypeScript Types Reference

### Patient
```typescript
type Patient = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string; // YYYY-MM-DD
  status: 'Active' | 'Inactive';
  branchId: string;
  dentalRecords: DentalRecord[];
  treatmentPlans: Treatment[];
  invoices: Invoice[];
}
```

### Appointment
```typescript
type Appointment = {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM AM/PM
  treatment: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  branchId: string;
}
```

### Invoice
```typescript
type Invoice = {
  id: string;
  patientId: string;
  patientName: string;
  amount: number;
  paidAmount: number;
  status: 'Draft' | 'Issued' | 'Paid' | 'Overdue';
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  treatments: Treatment[];
  branchId: string;
}
```

---

## Workflow Quick Start

### New Patient + Appointment + Invoice

1. **Create Patient**
   ```bash
   POST /patients
   ```

2. **Create Appointment**
   ```bash
   POST /appointments
   ```

3. **Add Dental Record**
   ```bash
   PATCH /patients/{id}/dental-records
   ```

4. **Create Invoice**
   ```bash
   POST /invoices
   ```

5. **Record Payment**
   ```bash
   POST /invoices/{id}/payments
   ```

---

## Debugging Tips

### Enable Request Logging
```typescript
customAxios.interceptors.request.use(config => {
  console.log('REQUEST:', {
    method: config.method,
    url: config.url,
    data: config.data
  });
  return config;
});
```

### Enable Response Logging
```typescript
customAxios.interceptors.response.use(
  response => {
    console.log('RESPONSE:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  error => {
    console.error('ERROR:', {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);
```

### Check Network in Browser
1. Open DevTools (F12)
2. Go to Network tab
3. Make API request
4. Click request to see:
   - Headers
   - Request payload
   - Response data
   - Timing

---

## Performance Benchmarks

| Operation | Target Time | Timeout |
|-----------|-------------|---------|
| List items (per_page=20) | < 500ms | 5000ms |
| Get single item | < 200ms | 3000ms |
| Create item | < 1000ms | 5000ms |
| Update item | < 800ms | 5000ms |
| Delete item | < 500ms | 3000ms |
| Login | < 2000ms | 10000ms |
| File upload | < 10000ms | 30000ms |

---

**End of Quick Reference**
