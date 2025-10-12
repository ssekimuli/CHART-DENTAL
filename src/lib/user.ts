
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
            return null; // Return null if parsing fails
        }
    }
    return null;
}

export function setCurrentUser(user: CurrentUser, token: string): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('authToken', token);
    }
}

export function getAuthToken(): string | null {
    if (typeof window === 'undefined') {
        return null;
    }
    return localStorage.getItem('authToken');
}

export function clearCurrentUser(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
    }
}

// Fallback for server-side rendering, although it should ideally be null until client-side hydration
export const currentUser = getCurrentUser() || defaultUser;
