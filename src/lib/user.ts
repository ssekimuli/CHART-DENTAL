import type { EmployeeRole, CurrentUser, Permission } from "./types";

const allPermissions: Permission[] = [
    'dashboard:read', 'queue:read', 
    'patients:read', 'patients:create', 'patients:update', 'patients:delete', 
    'charting:read', 'charting:update', 'periodontal:read', 'periodontal:update', 
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

export function getCurrentUser(): CurrentUser | null {
    if (typeof window === 'undefined') {
        return null;
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

export function hasPermission(permission: Permission): boolean {
    if (typeof window === 'undefined') {
        return false; // Safest fallback for SSR
    }
    const user = getCurrentUser();
    if (!user) {
        return false;
    }
    return user.permissions.includes(permission);
}

export function hasRole(role: EmployeeRole | EmployeeRole[]): boolean {
    if (typeof window === 'undefined') {
        return false; // Safest fallback for SSR
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
