# Prompt for Roles & Permissions API

This document outlines the REST API endpoints required for managing user roles and their associated permissions within the Dentio application.

---

## 1. Get All Roles and Permissions

This endpoint retrieves a comprehensive list of all defined roles and the specific permissions assigned to each. It is intended for use in the 'Roles & Permissions' settings page where an administrator needs to view and manage what each role can do.

-   **Endpoint**: `GET /api/settings/roles`
-   **Authorization**: `Super Admin` only.
-   **Description**: Fetches a complete list of all available roles and their assigned permissions.
-   **Success Response (200 OK)**: Returns a JSON array of `RolePermission` objects.

#### Sample Response
```json
[
  {
    "id": "Super Admin",
    "name": "Super Admin",
    "permissions": [
      "dashboard:read",
      "queue:read",
      "patients:read",
      "patients:create",
      "patients:update",
      "patients:delete",
      "settings:manage"
    ]
  },
  {
    "id": "Dentist",
    "name": "Dentist",
    "permissions": [
      "dashboard:read",
      "queue:read",
      "patients:read",
      "charting:read",
      "charting:update"
    ]
  },
  {
    "id": "Receptionist",
    "name": "Receptionist",
    "permissions": [
      "dashboard:read",
      "queue:read",
      "patients:read",
      "patients:create",
      "appointments:read",
      "appointments:create"
    ]
  }
]
```

---

## 2. Update Permissions for a Role

This endpoint allows a Super Admin to modify the permissions for a specific role. It receives the role ID and an array of permission strings that will completely replace the existing permissions for that role.

-   **Endpoint**: `PUT /api/settings/roles/{role_id}`
-   **URL Parameter**:
    -   `role_id` (string): The ID of the role to update (e.g., "Dentist").
-   **Authorization**: `Super Admin` only.
-   **Description**: Updates the permissions for a specific role. The provided permissions array will overwrite all existing permissions for that role.
-   **Request Body**: A JSON object containing a single `permissions` key.

#### Sample Request Body
```json
{
  "permissions": [
    "dashboard:read",
    "queue:read",
    "patients:read",
    "patients:create",
    "patients:update"
  ]
}
```

-   **Success Response (200 OK)**: Returns the complete, updated `RolePermission` object.

#### Sample Response
```json
{
  "id": "Dentist",
  "name": "Dentist",
  "permissions": [
    "dashboard:read",
    "queue:read",
    "patients:read",
    "patients:create",
    "patients:update"
  ]
}
```
-   **Error Response (404 Not Found)**: If the specified `role_id` does not exist.

---

## 3. Get Simple List of Roles

This endpoint provides a simplified list of all roles, containing only their ID and name. This is useful for populating UI elements like dropdown menus where only the role name is needed for selection (e.g., when creating or editing an employee).

-   **Endpoint**: `GET /api/roles`
-   **Authorization**: `Super Admin`, `HR`.
-   **Description**: Fetches a lightweight list of all roles, including only their `id` and `name`.
-   **Success Response (200 OK)**: Returns a JSON array of simple role objects.

#### Sample Response
```json
[
  {
    "id": "Super Admin",
    "name": "Super Admin"
  },
  {
    "id": "Account",
    "name": "Accountant"
  },
  {
    "id": "HR",
    "name": "HR Manager"
  },
  {
    "id": "Dentist",
    "name": "Dentist"
  },
  {
    "id": "Hygienist",
    "name": "Hygienist"
  },
  {
    "id": "Receptionist",
    "name": "Receptionist"
  },
  {
    "id": "Assistant",
    "name": "Dental Assistant"
  }
]
```
