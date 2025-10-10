
import type { EmployeeRole, CurrentUser } from "./types";

const defaultUser: CurrentUser = {
  role: 'Super Admin',
  branchId: 'b1',
  email: 'lisa.cuddy@example.com',
  name: 'Dr. Lisa Cuddy',
  avatar: 'https://picsum.photos/seed/emp1/200/200'
};

export function getCurrentUser(): CurrentUser | null {
    if (typeof window === 'undefined') {
        return defaultUser; // Return default for SSR
    }
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
        try {
            return JSON.parse(userJson);
        } catch (e) {
            return defaultUser;
        }
    }
    return defaultUser;
}

export function setCurrentUser(user: CurrentUser): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(user));
    }
}

export function clearCurrentUser(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('currentUser');
    }
}

// Fallback for server-side rendering
export const currentUser = getCurrentUser() || defaultUser;
