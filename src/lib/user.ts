
import type { EmployeeRole } from "./types";

// Mock current user - in a real app, this would come from an auth context
export const currentUser: { role: EmployeeRole, branchId: string } = {
  role: 'Super Admin',
  branchId: 'b1',
};
