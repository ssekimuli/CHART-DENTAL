import type { Patient, Appointment, Invoice, ChartData } from "@/lib/types";

export const patients: Patient[] = [
  {
    id: "1",
    name: "John Doe",
    avatar: "https://picsum.photos/seed/p1/200/200",
    email: "john.doe@example.com",
    dateOfBirth: "1985-05-20",
    lastVisit: "2024-05-10",
    status: "Active",
    dentalRecords: [
      { toothId: 18, condition: "Healthy", notes: "" },
      { toothId: 17, condition: "Filling", notes: "Amalgam filling from 2015." },
      { toothId: 16, condition: "Caries", notes: "Distal caries, requires attention." },
      { toothId: 26, condition: "Crown", notes: "Porcelain crown placed in 2020." },
      { toothId: 36, condition: "Missing", notes: "Extracted in 2010." },
      { toothId: 48, condition: "Fracture", notes: "Mesial-occlusal fracture." },
    ],
    treatmentPlans: [
      { id: "t1", procedure: "Filling for #16", tooth: 16, status: "Proposed", cost: 250, date: "2024-06-01" },
      { id: "t2", procedure: "Crown for #48", tooth: 48, status: "Proposed", cost: 1200, date: "2024-06-01" },
    ],
    imaging: [
      "https://picsum.photos/seed/xray1/800/600",
      "https://picsum.photos/seed/xray2/800/600",
    ],
    history: "Patient has a history of grinding teeth (bruxism). Regular check-ups every 6 months. No known allergies. Previous treatments include multiple fillings and one extraction."
  },
  {
    id: "2",
    name: "Jane Smith",
    avatar: "https://picsum.photos/seed/p2/200/200",
    email: "jane.smith@example.com",
    dateOfBirth: "1992-08-15",
    lastVisit: "2024-04-22",
    status: "Active",
    dentalRecords: [],
    treatmentPlans: [],
    imaging: [],
    history: "Good oral hygiene. No major issues reported."
  },
  {
    id: "3",
    name: "Peter Jones",
    avatar: "https://picsum.photos/seed/p3/200/200",
    email: "peter.jones@example.com",
    dateOfBirth: "1978-11-30",
    lastVisit: "2023-12-15",
    status: "Inactive",
    dentalRecords: [],
    treatmentPlans: [],
    imaging: [],
    history: "Requires follow-up for periodontal scaling."
  },
];

export const recentPatients = patients.slice(0, 5);

export const appointments: Appointment[] = [
  { id: "a1", patientName: "John Doe", patientId: "1", treatment: "Check-up", status: "Scheduled", date: "2024-07-20", time: "10:00 AM" },
  { id: "a2", patientName: "Jane Smith", patientId: "2", treatment: "Cleaning", status: "Scheduled", date: "2024-07-21", time: "11:30 AM" },
  { id: "a3", patientName: "Mike Williams", patientId: "4", treatment: "Filling", status: "Completed", date: "2024-07-15", time: "02:00 PM" },
  { id: "a4", patientName: "Sarah Brown", patientId: "5", treatment: "Consultation", status: "Cancelled", date: "2024-07-14", time: "09:00 AM" },
];

export const invoices: Invoice[] = [
  { id: "inv1", patientName: "John Doe", patientId: "1", amount: 250, status: "Pending", issueDate: "2024-05-10", dueDate: "2024-06-10" },
  { id: "inv2", patientName: "Jane Smith", patientId: "2", amount: 150, status: "Paid", issueDate: "2024-04-22", dueDate: "2024-05-22" },
  { id: "inv3", patientName: "Mike Williams", patientId: "4", amount: 300, status: "Paid", issueDate: "2024-07-15", dueDate: "2024-08-15" },
  { id: "inv4", patientName: "John Doe", patientId: "1", amount: 75, status: "Overdue", issueDate: "2024-03-01", dueDate: "2024-04-01" },
];

export const chartData: ChartData[] = [
    { month: "January", revenue: 18600 },
    { month: "February", revenue: 30500 },
    { month: "March", revenue: 23700 },
    { month: "April", revenue: 27800 },
    { month: "May", revenue: 45231 },
    { month: "June", revenue: 34900 },
];
