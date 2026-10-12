# Role-Based & Permission-Based Access Control (RBAC/PBAC) Guide
### From Next.js/TypeScript Reference to Flutter/Dart Implementation

---

## 1. Overview & Architectural Concepts

Access control in modern applications is typically implemented using a hybrid of **Role-Based Access Control (RBAC)** and **Permission-Based Access Control (PBAC)**:

- **Roles (RBAC):** High-level persona designations (e.g., `Super Admin`, `Dentist`, `Account`, `HR`, `Receptionist`). Roles are useful for high-level module routing and broad business persona checks.
- **Permissions (PBAC):** Fine-grained capability strings formatted as `resource:action` (e.g., `patients:create`, `accounting:read`, `hrm:update`, `reports:read`). Permissions dictate whether a user can see a specific button, view a table column, or perform an operation.
- **Current User Payload:** Received upon login (or decoded from a JWT), cached in persistent client-side storage, and loaded into application memory.

```
+-----------------------------------------------------------------------------------+
|                                  CurrentUser                                      |
|                                                                                   |
|  Role: 'Dentist'                                                                  |
|  Permissions: ['patients:read', 'patients:create', 'charting:read', 'charting:update'] |
+-----------------------------------------------------------------------------------+
       |                                                    |
       v                                                    v
 [ hasRole('Dentist') ]                    [ hasPermission('patients:create') ]
       |                                                    |
       +--------------------+-------------------------------+
                            |
                            v
       +--------------------------------------------+
       |             UI & Route Layer               |
       |  - Filter navigation menus/drawers         |
       |  - Disable or hide action buttons          |
       |  - Guard screens / GoRouter redirects      |
       +--------------------------------------------+
```

---

## 2. Reference Implementation (TypeScript / Next.js)

### A. Data Types (`src/lib/types.ts`)
```typescript
export type EmployeeRole = 
  | 'Super Admin' 
  | 'Account' 
  | 'HR' 
  | 'Dentist' 
  | 'Hygienist' 
  | 'Receptionist' 
  | 'Assistant' 
  | 'Lab Technician' 
  | 'Lab Manager';

export type Permission =
  | 'dashboard:read'
  | 'queue:read'
  | 'patients:read' | 'patients:create' | 'patients:update' | 'patients:delete'
  | 'charting:read' | 'charting:update'
  | 'billing:read' | 'billing:create' | 'billing:update' | 'billing:delete'
  | 'accounting:read' | 'accounting:create'
  | 'hrm:read' | 'hrm:create' | 'hrm:update' | 'hrm:delete'
  | 'reports:read'
  | 'settings:manage';

export type CurrentUser = {
  role: EmployeeRole;
  permissions: Permission[];
  branchId: string | number;
  branchName: string;
  name: string;
  email: string;
  avatar: string;
};
```

### B. Core Evaluation Logic (`src/lib/user.ts`)
```typescript
export function getCurrentUser(): CurrentUser | null {
  if (typeof window === 'undefined') return null;
  const userJson = localStorage.getItem('currentUser');
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function hasPermission(permission: Permission): boolean {
  if (typeof window === 'undefined') return false;
  const user = getCurrentUser();
  if (!user || !user.permissions) return false;
  return user.permissions.includes(permission);
}

export function hasRole(role: EmployeeRole | EmployeeRole[]): boolean {
  if (typeof window === 'undefined') return false;
  const user = getCurrentUser();
  if (!user || !user.role) return false;
  
  if (Array.isArray(role)) {
    return role.includes(user.role);
  }
  return user.role === role;
}
```

### C. Usage Patterns in UI
- **Button/Action Gating:**
  ```tsx
  {hasPermission('hrm:create') && (
    <Button onClick={handleAddEmployee}>Add Employee</Button>
  )}
  ```
- **Navigation/Menu Filtering:**
  ```tsx
  const accessibleLinks = links.filter(link => {
    if (link.role && !hasRole(link.role)) return false;
    if (link.permission && !hasPermission(link.permission)) return false;
    return true;
  });
  ```
- **Screen Protection Guard:**
  ```tsx
  if (!hasPermission('accounting:read')) {
    return <ForbiddenState message="Access Denied" />;
  }
  ```

---

## 3. Flutter & Dart Implementation

Below is the complete, idiomatic Dart and Flutter conversion designed for production applications.

### Dependencies (`pubspec.yaml`)
```yaml
dependencies:
  flutter:
    sdk: flutter
  # Recommended packages:
  flutter_secure_storage: ^9.0.0   # Secure token and user cache
  go_router: ^14.0.0                # Declarative routing with guard support
  provider: ^6.1.0                  # Or flutter_riverpod / flutter_bloc
```

---

### Step 1: Enums & User Model (`lib/models/auth_models.dart`)

```dart
enum EmployeeRole {
  superAdmin('Super Admin'),
  account('Account'),
  hr('HR'),
  dentist('Dentist'),
  hygienist('Hygienist'),
  receptionist('Receptionist'),
  assistant('Assistant'),
  labTechnician('Lab Technician'),
  labManager('Lab Manager'),
  unknown('Unknown');

  final String label;
  const EmployeeRole(this.label);

  static EmployeeRole fromString(String value) {
    return EmployeeRole.values.firstWhere(
      (r) => r.label.toLowerCase() == value.toLowerCase() || r.name.toLowerCase() == value.toLowerCase(),
      orElse: () => EmployeeRole.unknown,
    );
  }
}

/// Strongly typed permissions
enum AppPermission {
  dashboardRead('dashboard:read'),
  queueRead('queue:read'),
  
  // Patients
  patientsRead('patients:read'),
  patientsCreate('patients:create'),
  patientsUpdate('patients:update'),
  patientsDelete('patients:delete'),
  
  // Charting
  chartingRead('charting:read'),
  chartingUpdate('charting:update'),
  
  // Billing & Accounting
  billingRead('billing:read'),
  billingCreate('billing:create'),
  billingUpdate('billing:update'),
  billingDelete('billing:delete'),
  accountingRead('accounting:read'),
  accountingCreate('accounting:create'),
  
  // HRM
  hrmRead('hrm:read'),
  hrmCreate('hrm:create'),
  hrmUpdate('hrm:update'),
  hrmDelete('hrm:delete'),
  
  // General
  reportsRead('reports:read'),
  settingsManage('settings:manage'),
  profileRead('profile:read'),
  profileUpdate('profile:update');

  final String value;
  const AppPermission(this.value);

  static AppPermission? fromValue(String value) {
    for (var perm in AppPermission.values) {
      if (perm.value == value) return perm;
    }
    return null;
  }
}

class CurrentUser {
  final String id;
  final String name;
  final String email;
  final EmployeeRole role;
  final Set<String> permissions; // Using Set<String> for O(1) lookups
  final String? branchId;
  final String? branchName;
  final String? avatar;

  CurrentUser({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.permissions,
    this.branchId,
    this.branchName,
    this.avatar,
  });

  factory CurrentUser.fromJson(Map<String, dynamic> json) {
    final rawPermissions = json['permissions'] as List<dynamic>? ?? [];
    return CurrentUser(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      role: EmployeeRole.fromString(json['role'] ?? ''),
      permissions: rawPermissions.map((e) => e.toString()).toSet(),
      branchId: json['branchId']?.toString(),
      branchName: json['branchName'],
      avatar: json['avatar'],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'email': email,
    'role': role.label,
    'permissions': permissions.toList(),
    'branchId': branchId,
    'branchName': branchName,
    'avatar': avatar,
  };
}
```

---

### Step 2: Auth & RBAC State Provider (`lib/services/auth_service.dart`)

```dart
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/auth_models.dart';

class AuthService extends ChangeNotifier {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  
  CurrentUser? _currentUser;
  String? _token;
  bool _isInitialized = false;

  CurrentUser? get currentUser => _currentUser;
  String? get token => _token;
  bool get isAuthenticated => _currentUser != null && _token != null;
  bool get isInitialized => _isInitialized;

  /// Call once when app starts (e.g., in main.dart)
  Future<void> initialize() async {
    try {
      final userStr = await _storage.read(key: 'current_user');
      final savedToken = await _storage.read(key: 'auth_token');

      if (userStr != null && savedToken != null) {
        _currentUser = CurrentUser.fromJson(jsonDecode(userStr));
        _token = savedToken;
      }
    } catch (e) {
      debugPrint('Error loading user session: $e');
      await clearSession();
    } finally {
      _isInitialized = true;
      notifyListeners();
    }
  }

  Future<void> setSession(CurrentUser user, String token) async {
    _currentUser = user;
    _token = token;
    await _storage.write(key: 'current_user', value: jsonEncode(user.toJson()));
    await _storage.write(key: 'auth_token', value: token);
    notifyListeners();
  }

  Future<void> clearSession() async {
    _currentUser = null;
    _token = null;
    await _storage.delete(key: 'current_user');
    await _storage.delete(key: 'auth_token');
    notifyListeners();
  }

  // ==========================================
  // RBAC & PBAC Core Verification Methods
  // ==========================================

  /// Checks if the user has a specific permission
  bool hasPermission(AppPermission permission) {
    if (_currentUser == null) return false;
    return _currentUser!.permissions.contains(permission.value);
  }

  /// Checks if the user has a raw permission string
  bool hasPermissionString(String permissionString) {
    if (_currentUser == null) return false;
    return _currentUser!.permissions.contains(permissionString);
  }

  /// Checks if the user has ANY of the provided permissions
  bool hasAnyPermission(List<AppPermission> permissions) {
    if (_currentUser == null) return false;
    return permissions.any((p) => _currentUser!.permissions.contains(p.value));
  }

  /// Checks if the user has ALL of the provided permissions
  bool hasAllPermissions(List<AppPermission> permissions) {
    if (_currentUser == null) return false;
    return permissions.every((p) => _currentUser!.permissions.contains(p.value));
  }

  /// Checks if the user has a single role or matches any role in a list
  bool hasRole(dynamic roleOrRoles) {
    if (_currentUser == null) return false;

    if (roleOrRoles is EmployeeRole) {
      return _currentUser!.role == roleOrRoles;
    } else if (roleOrRoles is List<EmployeeRole>) {
      return roleOrRoles.contains(_currentUser!.role);
    } else if (roleOrRoles is String) {
      return _currentUser!.role.label.toLowerCase() == roleOrRoles.toLowerCase();
    } else if (roleOrRoles is List<String>) {
      final userRoleStr = _currentUser!.role.label.toLowerCase();
      return roleOrRoles.any((r) => r.toLowerCase() == userRoleStr);
    }
    return false;
  }
}
```

---

### Step 3: BuildContext Extension for Clean UI Code (`lib/extensions/rbac_extensions.dart`)

Adding helper extensions on `BuildContext` makes widget building concise and readable:

```dart
import 'package:flutter/widgets.dart';
import 'package:provider/provider.dart';
import '../models/auth_models.dart';
import '../services/auth_service.dart';

extension RbacContextExtension on BuildContext {
  AuthService get auth => read<AuthService>();
  AuthService get watchAuth => watch<AuthService>();

  CurrentUser? get currentUser => watchAuth.currentUser;
  bool get isAuthenticated => watchAuth.isAuthenticated;

  /// Check permission with reactive rebuild
  bool hasPermission(AppPermission permission) {
    return watchAuth.hasPermission(permission);
  }

  /// Check role with reactive rebuild
  bool hasRole(dynamic roleOrRoles) {
    return watchAuth.hasRole(roleOrRoles);
  }
}
```

---

### Step 4: Reusable Guard Widgets (`lib/widgets/guard_widgets.dart`)

Instead of repeating `if (hasPermission(...))` inside widget trees, create guard components:

```dart
import 'package:flutter/material.dart';
import '../models/auth_models.dart';
import '../extensions/rbac_extensions.dart';

/// Shows [child] only if the user has the required [permission]
class PermissionGuard extends StatelessWidget {
  final AppPermission permission;
  final Widget child;
  final Widget fallback;

  const PermissionGuard({
    super.key,
    required this.permission,
    required this.child,
    this.fallback = const SizedBox.shrink(),
  });

  @override
  Widget build(BuildContext context) {
    final allowed = context.hasPermission(permission);
    return allowed ? child : fallback;
  }
}

/// Shows [child] only if the user has the required [role] or one of [roles]
class RoleGuard extends StatelessWidget {
  final dynamic roles; // Single EmployeeRole or List<EmployeeRole>
  final Widget child;
  final Widget fallback;

  const RoleGuard({
    super.key,
    required this.roles,
    required this.child,
    this.fallback = const SizedBox.shrink(),
  });

  @override
  Widget build(BuildContext context) {
    final allowed = context.hasRole(roles);
    return allowed ? child : fallback;
  }
}
```

---

### Step 5: Screen-Level Route Guard (Using `go_router`)

```dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/auth_service.dart';
import '../models/auth_models.dart';

GoRouter createRouter(AuthService authService) {
  return GoRouter(
    refreshListenable: authService,
    initialLocation: '/dashboard',
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: '/dashboard',
        builder: (context, state) => const DashboardPage(),
      ),
      GoRoute(
        path: '/accounting',
        builder: (context, state) => const AccountingPage(),
        redirect: (context, state) {
          if (!authService.hasPermission(AppPermission.accountingRead)) {
            return '/forbidden';
          }
          return null;
        },
      ),
      GoRoute(
        path: '/hrm',
        builder: (context, state) => const HrmPage(),
        redirect: (context, state) {
          if (!authService.hasRole([EmployeeRole.superAdmin, EmployeeRole.hr])) {
            return '/forbidden';
          }
          return null;
        },
      ),
      GoRoute(
        path: '/forbidden',
        builder: (context, state) => const Scaffold(
          body: Center(child: Text('Access Denied: You do not have permission.')),
        ),
      ),
    ],
    redirect: (context, state) {
      final loggedIn = authService.isAuthenticated;
      final loggingIn = state.matchedLocation == '/login';

      if (!loggedIn && !loggingIn) return '/login';
      if (loggedIn && loggingIn) return '/dashboard';
      return null;
    },
  );
}
```

---

### Step 6: Navigation Menu Filtering in Flutter

Filter dynamic navigation items (Drawer, NavigationRail, BottomNavigationBar) just like `main-nav.tsx`:

```dart
class AppNavigationItem {
  final String title;
  final IconData icon;
  final String route;
  final AppPermission? requiredPermission;
  final List<EmployeeRole>? requiredRoles;

  const AppNavigationItem({
    required this.title,
    required this.icon,
    required this.route,
    this.requiredPermission,
    this.requiredRoles,
  });
}

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  static const List<AppNavigationItem> _allItems = [
    AppNavigationItem(
      title: 'Dashboard',
      icon: Icons.dashboard,
      route: '/dashboard',
    ),
    AppNavigationItem(
      title: 'Patients',
      icon: Icons.people,
      route: '/patients',
      requiredPermission: AppPermission.patientsRead,
    ),
    AppNavigationItem(
      title: 'Accounting',
      icon: Icons.account_balance_wallet,
      route: '/accounting',
      requiredRoles: [EmployeeRole.superAdmin, EmployeeRole.account],
    ),
    AppNavigationItem(
      title: 'HRM',
      icon: Icons.badge,
      route: '/hrm',
      requiredRoles: [EmployeeRole.superAdmin, EmployeeRole.hr],
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final auth = context.watchAuth;

    // Filter items based on roles and permissions
    final accessibleItems = _allItems.where((item) {
      if (item.requiredRoles != null && !auth.hasRole(item.requiredRoles!)) {
        return false;
      }
      if (item.requiredPermission != null && !auth.hasPermission(item.requiredPermission!)) {
        return false;
      }
      return true;
    }).toList();

    return Drawer(
      child: ListView(
        children: [
          UserAccountsDrawerHeader(
            accountName: Text(auth.currentUser?.name ?? 'User'),
            accountEmail: Text(auth.currentUser?.role.label ?? ''),
          ),
          ...accessibleItems.map(
            (item) => ListTile(
              leading: Icon(item.icon),
              title: Text(item.title),
              onTap: () => context.go(item.route),
            ),
          ),
        ],
      ),
    );
  }
}
```

---

### Step 7: Practical UI Action-Gating Examples

```dart
// 1. Declarative widget gating using PermissionGuard:
PermissionGuard(
  permission: AppPermission.hrmCreate,
  child: ElevatedButton.icon(
    icon: const Icon(Icons.add),
    label: const Text('New Employee'),
    onPressed: () => _openCreateEmployeeDialog(context),
  ),
)

// 2. Inline Context extension check:
if (context.hasPermission(AppPermission.patientsDelete)) ...[
  IconButton(
    icon: const Icon(Icons.delete, color: Colors.red),
    onPressed: () => _deletePatient(patientId),
  ),
]

// 3. Conditional DataTable columns:
DataTable(
  columns: [
    const DataColumn(label: Text('Name')),
    const DataColumn(label: Text('Position')),
    if (context.hasPermission(AppPermission.hrmUpdate))
      const DataColumn(label: Text('Actions')),
  ],
  rows: staffList.map((staff) {
    return DataRow(
      cells: [
        DataCell(Text(staff.name)),
        DataCell(Text(staff.position)),
        if (context.hasPermission(AppPermission.hrmUpdate))
          DataCell(IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () => _editStaff(staff),
          )),
      ],
    );
  }).toList(),
)
```

---

## 4. Key Differences: Web (Next.js) vs Mobile (Flutter)

| Feature | Next.js / TypeScript | Flutter / Dart |
| :--- | :--- | :--- |
| **Storage** | `localStorage` (Synchronous, Web only) | `FlutterSecureStorage` / `SharedPreferences` (Async, encrypted native keychain) |
| **SSR / Hydration** | Needs `typeof window !== 'undefined'` guard | Native client app, no SSR check needed |
| **Lookup Performance** | Array lookup `permissions.includes(...)` | `Set<String>.contains(...)` (O(1) hash lookup) |
| **Type Safety** | TypeScript String Union (`'patients:read' \| ...`) | Dart `enum` with mapped string values |
| **Reactivity** | React hooks (`useState`, `useEffect`, Context) | `ChangeNotifier`, `Provider`, `Riverpod`, or `Bloc` |
| **Route Protection** | Middleware / Component Early Return | `GoRouter.redirect` / Guard Callbacks |

---

## 5. Security Best Practice Note

> [!IMPORTANT]
> **Client-side access control (in both Flutter and Next.js) is purely for User Experience (UX) and navigation.**
> 
> Hiding a button or guarding a Flutter route prevents authorized users from navigating into broken or unauthorized UI states. However, **all API endpoints in your backend must independently enforce authentication tokens and verify role/permission claims** on every incoming request.
