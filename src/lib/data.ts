
import type { Patient, Appointment, Invoice, ChartData, Employee, Payroll, Branch, InventoryItem, LaboratoryOrder, SystemTreatment, PaymentMethod, PaymentTransaction, AttendanceRecord, LeaveRequest, StaffAdvance, Expense, RolePermissions } from "@/lib/types";

export const branches: Branch[] = [
 
];

export const treatments: SystemTreatment[] = [
    
];

export let patients: Patient[] = [
 
];

const today = new Date().toISOString().split('T')[0];
export let appointments: Appointment[] = [
  ];

export let invoices: Invoice[] = [
  
];

export const chartData: ChartData[] = [
   ];

export const employees: Employee[] = [
 ];

export let payrolls: Payroll[] = [
   
];

export let attendance: AttendanceRecord[] = [
   ];

export let inventory: InventoryItem[] = [
   ];

export let labOrders: LaboratoryOrder[] = [
   ];

export let leaveRequests: LeaveRequest[] = [
 ];

export let staffAdvances: StaffAdvance[] = [
  ]

  
export let expenses: Expense[] = [
   
   ];

export let roles: RolePermissions[] = [
  ];
