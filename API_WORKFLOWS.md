# CHART DENTAL - API WORKFLOWS & IMPLEMENTATION GUIDE

This document provides workflow diagrams, sequence flows, and implementation examples for common operations.

---

## Table of Contents

1. [Authentication Workflow](#authentication-workflow)
2. [Patient Management Workflow](#patient-management-workflow)
3. [Appointment Booking Workflow](#appointment-booking-workflow)
4. [Invoice & Payment Workflow](#invoice--payment-workflow)
5. [Payroll Processing Workflow](#payroll-processing-workflow)
6. [Laboratory Order Workflow](#laboratory-order-workflow)
7. [Dental Charting Workflow](#dental-charting-workflow)

---

## Authentication Workflow

### Sequence Diagram:
```
User                    Client App              API Server          Database
 |                          |                       |                   |
 |-- Enter Credentials ----->|                       |                   |
 |                          |                       |                   |
 |                          |-- POST /login ------->|                   |
 |                          |                       |-- Query User ---->|
 |                          |                       |<-- User Data -----|
 |                          |                       |                   |
 |                          |<-- Token, User Data --|                   |
 |                          |                       |                   |
 |<-- Redirect Dashboard ----|                       |                   |
 |                          |                       |                   |
 |-- Make API Request ------>|                       |                   |
 |                          |-- GET /patients ----->|                   |
 |                          |(Token in Header)      |-- Validate Token--|
 |                          |                       |<-- Valid ---------|
 |                          |<-- Patient Data ------|                   |
 |<-- Show Patients ---------|                       |                   |
```

### Implementation Example:

```typescript
// Login Flow
const login = async (email: string, password: string) => {
  try {
    const response = await customAxios.post('/login', { 
      email, 
      password 
    });
    
    const { user, token } = response.data;
    
    // Store token in secure storage
    localStorage.setItem('auth_token', token);
    
    // Set default header for future requests
    customAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Store user info
    setCurrentUser(user, token);
    
    return user;
  } catch (error) {
    console.error('Login failed:', error);
    clearCurrentUser();
    return null;
  }
};

// Automatic Token Refresh
customAxios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      clearCurrentUser();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## Patient Management Workflow

### User Workflows:

#### A. Add New Patient
```
Receptionist                 Client App              API Server
    |                            |                       |
    |-- Click "Add Patient" ----->|                       |
    |                            |-- Load Form ----       |
    |<-- Show Form ---|            |                   |
    |                            |                       |
    |-- Fill Form & Submit ------->|                       |
    |                            |-- Validate Fields --   |
    |                            |-- Check Duplicates --->|
    |                            |                       |
    |                            |<-- Success ----------|
    |                            |                       |
    |<-- Show Success Message ----|                       |
    |                            |-- GET /patients ------>|
    |                            |<-- Updated List -----|
```

#### B. View Patient Profile
```
Doctor                      Client App              API Server
    |                            |                       |
    |-- Select Patient ---------->|                       |
    |                            |-- GET /patients/{id}->|
    |                            |                       |
    |                            |<-- Patient Data -----|
    |<-- Show Profile ------------|                       |
    |                            |                       |
    |-- Request Dental Records --->|                       |
    |                            |-- Parse Records --    |
    |<-- Show Charts -------------|                       |
```

### Implementation Example:

```typescript
// Create Patient
const createPatient = async (patientData: Omit<Patient, 'id'>) => {
  try {
    // Validate before sending
    validatePatientData(patientData);
    
    const response = await customAxios.post('/patients', {
      first_name: patientData.first_name,
      last_name: patientData.last_name,
      email: patientData.email,
      phone: patientData.phone,
      address: patientData.address,
      gender: patientData.gender,
      date_of_birth: patientData.dateOfBirth,
      branch_id: patientData.branchId,
      status: 'Active'
    });
    
    // Refresh patient list
    await getPatients();
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 422) {
      // Handle validation errors
      const errors = error.response.data.errors;
      displayValidationErrors(errors);
    }
    throw error;
  }
};

// Validation Helper
const validatePatientData = (data: any) => {
  const errors: Record<string, string[]> = {};
  
  if (!data.first_name?.trim()) {
    errors.first_name = ['First name is required'];
  }
  
  if (!isValidEmail(data.email)) {
    errors.email = ['Invalid email format'];
  }
  
  if (!isValidPhone(data.phone)) {
    errors.phone = ['Invalid phone format'];
  }
  
  if (new Date(data.dateOfBirth) > new Date()) {
    errors.dateOfBirth = ['Date of birth cannot be in future'];
  }
  
  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }
};
```

---

## Appointment Booking Workflow

### Complete Workflow:
```
Patient/Receptionist        Client App              API Server          Database
    |                            |                       |                   |
    |-- Click "Book Appointment"->|                       |                   |
    |                            |                       |                   |
    |                            |-- GET /doctors ------->|                   |
    |                            |<-- Doctors List -------|                   |
    |<-- Show Doctor List -------|                       |                   |
    |                            |                       |                   |
    |-- Select Doctor ----------->|                       |                   |
    |                            |-- GET /patients ---    |
    |<-- Show Available Slots ----|                       |                   |
    |                            |                       |                   |
    |-- Select Date & Time ------>|                       |                   |
    |                            |-- POST /appointments ->|                   |
    |                            |   Payload:            |                   |
    |                            |   {                   |                   |
    |                            |     patient_id,       |                   |
    |                            |     doctor_id,        |-- Validate ---    |
    |                            |     date,             |<-- Valid --      |
    |                            |     time,             |                   |
    |                            |     treatment         |-- Create Record ->|
    |                            |   }                   |<-- Success -------|
    |                            |<-- Appointment Data --|                   |
    |<-- Confirmation ------------|                       |                   |
    |-- Request Reminder -------->|                       |                   |
    |<-- Email Sent -------------|                       |                   |
```

### Implementation Example:

```typescript
// Step 1: Get available doctors
const getAvailableDoctors = async (branchId: string | number) => {
  try {
    const response = await customAxios.get('/doctors', {
      params: { branch_id: branchId }
    });
    return response.data.filter(doc => doc.status === 'Active');
  } catch (error) {
    console.error('Failed to fetch doctors:', error);
    return [];
  }
};

// Step 2: Get available slots (you might need to add this endpoint)
const getAvailableSlots = async (doctorId: number, date: string) => {
  // This could be a separate API call or computed locally
  const appointments = await getAppointments({
    doctor_id: doctorId,
    date: date
  });
  
  const booked = new Set(appointments.map(a => a.time));
  const slots = generateTimeSlots('09:00', '17:00', 30); // 30 min intervals
  
  return slots.filter(slot => !booked.has(slot));
};

// Step 3: Create appointment
const bookAppointment = async (appointmentData: {
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  treatment: string;
  branchId: string;
}) => {
  try {
    // Validate appointment data
    validateAppointment(appointmentData);
    
    const response = await customAxios.post('/appointments', {
      patient_id: appointmentData.patientId,
      patient_name: appointmentData.patientName,
      doctor_id: appointmentData.doctorId,
      doctor_name: appointmentData.doctorName,
      date: appointmentData.date,
      time: appointmentData.time,
      treatment: appointmentData.treatment,
      branch_id: appointmentData.branchId
    });
    
    // Send confirmation email/SMS
    await sendAppointmentConfirmation(response.data);
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors;
        throw new ValidationError(validationErrors);
      }
    }
    throw error;
  }
};

// Appointment validation
const validateAppointment = (data: any) => {
  const now = new Date();
  const appointmentDateTime = new Date(`${data.date}T${convertTo24Hour(data.time)}`);
  
  if (appointmentDateTime <= now) {
    throw new Error('Cannot book appointment in the past');
  }
  
  if (!data.patientId || !data.doctorId) {
    throw new Error('Patient and doctor are required');
  }
  
  // Check if doctor is available on that date
  const dayOfWeek = appointmentDateTime.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
    throw new Error('Clinic closed on weekends');
  }
};
```

---

## Invoice & Payment Workflow

### Payment Processing Flow:
```
Patient                    Client App              API Server          Payment Gateway
    |                           |                       |                       |
    |-- View Invoice ----------->|                       |                       |
    |                           |-- GET /invoices/{id}->|                       |
    |                           |<-- Invoice Data ------|                       |
    |<-- Show Invoice ----------|                       |                       |
    |                           |                       |                       |
    |-- Click "Pay Now" -------->|                       |                       |
    |                           |-- Show Payment Form --|                       |
    |<-- Enter Card Details ----|                       |                       |
    |                           |                       |                       |
    |-- Submit Payment -------->|                       |                       |
    |                           |-- POST Payment ------>|                       |
    |                           |                       |-- Process Payment ---->|
    |                           |                       |<-- Charge Successful --|
    |                           |                       |                       |
    |                           |<-- Payment Confirmed--|                       |
    |<-- Show Receipt ----------|                       |                       |
    |                           |-- Update Invoice ---->|                       |
    |                           |   Status: Paid        |-- Update DB --------->|
    |                           |<-- Success ----------|<-- Confirmed ---------|
```

### Implementation Example:

```typescript
// Fetch Invoice
const fetchInvoice = async (invoiceId: string | number) => {
  try {
    const response = await customAxios.get(`/invoices/${invoiceId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error('Invoice not found');
    }
    throw error;
  }
};

// Process Payment
const processPayment = async (invoiceId: string, paymentData: {
  amount: number;
  method: 'Credit Card' | 'Cash' | 'Check' | 'Insurance';
  referenceNumber?: string;
  notes?: string;
}) => {
  try {
    // Validate payment amount
    const invoice = await fetchInvoice(invoiceId);
    const remainingBalance = invoice.amount - invoice.paidAmount;
    
    if (paymentData.amount > remainingBalance) {
      throw new Error('Payment exceeds outstanding balance');
    }
    
    if (paymentData.amount <= 0) {
      throw new Error('Payment amount must be positive');
    }
    
    // Process payment via API
    const response = await customAxios.post(`/invoices/${invoiceId}/payments`, {
      amount: paymentData.amount,
      method: paymentData.method,
      reference_number: paymentData.referenceNumber,
      notes: paymentData.notes
    });
    
    // Store payment record
    const paymentRecord = {
      invoiceId,
      amount: paymentData.amount,
      date: new Date().toISOString(),
      method: paymentData.method,
      status: 'Completed'
    };
    
    return paymentRecord;
  } catch (error) {
    console.error('Payment processing failed:', error);
    throw error;
  }
};

// Calculate Invoice Totals
const calculateInvoiceTotals = (invoice: Invoice) => {
  const treatmentTotal = invoice.treatments?.reduce((sum, t) => sum + t.cost, 0) || 0;
  const chargesTotal = invoice.otherCharges?.reduce((sum, c) => sum + c.amount, 0) || 0;
  
  const subtotal = treatmentTotal + chargesTotal;
  const tax = subtotal * 0.1; // 10% tax
  const discount = invoice.discount || 0;
  
  const grossTotal = subtotal + tax - discount;
  const insurancePay = Math.min(invoice.insuranceCoverage || 0, grossTotal);
  const patientOwes = grossTotal - insurancePay;
  
  return {
    treatmentTotal,
    chargesTotal,
    subtotal,
    tax,
    discount,
    grossTotal,
    insurancePay,
    patientOwes,
    paid: invoice.paidAmount || 0,
    balance: patientOwes - (invoice.paidAmount || 0)
  };
};
```

---

## Payroll Processing Workflow

### Monthly Payroll Cycle:
```
HR Manager                  Client App              API Server          Database
    |                           |                       |                   |
    |-- Month End (30th) ------->|                       |                   |
    |                           |                       |                   |
    |-- Review Attendance ------>|                       |                   |
    |                           |-- GET /attendance ----->|                   |
    |                           |<-- Attendance Records--|                   |
    |<-- Show Records ----------|                       |                   |
    |                           |                       |                   |
    |-- Calculate Payroll ------>|                       |                   |
    |                           |-- GET /employees ----->|                   |
    |                           |<-- Salary Data --------|                   |
    |<-- Show Calculations ------|                       |                   |
    |                           |                       |                   |
    |-- Approve Payroll -------->|                       |                   |
    |                           |-- POST /payrolls ----->|                   |
    |                           |   {                   |                   |
    |                           |     employee_id,      |-- Create Record -->|
    |                           |     gross_pay,        |<-- Success --------|
    |                           |     deductions,       |                   |
    |                           |     net_pay,          |-- Update Balance ->|
    |                           |     pay_date,         |<-- Confirmed ------|
    |                           |     status: Approved  |                   |
    |                           |   }                   |                   |
    |                           |<-- Confirmation ------|                   |
    |<-- Show Summary ----------|                       |                   |
```

### Implementation Example:

```typescript
// Calculate Payroll for Employee
const calculatePayroll = async (employeeId: string, payPeriod: string) => {
  try {
    // Get employee salary
    const employee = await getEmployeeById(employeeId);
    const baseSalary = employee.employee.salary;
    
    // Get attendance records
    const [year, month] = payPeriod.split('-');
    const attendance = await getAttendance();
    
    // Calculate working days
    const attendanceThisMonth = attendance.filter(record => {
      const recordMonth = record.date.substring(0, 7);
      return record.employeeId === employeeId && 
             recordMonth === payPeriod &&
             record.status === 'Present';
    });
    
    const totalWorkingDays = 22; // Assuming 22 working days per month
    const daysPresent = attendanceThisMonth.length;
    const daysAbsent = totalWorkingDays - daysPresent;
    
    // Calculate amounts
    const perDayAmount = baseSalary / totalWorkingDays;
    const grossPay = baseSalary; // Or adjusted based on attendance
    
    // Deductions
    const taxDeduction = grossSalary * 0.15; // 15% tax
    const otherDeductions = 0;
    const totalDeductions = taxDeduction + otherDeductions;
    
    const netPay = grossPay - totalDeductions;
    
    return {
      employeeId,
      employeeName: employee.employee.name,
      payPeriod,
      baseSalary,
      grossPay,
      daysPresent,
      daysAbsent,
      tax: taxDeduction,
      deductions: totalDeductions,
      netPay,
      status: 'Calculated'
    };
  } catch (error) {
    console.error('Payroll calculation failed:', error);
    throw error;
  }
};

// Submit Payroll
const submitPayroll = async (payrollData: {
  employeeId: string;
  payPeriod: string;
  grossPay: number;
  deductions: number;
  netPay: number;
  branchId: string;
}) => {
  try {
    // Validate calculations
    if (payrollData.netPay !== (payrollData.grossPay - payrollData.deductions)) {
      throw new Error('Payroll calculations are incorrect');
    }
    
    if (payrollData.netPay < 0) {
      throw new Error('Net pay cannot be negative');
    }
    
    const response = await customAxios.post('/management/payrolls', {
      employee_id: payrollData.employeeId,
      pay_period: payrollData.payPeriod,
      gross_pay: payrollData.grossPay,
      deductions: payrollData.deductions,
      net_pay: payrollData.netPay,
      branch_id: payrollData.branchId,
      status: 'Pending'
    });
    
    return response.data;
  } catch (error) {
    console.error('Payroll submission failed:', error);
    throw error;
  }
};

// Approve Payroll (HR Manager)
const approvePayroll = async (payrollId: string) => {
  try {
    const response = await customAxios.patch(
      `/management/payrolls/${payrollId}`,
      { status: 'Approved' }
    );
    
    return response.data;
  } catch (error) {
    console.error('Payroll approval failed:', error);
    throw error;
  }
};
```

---

## Laboratory Order Workflow

### Lab Order Lifecycle:
```
Doctor                     Client App              API Server      Lab System
    |                          |                       |                 |
    |-- Create Lab Order ------>|                       |                 |
    |                          |-- Fill Order Form -    |                 |
    |<-- Show Form ------------|                       |                 |
    |                          |                       |                 |
    |-- Submit Order ---------->|                       |                 |
    |                          |-- POST /lab-orders --->|                 |
    |                          |<-- Order Created ------|                 |
    |<-- Confirmation ---------|                       |                 |
    |                          |                       |                 |
    |                          |                       |--- Send Email -->|
    |                          |                       |<-- Acknowledged -|
    |                          |                       |                 |
    |-- Check Status ---------->|                       |                 |
    |                          |-- GET /lab-orders ---->|                 |
    |                          |   Status: In Progress  |                 |
    |<-- Show Status ----------|                       |                 |
    |                          |                       |                 |
    |                          |                       |-- Finish Work -->|
    |                          |                       |<-- Notify ------|
    |                          |                       |                 |
    |-- View Results ---------->|                       |                 |
    |                          |-- GET /lab-orders ---->|                 |
    |                          |   Status: Completed    |                 |
    |<-- Show Result Images ----|                       |                 |
```

### Implementation Example:

```typescript
// Create Lab Order
const createLabOrder = async (orderData: {
  patientName: string;
  tooth: string;
  item: string; // Crown, Bridge, Dentures, etc.
  clientId: string;
  doctorId: string;
  dueDate: string;
  branchId: string;
  notes?: string;
}) => {
  try {
    // Validate order data
    if (!orderData.patientName?.trim()) {
      throw new Error('Patient name is required');
    }
    
    if (!orderData.item?.trim()) {
      throw new Error('Item type is required');
    }
    
    const dueDateTime = new Date(orderData.dueDate);
    if (dueDateTime <= new Date()) {
      throw new Error('Due date must be in the future');
    }
    
    // Create order
    const response = await customAxios.post('/management/lab-orders', {
      patient_name: orderData.patientName,
      tooth: orderData.tooth,
      item: orderData.item,
      client_id: orderData.clientId,
      doctor_id: orderData.doctorId,
      due_date: orderData.dueDate,
      branch_id: orderData.branchId,
      notes: orderData.notes,
      status: 'Pending'
    });
    
    return response.data;
  } catch (error) {
    console.error('Lab order creation failed:', error);
    throw error;
  }
};

// Track Lab Order Status
const trackLabOrder = async (orderId: string) => {
  try {
    const response = await customAxios.get(`/management/lab-orders/${orderId}`);
    const order = response.data;
    
    const statusTimeline = [
      { status: 'Pending', completed: order.status !== 'Pending' },
      { status: 'In Progress', completed: ['In Progress', 'Completed'].includes(order.status) },
      { status: 'Completed', completed: order.status === 'Completed' }
    ];
    
    const daysRemaining = Math.ceil(
      (new Date(order.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return {
      order,
      statusTimeline,
      daysRemaining,
      isOverdue: daysRemaining < 0
    };
  } catch (error) {
    console.error('Failed to track order:', error);
    throw error;
  }
};

// Update Lab Order Status
const updateLabOrderStatus = async (orderId: string, newStatus: string) => {
  try {
    const validStatuses = ['Pending', 'In Progress', 'Completed'];
    
    if (!validStatuses.includes(newStatus)) {
      throw new Error('Invalid status');
    }
    
    const response = await customAxios.patch(
      `/management/lab-orders/${orderId}/status`,
      { status: newStatus }
    );
    
    return response.data;
  } catch (error) {
    console.error('Status update failed:', error);
    throw error;
  }
};
```

---

## Dental Charting Workflow

### Clinical Examination Flow:
```
Doctor                     Client App              Charting UI
    |                          |                       |
    |-- Select Patient -------->|                       |
    |                          |-- Load Patient Data -->|
    |                          |<-- Initialize Charts -|
    |<-- Show Tooth Chart ------|                       |
    |                          |                       |
    |-- Examine Tooth 11 ------>|                       |
    |                          |-- Select Tooth 11 --->|
    |<-- Show Tooth Editor -----|                       |
    |                          |                       |
    |-- Mark Cavity on Surface O->|                       |
    |                          |-- Add Notation ------->|
    |<-- Visual Confirmation ----|                       |
    |                          |                       |
    |-- Add Notes ------------->|                       |
    |                          |-- Store Notes -------->|
    |<-- Confirmation ---------|                       |
    |                          |                       |
    |-- Save & Move to Next --->|                       |
    |                          |-- POST /dental-records->|
    |                          |<-- Success ----------|
```

### Implementation Example:

```typescript
// Dental Records Data Structure
interface DentalRecordUpdate {
  patientId: string;
  toothId: number;
  condition: string; // Cavity, Cracked, Missing, etc.
  surfaces?: Record<string, string>; // O, B, L, M, D, I mappings
  notes?: string;
}

// Add Dental Record
const addDentalRecord = async (record: DentalRecordUpdate) => {
  try {
    // Validate tooth ID (1-32)
    if (record.toothId < 1 || record.toothId > 32) {
      throw new Error('Invalid tooth ID (must be 1-32)');
    }
    
    // Validate surfaces
    const validSurfaces = ['O', 'B', 'L', 'M', 'D', 'I'];
    if (record.surfaces) {
      for (const surface of Object.keys(record.surfaces)) {
        if (!validSurfaces.includes(surface)) {
          throw new Error(`Invalid surface code: ${surface}`);
        }
      }
    }
    
    // Update patient record
    const response = await customAxios.patch(
      `/patients/${record.patientId}/dental-records`,
      {
        tooth_id: record.toothId,
        condition: record.condition,
        surfaces: record.surfaces,
        notes: record.notes
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Failed to add dental record:', error);
    throw error;
  }
};

// Add Periodontal Record
const addPeriodontalRecord = async (data: {
  patientId: string;
  toothId: number;
  pockets: Record<string, number>; // pb, db, mb, dl, bl, ml
  recession?: number;
  mobility?: string;
  furcation?: string;
}) => {
  try {
    // Validate pocket depths (0-10mm)
    for (const [key, depth] of Object.entries(data.pockets)) {
      if (depth < 0 || depth > 10) {
        throw new Error(`Invalid pocket depth for ${key}: ${depth}mm`);
      }
    }
    
    // Validate mobility (0-3)
    if (data.mobility && ![0, 1, 2, 3].includes(parseInt(data.mobility))) {
      throw new Error('Invalid mobility grade');
    }
    
    const response = await customAxios.patch(
      `/patients/${data.patientId}/periodontal-records`,
      {
        tooth_id: data.toothId,
        pockets: data.pockets,
        recession: data.recession,
        mobility: data.mobility,
        furcation: data.furcation
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Periodontal record failed:', error);
    throw error;
  }
};

// Add Orthodontic Record
const addOrthodonticRecord = async (data: {
  patientId: string;
  appliance: string;
  applianceLocation: string;
  treatmentPhase: string;
  wireSize: string;
  archwireMaterial: string;
  elastics: string;
  compliance: string;
  oralHygiene: string;
  nextVisitGoals: string;
  monthsInTreatment: number;
  notes?: string;
}) => {
  try {
    // Validate appliance types
    const validAppliances = ['Fixed', 'Removable', 'Functional', 'Lingual'];
    if (!validAppliances.includes(data.appliance)) {
      throw new Error('Invalid appliance type');
    }
    
    // Validate months in treatment
    if (data.monthsInTreatment < 0) {
      throw new Error('Months in treatment cannot be negative');
    }
    
    const response = await customAxios.post(
      `/patients/${data.patientId}/orthodontic-records`,
      {
        appliance: data.appliance,
        appliance_location: data.applianceLocation,
        treatment_phase: data.treatmentPhase,
        wire_size: data.wireSize,
        archwire_material: data.archwireMaterial,
        elastics: data.elastics,
        compliance: data.compliance,
        oral_hygiene: data.oralHygiene,
        next_visit_goals: data.nextVisitGoals,
        months_in_treatment: data.monthsInTreatment,
        notes: data.notes
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Orthodontic record failed:', error);
    throw error;
  }
};
```

---

## Error Handling Best Practices

### Retry Logic with Exponential Backoff:

```typescript
const retryWithBackoff = async (
  fn: () => Promise<any>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<any> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Only retry on 5xx errors or network timeouts
      if (axios.isAxiosError(error)) {
        if (error.response?.status && error.response.status < 500) {
          throw error; // Don't retry 4xx errors
        }
      } else if (!(error instanceof Error && error.message.includes('timeout'))) {
        throw error; // Don't retry non-network errors
      }
      
      const delay = initialDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Usage
const fetchPatientWithRetry = async (patientId: string) => {
  return retryWithBackoff(
    () => customAxios.get(`/patients/${patientId}`),
    3,
    1000
  );
};
```

### Global Error Handler:

```typescript
// Set up global error interceptor
customAxios.interceptors.response.use(
  response => response,
  error => {
    const errorResponse = {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      errors: error.response?.data?.errors || {},
      timestamp: new Date().toISOString()
    };
    
    // Log error
    console.error('API Error:', errorResponse);
    
    // Handle specific status codes
    switch (error.response?.status) {
      case 401:
        // Redirect to login
        clearCurrentUser();
        window.location.href = '/login';
        break;
        
      case 403:
        // Show permission error
        displayError('You do not have permission to perform this action');
        break;
        
      case 404:
        // Show not found error
        displayError('Resource not found');
        break;
        
      case 422:
        // Show validation errors
        displayValidationErrors(error.response.data.errors);
        break;
        
      case 500:
        // Show server error and offer retry
        displayError('Server error. Please try again later.');
        break;
    }
    
    return Promise.reject(errorResponse);
  }
);
```

---

## Performance Optimization Tips

### Caching Strategy:

```typescript
// Cache manager
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5 minutes default

  set(key: string, data: any, ttl?: number) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > (this.ttl)) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(key: string) {
    this.cache.delete(key);
  }

  invalidateAll() {
    this.cache.clear();
  }
}

// Usage
const cacheManager = new CacheManager();

const getPatients = async (branchId: string) => {
  const cacheKey = `patients_${branchId}`;
  const cached = cacheManager.get(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const data = await customAxios.get(`/patients?branch_id=${branchId}`);
  cacheManager.set(cacheKey, data);
  
  return data;
};

// Invalidate cache on create/update
const createPatient = async (patientData: any) => {
  const response = await customAxios.post('/patients', patientData);
  cacheManager.invalidate(`patients_${patientData.branch_id}`);
  return response.data;
};
```

---

## Security Best Practices

### Token Management:

```typescript
// Secure token storage
const storeToken = (token: string) => {
  // Use httpOnly cookie or secure storage (NOT localStorage for sensitive data)
  if (window.requestIdleCallback) {
    // Store in memory + sessionStorage for refresh
    sessionStorage.setItem('_token', token);
  }
};

const getToken = (): string | null => {
  return sessionStorage.getItem('_token');
};

const clearToken = () => {
  sessionStorage.removeItem('_token');
  // Also clear from memory
};

// Auto-refresh token before expiry
const refreshTokenBefore Expiry = (expiryTime: number) => {
  const refreshTime = expiryTime - (5 * 60 * 1000); // Refresh 5 min before expiry
  
  setTimeout(async () => {
    try {
      const response = await customAxios.post('/refresh-token');
      storeToken(response.data.token);
      refreshTokenBeforeExpiry(expiryTime);
    } catch (error) {
      clearCurrentUser();
    }
  }, refreshTime);
};
```

---

**End of Workflows Guide**
