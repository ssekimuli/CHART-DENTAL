# Sidebar Access Control Specification (RBAC & PBAC)

### Comprehensive Guide to Sidebar Navigation Roles & Permissions in CHART-DENTAL

---

## 1. Overview & Architecture

The application implements a hybrid **Role-Based Access Control (RBAC)** and **Permission-Based Access Control (PBAC)** model for the primary navigation sidebar (`MainNav` component located at `src/components/dashboard/main-nav.tsx`).

### Core Concepts

1. **Role Gating (RBAC):** Restricts top-level domains to specific personas (e.g., Financial modules restricted to `Super Admin` and `Account`).
2. **Permission Gating (PBAC):** Fine-grained capabilities formatted as `resource:action` (e.g., `hrm:read`, `laboratory:read`, `branches:read`).
3. **Dynamic Group Pruning:** If all child sub-links under a parent group (such as `HRM`) are hidden due to lack of permissions/roles, the entire parent group is automatically pruned from the sidebar.
4. **Path-Based Route Highlighting:** Dynamic active state tracking supporting sub-routes and deep links.

```
+---------------------------------------------------------------------------------+
|                               CurrentUser Session                               |
|  Role: 'Dentist' | Permissions: ['patients:read', 'charting:read', 'queue:read']|
+---------------------------------------------------------------------------------+
                                      |
                                      v
+---------------------------------------------------------------------------------+
|                       Sidebar Filtering Pipeline (`MainNav`)                     |
|                                                                                 |
| 1. Role Exclusion Check:                                                        |
|    - Is `/charting` accessed by `Account` or `Receptionist`? -> [HIDE]          |
|    - Is `/billing` accessed by non-SuperAdmin / non-Account? -> [HIDE]          |
|    - Is `/hrm` accessed by non-SuperAdmin / non-HR? -> [HIDE]                   |
|    - Is `/settings` accessed by non-SuperAdmin? -> [HIDE]                       |
|                                                                                 |
| 2. Permission Evaluation:                                                       |
|    - Parent has `permission`? -> Check `hasPermission(link.permission)`         |
|    - SubLinks have `permission`? -> Filter `link.subLinks`                     |
|                                                                                 |
| 3. Clean-up & Pruning:                                                          |
|    - If group item has 0 visible sub-links -> [PRUNE ENTIRE GROUP]              |
+---------------------------------------------------------------------------------+
                                      |
                                      v
+---------------------------------------------------------------------------------+
|                           Rendered Sidebar Menu Items                           |
+---------------------------------------------------------------------------------+
```

---

## 2. Sidebar Navigation Items & Rule Definitions

Below is the complete inventory of all sidebar navigation items, their target routes, and their specific access rules:

| # | Sidebar Label | Route / Path | Icon | Gating Type | Required Role(s) / Permissions | Special Rules |
|---|---------------|--------------|------|-------------|--------------------------------|---------------|
| 1 | **Dashboard** | `/dashboard` | `LayoutDashboard` | Public (Authenticated) | Any authenticated role | Default landing page |
| 2 | **Queue** | `/queue` | `ClipboardList` | Public (Authenticated) | Any authenticated role | Patient visit queue |
| 3 | **Patients** | `/patients` | `Users` | Public (Authenticated) | Any authenticated role | Clinical & demographic records |
| 4 | **Charting** | `/charting` | `FileText` | **Role-Excluded** | All roles **EXCEPT** `Account`, `Receptionist` | Hidden from financial & front desk staff |
| 5 | **Appointments**| `/appointments` | `Calendar` | Public (Authenticated) | Any authenticated role | Appointment scheduling |
| 6 | **Billing** | `/billing` | `CreditCard` | **Role-Restricted** | `Super Admin`, `Account` | Invoices, payments & collections |
| 7 | **Insurance & Claims** | `/insurance` | `Handshake` | Public (Authenticated) | Any authenticated role | Insurance claims management |
| 8 | **Pharmacy** | `/pharmacy` | `Pill` | Public (Authenticated) | Any authenticated role | Prescriptions & dispensing |
| 9 | **Accounting** | `/accounting` | `Landmark` | **Role-Restricted** | `Super Admin`, `Account` | Financial ledgers & expenses |
| 10 | **Inventory** | `/inventory` | `Package` | **Role-Restricted** | `Super Admin`, `HR` | Stock & dental supplies |
| 11 | **Clients** | `/clients` | `Handshake` | **Permission-Gated** | Permission: `laboratory:read` | External dental labs & clinics |
| 12 | **Laboratory** | `/laboratory` | `FlaskConical` | **Permission-Gated** | Permission: `laboratory:read` | Internal & external lab cases |
| 13 | **HRM** (Parent Group) | Collapsible Group | `Briefcase` | **Role + SubLink Gated** | `Super Admin`, `HR` | Auto-hides if 0 sublinks accessible |
| 13.1 | ├─ **Staff** | `/hrm/staff` | `User` | **Permission-Gated** | Permission: `hrm:read` | Employee management |
| 13.2 | ├─ **Staff Position** | `/hrm/staff-position` | `UserCog` | **Permission-Gated** | Permission: `hrm:read` | Designation & role setup |
| 13.3 | ├─ **Payroll** | `/hrm/payroll` | `HandCoins` | **Permission-Gated** | Permission: `hrm:read` | Salary runs & pay slips |
| 13.4 | ├─ **Staff Salaries**| `/hrm/staff-salaries` | `DollarSign` | **Permission-Gated** | Permission: `hrm:read` | Compensation structures |
| 13.5 | ├─ **Leave** | `/hrm/leave` | `CalendarClock` | **Permission-Gated** | Permission: `hrm:read` | Leave requests & approval |
| 13.6 | ├─ **Staff Advances**| `/hrm/staff-advances`| `NotebookPen` | **Permission-Gated** | Permission: `hrm:read` | Salary advances |
| 13.7 | └─ **Attendance** | `/hrm/attendance` | `Clock` | **Permission-Gated** | Permission: `hrm:read` | Daily clock-in & timesheets |
| 14 | **Branches** | `/branches` | `Building` | **Permission-Gated** | Permission: `branches:read` | Multi-clinic branch setup |
| 15 | **Reports** | `/reports` | `BarChart3` | **Role-Restricted** | `Super Admin`, `HR` | Practice analytics & metrics |
| 16 | **Settings** | `/settings` | `Settings` | **Role-Restricted** | `Super Admin` | System configuration |
| 17 | **Insurance Setup** | `/insurance-setup` | `Handshake` | **Role-Restricted** | `Super Admin` | Insurance carrier configuration |
| 18 | **Activity Logs** | `/activity-logs` | `History` | **Role-Restricted** | `Super Admin` | Audit trail & security logs |
| 19 | **Data Migration** | `/admin/migration` | `Database` | **Role-Restricted** | `Super Admin` | Data import & export tools |

---

## 3. Role vs Sidebar Item Visibility Matrix

The following matrix displays exactly what each employee role sees in the sidebar:

| Sidebar Item | Super Admin | Account | HR | Dentist | Hygienist | Receptionist | Assistant | Lab Tech | Lab Manager |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Dashboard** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Queue** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Patients** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Charting** | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Appointments** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Billing** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Insurance & Claims** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Pharmacy** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Accounting** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Inventory** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Clients** (`laboratory:read`)* | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅* | ✅* |
| **Laboratory** (`laboratory:read`)* | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅* | ✅* |
| **HRM Group** (`hrm:read`)* | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| ├─ **Staff** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| ├─ **Staff Position** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| ├─ **Payroll** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| ├─ **Staff Salaries** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| ├─ **Leave** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| ├─ **Staff Advances** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| └─ **Attendance** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Branches** (`branches:read`)* | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Reports** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Settings** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Insurance Setup** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Activity Logs** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Data Migration** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

> \* *Items marked with an asterisk require the specific permission in the user's `permissions` array in addition to passing role checks.*

---

## 4. Next.js / TypeScript Sidebar Implementation Reference

The sidebar filtering logic is implemented in [main-nav.tsx](file:///c:/Users/sseki/Documents/CHART-DENTAL/src/components/dashboard/main-nav.tsx).

### Data Structures (`NavLink` Type Definition)

```typescript
export type NavLink = {
  href?: string;
  label: string;
  icon: React.ElementType;
  permission?: Permission;
  subLinks?: Omit<NavLink, 'subLinks'>[];
};
```

### NavLinks Array Definition

```typescript
const allLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/queue", label: "Queue", icon: ClipboardList },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/charting", label: "Charting", icon: FileText },
  { href: "/appointments", label: "Appointments", icon: Calendar },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/insurance", label: "Insurance & Claims", icon: Handshake },
  { href: "/pharmacy", label: "Pharmacy", icon: Pill },
  { href: "/accounting", label: "Accounting", icon: Landmark },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/clients", label: "Clients", icon: Handshake, permission: 'laboratory:read' },
  { href: "/laboratory", label: "Laboratory", icon: FlaskConical, permission: 'laboratory:read' },
  { 
    label: "HRM", 
    icon: Briefcase, 
    subLinks: [
      { href: "/hrm/staff", label: "Staff", icon: User, permission: 'hrm:read' },
      { href: "/hrm/staff-position", label: "Staff Position", icon: UserCog, permission: 'hrm:read' },
      { href: "/hrm/payroll", label: "Payroll", icon: HandCoins, permission: 'hrm:read' },
      { href: "/hrm/staff-salaries", label: "Staff Salaries", icon: DollarSign, permission: 'hrm:read' },
      { href: "/hrm/leave", label: "Leave", icon: CalendarClock, permission: 'hrm:read' },
      { href: "/hrm/staff-advances", label: "Staff Advances", icon: NotebookPen, permission: 'hrm:read' },
      { href: "/hrm/attendance", label: "Attendance", icon: Clock, permission: 'hrm:read' },
    ]
  },
  { href: "/branches", label: "Branches", icon: Building, permission: 'branches:read' },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/insurance-setup", label: "Insurance Setup", icon: Handshake },
  { href: "/activity-logs", label: "Activity Logs", icon: History },
  { href: "/admin/migration", label: "Data Migration", icon: Database },
];
```

### Filtering Algorithm

```typescript
const accessibleLinks = allLinks.map(link => {
  const newLink = { ...link };

  // 1. Role Exclusions
  if (newLink.href === '/charting' && hasRole(['Account', 'Receptionist'])) {
    return null; // Exclude accountants and receptionists from dental charting
  }
  if ((newLink.href === '/billing' || newLink.href === '/accounting') && !hasRole(['Super Admin', 'Account'])) {
    return null;
  }
  if ((newLink.href === '/inventory' || newLink.label === 'HRM' || newLink.href === '/reports') && !hasRole(['Super Admin', 'HR'])) {
    return null;
  }
  if ((newLink.href === '/settings' || newLink.href === '/activity-logs' || newLink.href === '/insurance-setup') && !hasRole('Super Admin')) {
    return null;
  }
  if (newLink.href === '/admin/migration' && !hasRole('Super Admin')) {
    return null;
  }

  // 2. Filter Sub-Links by Permission
  if (newLink.subLinks) {
    newLink.subLinks = newLink.subLinks.filter(
      sublink => !sublink.permission || hasPermission(sublink.permission)
    );
  }

  // 3. Check Parent Link Permission
  if (newLink.permission && !hasPermission(newLink.permission)) {
    return null;
  }
  
  // 4. Group Pruning (Discard empty parent group)
  if (newLink.subLinks && newLink.subLinks.length === 0) {
    return null;
  }

  return newLink;
}).filter(Boolean) as NavLink[];
```

---

## 5. Flutter / Dart Cross-Platform Sidebar Implementation

For mobile and multi-platform Flutter implementations, the sidebar/drawer uses the following equivalent architecture:

### NavItem Model Definition (`lib/models/navigation_item.dart`)

```dart
import 'package:flutter/widgets.dart';
import 'auth_models.dart';

class NavItem {
  final String label;
  final String? route;
  final IconData icon;
  final AppPermission? permission;
  final List<EmployeeRole>? allowedRoles;
  final List<EmployeeRole>? excludedRoles;
  final List<NavItem>? subLinks;

  const NavItem({
    required this.label,
    this.route,
    required this.icon,
    this.permission,
    this.allowedRoles,
    this.excludedRoles,
    this.subLinks,
  });
}
```

### Complete Navigation Definition in Dart

```dart
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'auth_models.dart';
import 'navigation_item.dart';

final List<NavItem> appNavLinks = [
  const NavItem(route: '/dashboard', label: 'Dashboard', icon: LucideIcons.layoutDashboard),
  const NavItem(route: '/queue', label: 'Queue', icon: LucideIcons.clipboardList),
  const NavItem(route: '/patients', label: 'Patients', icon: LucideIcons.users),
  const NavItem(
    route: '/charting',
    label: 'Charting',
    icon: LucideIcons.fileText,
    excludedRoles: [EmployeeRole.account, EmployeeRole.receptionist],
  ),
  const NavItem(route: '/appointments', label: 'Appointments', icon: LucideIcons.calendar),
  const NavItem(
    route: '/billing',
    label: 'Billing',
    icon: LucideIcons.creditCard,
    allowedRoles: [EmployeeRole.superAdmin, EmployeeRole.account],
  ),
  const NavItem(route: '/insurance', label: 'Insurance & Claims', icon: LucideIcons.handshake),
  const NavItem(route: '/pharmacy', label: 'Pharmacy', icon: LucideIcons.pill),
  const NavItem(
    route: '/accounting',
    label: 'Accounting',
    icon: LucideIcons.landmark,
    allowedRoles: [EmployeeRole.superAdmin, EmployeeRole.account],
  ),
  const NavItem(
    route: '/inventory',
    label: 'Inventory',
    icon: LucideIcons.package,
    allowedRoles: [EmployeeRole.superAdmin, EmployeeRole.hr],
  ),
  const NavItem(
    route: '/clients',
    label: 'Clients',
    icon: LucideIcons.handshake,
    permission: AppPermission.laboratoryRead,
  ),
  const NavItem(
    route: '/laboratory',
    label: 'Laboratory',
    icon: LucideIcons.flaskConical,
    permission: AppPermission.laboratoryRead,
  ),
  const NavItem(
    label: 'HRM',
    icon: LucideIcons.briefcase,
    allowedRoles: [EmployeeRole.superAdmin, EmployeeRole.hr],
    subLinks: [
      NavItem(route: '/hrm/staff', label: 'Staff', icon: LucideIcons.user, permission: AppPermission.hrmRead),
      NavItem(route: '/hrm/staff-position', label: 'Staff Position', icon: LucideIcons.userCog, permission: AppPermission.hrmRead),
      NavItem(route: '/hrm/payroll', label: 'Payroll', icon: LucideIcons.handCoins, permission: AppPermission.hrmRead),
      NavItem(route: '/hrm/staff-salaries', label: 'Staff Salaries', icon: LucideIcons.dollarSign, permission: AppPermission.hrmRead),
      NavItem(route: '/hrm/leave', label: 'Leave', icon: LucideIcons.calendarClock, permission: AppPermission.hrmRead),
      NavItem(route: '/hrm/staff-advances', label: 'Staff Advances', icon: LucideIcons.notebookPen, permission: AppPermission.hrmRead),
      NavItem(route: '/hrm/attendance', label: 'Attendance', icon: LucideIcons.clock, permission: AppPermission.hrmRead),
    ],
  ),
  const NavItem(
    route: '/branches',
    label: 'Branches',
    icon: LucideIcons.building,
    permission: AppPermission.branchesRead,
  ),
  const NavItem(
    route: '/reports',
    label: 'Reports',
    icon: LucideIcons.barChart3,
    allowedRoles: [EmployeeRole.superAdmin, EmployeeRole.hr],
  ),
  const NavItem(
    route: '/settings',
    label: 'Settings',
    icon: LucideIcons.settings,
    allowedRoles: [EmployeeRole.superAdmin],
  ),
  const NavItem(
    route: '/insurance-setup',
    label: 'Insurance Setup',
    icon: LucideIcons.handshake,
    allowedRoles: [EmployeeRole.superAdmin],
  ),
  const NavItem(
    route: '/activity-logs',
    label: 'Activity Logs',
    icon: LucideIcons.history,
    allowedRoles: [EmployeeRole.superAdmin],
  ),
  const NavItem(
    route: '/admin/migration',
    label: 'Data Migration',
    icon: LucideIcons.database,
    allowedRoles: [EmployeeRole.superAdmin],
  ),
];
```

### Filtering Widget Component (`AppSidebar` / `AppDrawer`)

```dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../extensions/rbac_extensions.dart';
import '../models/auth_models.dart';
import '../models/navigation_item.dart';

class AppSidebar extends StatelessWidget {
  final String currentRoute;
  const AppSidebar({super.key, required this.currentRoute});

  List<NavItem> _filterLinks(BuildContext context) {
    final user = context.currentUser;
    if (user == null) return [];

    return appNavLinks.map((item) {
      // 1. Check excluded roles
      if (item.excludedRoles != null && item.excludedRoles!.contains(user.role)) {
        return null;
      }

      // 2. Check allowed roles
      if (item.allowedRoles != null && !item.allowedRoles!.contains(user.role)) {
        return null;
      }

      // 3. Check direct permission
      if (item.permission != null && !context.hasPermission(item.permission!)) {
        return null;
      }

      // 4. Handle Sub-links
      if (item.subLinks != null) {
        final filteredSub = item.subLinks!.where((sub) {
          if (sub.permission != null && !context.hasPermission(sub.permission!)) {
            return false;
          }
          return true;
        }).toList();

        if (filteredSub.isEmpty) return null; // Prune empty parent

        return NavItem(
          label: item.label,
          icon: item.icon,
          allowedRoles: item.allowedRoles,
          excludedRoles: item.excludedRoles,
          permission: item.permission,
          subLinks: filteredSub,
        );
      }

      return item;
    }).whereType<NavItem>().toList();
  }

  @override
  Widget build(BuildContext context) {
    final links = _filterLinks(context);

    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          UserAccountsDrawerHeader(
            accountName: Text(context.currentUser?.name ?? ''),
            accountEmail: Text(context.currentUser?.role.label ?? ''),
            currentAccountPicture: CircleAvatar(
              backgroundImage: context.currentUser?.avatar != null
                  ? NetworkImage(context.currentUser!.avatar!)
                  : null,
              child: context.currentUser?.avatar == null
                  ? Text(context.currentUser?.name[0] ?? 'U')
                  : null,
            ),
          ),
          ...links.map((link) {
            if (link.subLinks != null) {
              final isExpanded = link.subLinks!.any((s) => s.route == currentRoute);
              return ExpansionTile(
                initiallyExpanded: isExpanded,
                leading: Icon(link.icon),
                title: Text(link.label),
                children: link.subLinks!.map((subLink) {
                  final isSubActive = subLink.route == currentRoute;
                  return ListTile(
                    selected: isSubActive,
                    contentPadding: const EdgeInsets.only(left: 32.0, right: 16.0),
                    leading: Icon(subLink.icon, size: 20),
                    title: Text(subLink.label),
                    onTap: () {
                      if (subLink.route != null) {
                        context.go(subLink.route!);
                      }
                    },
                  );
                }).toList(),
              );
            }

            final isActive = link.route == currentRoute;
            return ListTile(
              selected: isActive,
              leading: Icon(link.icon),
              title: Text(link.label),
              onTap: () {
                if (link.route != null) {
                  context.go(link.route!);
                }
              },
            );
          }),
        ],
      ),
    );
  }
}
```

---

## 6. How to Add a New Sidebar Link (Step-by-Step)

When introducing a new feature module with sidebar visibility, follow these steps:

### Step 1: Register Permissions (if new)
In [src/lib/types.ts](file:///c:/Users/sseki/Documents/CHART-DENTAL/src/lib/types.ts):
```typescript
export type Permission =
  | ...
  | 'marketing:read' | 'marketing:create';
```

### Step 2: Register in `allPermissions` Array
In [src/lib/user.ts](file:///c:/Users/sseki/Documents/CHART-DENTAL/src/lib/user.ts):
```typescript
const allPermissions: Permission[] = [
  ...
  'marketing:read', 'marketing:create'
];
```

### Step 3: Define Link in `allLinks`
In [src/components/dashboard/main-nav.tsx](file:///c:/Users/sseki/Documents/CHART-DENTAL/src/components/dashboard/main-nav.tsx):
```typescript
{
  href: "/marketing",
  label: "Marketing",
  icon: Megaphone,
  permission: "marketing:read",
}
```

### Step 4: Add Role Gating Rule (if restricted to specific personas)
In [src/components/dashboard/main-nav.tsx](file:///c:/Users/sseki/Documents/CHART-DENTAL/src/components/dashboard/main-nav.tsx):
```typescript
if (newLink.href === '/marketing' && !hasRole(['Super Admin', 'HR'])) {
  return null;
}
```

### Step 5: Add Screen/Route Guard
Ensure the target page component (`src/app/(dashboard)/marketing/page.tsx`) contains an authorization guard:
```tsx
const canAccess = hasPermission('marketing:read') || hasRole('Super Admin');
if (!canAccess) {
  return <ForbiddenState message="Unauthorized Access" />;
}
```

---

## 7. Security Best Practices & Edge Cases

> [!WARNING]
> **Sidebar Filtering is for UX, not API Security.**
> 
> Hiding a link in the sidebar prevents unauthorized navigation, but does not secure data. All Next.js Server Actions, Route Handlers, and backend APIs must validate the user's session token and enforce role/permission claims before returning data.

1. **Empty Collapsible Parent Groups:** Always verify that parent groups (e.g. `HRM`) prune themselves if all children are filtered out (`subLinks.length === 0`).
2. **Path Highlighting for Nested Routes:** The active state checker uses `pathname.startsWith(...)` to ensure sub-pages (e.g., `/patients/123/charting`) maintain parent menu highlight.
3. **Session Desynchronization:** If roles or permissions change dynamically on the server, invoke `setCurrentUser` to update `localStorage` and trigger React state re-evaluation.



Task: Based on the specification above, implement the complete Flutter AppDrawer / AppSidebar widget using GoRouter and Provider/Riverpod. Ensure all role exclusions, permission checks, and collapsible HRM group pruning match the specification matrix.