

import type { EmployeeRole, CurrentUser, Permission } from "./types";

const allPermissions: Permission[] = [
    'dashboard:read', 'queue:read', 
    'patients:read', 'patients:create', 'patients:update', 'patients:delete', 
    'charting:read', 'charting:update', 
    'appointments:read', 'appointments:create', 'appointments:update', 'appointments:delete', 
    'billing:read', 'billing:create', 'billing:update', 'billing:delete', 
    'accounting:read', 'accounting:create', 
    'inventory:read', 'inventory:create', 'inventory:update', 
    'laboratory:read', 'laboratory:create', 'laboratory:update', 
    'hrm:read', 'hrm:create', 'hrm:update', 'hrm:delete', 
    'branches:read', 'branches:create', 
    'reports:read', 
    'settings:manage', 
    'profile:read', 'profile:update'
];

const defaultUser: CurrentUser = {
  role: 'Super Admin',
  branchId: '',
  branchName: '',
  email: 'lisa.cuddy@example.com',
  name: 'Dr. Lisa Cuddy',
  avatar: 'https://picsum.photos/seed/emp1/200/200',
  permissions: allPermissions
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

export function 
setCurrentUser(user: CurrentUser, token: string): void {
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

export function hasPermission(permission: Permission): boolean {
    if (typeof window === 'undefined') {
        return true; // Allow all for SSR to prevent layout shifts
    }
    const user = getCurrentUser();
    if (!user) {
        return false;
    }
    return user.permissions.includes(permission);
}

export function hasRole(role: EmployeeRole | EmployeeRole[]): boolean {
    if (typeof window === 'undefined') {
        return true; // Allow all for SSR to prevent layout shifts
    }
    const user = getCurrentUser();
    if (!user) {
        return false;
    }
    if (Array.isArray(role)) {
        return role.includes(user.role);
    }
    return user.role === role;
}

export function HasRole(role: EmployeeRole | EmployeeRole[]): boolean {
    return hasRole(role);
}

