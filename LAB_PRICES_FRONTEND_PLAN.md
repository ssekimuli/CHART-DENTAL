# Lab Prices Management - Frontend Implementation Plan

## Project Overview
**Tech Stack:**
- Next.js 15 with App Router
- React 18 + TypeScript
- shadcn/ui for component library
- Tailwind CSS for styling
- React Hook Form + Zod for form validation
- Axios for API calls
- Existing patterns: Branch context, permission-based access control, pagination

**Architecture:**
- Lab Prices integrated under Laboratory section as dropdown menu
- Accessible from: `/laboratory` → Dropdown → "Lab Services" or "Lab Prices"
- Maintains existing laboratory workflow

---

## Phase 1: API Integration Layer

### 1.1 Create API Utility Functions
**File:** `src/lib/api-lab-prices.ts`

**Functions to implement:**
- `getLabServices(branchId, page?, search?, category?, active?)`
- `getLabService(id)`
- `createLabService(data)`
- `updateLabService(id, data)`
- `deleteLabService(id)`
- `getLabServicePrices(branchId, filters)`
- `getServicePrices(serviceId)`
- `createLabServicePrice(data)`
- `updateLabServicePrice(id, data)`
- `deleteLabServicePrice(id)`
- `getActivePriceForService(serviceId)`

**Features:**
- Error handling with Axios
- Proper type definitions
- Query parameter encoding for search/filters
- Branch context awareness
- Pagination support

### 1.2 Update Types
**File:** `src/lib/types.ts`

**New types:**
```typescript
interface LabService {
  id: number;
  service_name: string;
  category?: string;
  is_active: boolean;
  current_price?: number;
  branch_id: number;
  created_at: string;
  updated_at: string;
}

interface LabServicePrice {
  id: number;
  lab_service_id: number;
  lab: string;
  base_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface LabServiceWithPrices extends LabService {
  prices: LabServicePrice[];
}
```

---

## Phase 2: Page Structure - Laboratory Integration

### 2.1 Laboratory Page Enhancement
**File:** `src/app/(dashboard)/laboratory/page.tsx` (Modified)

**Changes:**
- Add dropdown/tabs section for navigation
- Display Lab Orders list (existing)
- Add "Lab Prices" dropdown option → Toggles to Prices view

**Layout:**
```
┌─ Laboratory Management
│  ├─ [Tabs/Dropdown]
│  │  ├─ Lab Orders (default)
│  │  ├─ Lab Services
│  │  └─ Lab Prices
│  │
│  └─ Content Area (changes based on selection)
│     ├─ Lab Orders Table (existing)
│     ├─ Services Table (new)
│     └─ Prices Table (new)
```

### 2.2 Lab Services Sub-section
**Location:** Same page as Lab Orders, toggled via dropdown

**Features:**
- Display all lab services for branch
- Create new service button
- Search and filter
- Edit/Delete actions
- View prices for service

### 2.3 Lab Prices Sub-section
**Location:** Same page as Lab Orders, toggled via dropdown

**Features:**
- Display all lab service prices
- Create new price
- Filter by service, lab, price range
- Edit/Delete actions
- Show active status

### 2.4 Navigation Structure
```
Laboratory
└── Dropdown/Tabs Menu
    ├─ [Lab Orders] ← Currently shows lab orders
    ├─ [Lab Services] ← NEW: Show services table + actions
    └─ [Lab Prices] ← NEW: Show prices table + actions
```

---

## Phase 3: Components

### 3.1 Lab Services Table Component
**File:** `src/app/(dashboard)/laboratory/components/lab-services-table.tsx`

**Props:**
- `services: LabService[]`
- `onEdit: (service: LabService) => void`
- `onDelete: (id: number) => void`
- `isLoading: boolean`

**Columns:**
- Service Name
- Category
- Active Status (badge)
- Current Price
- Actions (Edit, Delete, View Prices)

### 3.2 Lab Service Prices Table Component
**File:** `src/app/(dashboard)/laboratory/components/lab-prices-table.tsx`

**Props:**
- `prices: LabServicePrice[]`
- `onEdit: (price: LabServicePrice) => void`
- `onDelete: (id: number) => void`
- `isLoading: boolean`

**Columns:**
- Lab Name
- Service Name
- Base Price
- Active Status (badge)
- Actions (Edit, Delete)

### 3.3 Lab Service Form Component
**File:** `src/app/(dashboard)/laboratory/components/lab-service-form.tsx`

**Props:**
- `service?: LabService`
- `onSubmit: (data: LabService) => void`
- `isLoading: boolean`

**Form Fields:**
- Service Name (required, text)
- Category (optional, combobox with suggestions)
- Active Status (toggle)

### 3.4 Lab Service Price Form Component
**File:** `src/app/(dashboard)/laboratory/components/lab-service-price-form.tsx`

**Props:**
- `price?: LabServicePrice`
- `services: LabService[]`
- `onSubmit: (data: LabServicePrice) => void`
- `isLoading: boolean`

**Form Fields:**
- Lab Service (required, select)
- Lab Name (required, text with autocomplete)
- Base Price (required, decimal input)
- Active Status (toggle)

### 3.5 Search/Filter Bar Component
**File:** `src/app/(dashboard)/laboratory/components/lab-prices-filter.tsx`

**Props:**
- For Services:
  - `searchTerm: string`
  - `category: string`
  - `activeOnly: boolean`
  - `onSearchChange: (search: string) => void`
  - `onCategoryChange: (category: string) => void`
  - `onActiveChange: (active: boolean) => void`
  - `onClear: () => void`

- For Prices:
  - `searchTerm: string`
  - `lab: string`
  - `minPrice: number`
  - `maxPrice: number`
  - `activeOnly: boolean`
  - `onSearchChange: (search: string) => void`
  - `onLabChange: (lab: string) => void`
  - `onPriceRangeChange: (min: number, max: number) => void`
  - `onActiveChange: (active: boolean) => void`
  - `onClear: () => void`

### 3.6 Price History Modal Component
**File:** `src/app/(dashboard)/laboratory/components/price-history-modal.tsx`

### 3.7 Laboratory Tab/Dropdown Switcher Component
**File:** `src/app/(dashboard)/laboratory/components/lab-section-switcher.tsx`

**Props:**
- `activeSection: 'orders' | 'services' | 'prices'`
- `onSectionChange: (section) => void`

**Features:**
- Three tabs/dropdown options
- Active state indicator
- Seamless section switching

**Props:**
- `serviceId: number`
- `isOpen: boolean`
- `onClose: () => void`

**Features:**
- Display all price versions for a service
- Show which price is active
- Timestamp display
- Export to CSV option

---

## Phase 4: Page Implementation Details

### 4.1 Enhanced Laboratory Page (`/laboratory`)

**State Management:**
```typescript
// Page state
- activeSection: 'orders' | 'services' | 'prices'
- selectedBranch: Branch

// Existing Lab Orders (unchanged)
- labOrders: PaginatedArray<LaboratoryOrder>
- ordersLoading: boolean
- ordersPage: number
- (+ existing filters)

// NEW: Lab Services
- services: LabServiceWithPrices[]
- servicesLoading: boolean
- servicesPage: number
- servicesMeta: PaginationMeta
- servicesSearch: string
- servicesCategory: string
- servicesActive: boolean | null
- selectedService: LabService | null
- isServiceFormOpen: boolean

// NEW: Lab Prices
- prices: LabServicePrice[]
- pricesLoading: boolean
- pricesPage: number
- pricesMeta: PaginationMeta
- pricesSearch: string
- pricesLab: string
- pricesMinPrice: number | null
- pricesMaxPrice: number | null
- pricesActive: boolean | null
- selectedPrice: LabServicePrice | null
- isPriceFormOpen: boolean
```

**Key Features:**
1. Dropdown/Tab switcher at top showing current section
2. Existing Lab Orders functionality remains unchanged
3. When switching to Services:
   - Fetch services list
   - Display services table with actions
4. When switching to Prices:
   - Fetch prices list
   - Display prices table with filters
5. Handle create/edit/delete operations
6. Show success/error toasts
7. Refresh data after mutations
8. Permission checks before allowing actions

**Workflow:**
```
1. User visits /laboratory
2. Sees Lab Orders section (existing functionality)
3. Clicks dropdown → Sees options:
   - Lab Orders (current)
   - Lab Services (new)
   - Lab Prices (new)
4. Selects "Lab Services":
   - Shows services table with create button
   - User can create/edit/delete services
5. Selects "Lab Prices":
   - Shows prices table with advanced filters
   - User can create/edit/delete prices
6. Returns to "Lab Orders":
   - Shows existing lab orders functionality
```

### 4.2 Permissions Required

**For Lab Prices Management:**
- `lab_services:read` - View services and prices
- `lab_services:create` - Create new services
- `lab_services:update` - Edit services and prices
- `lab_services:delete` - Delete services and prices

---

## Phase 5: Form Validation

### 5.1 Lab Service Validation Schema
**File:** `src/app/(dashboard)/lab-prices/schemas/lab-service.schema.ts`

```typescript
import { z } from 'zod';

export const labServiceSchema = z.object({
  service_name: z.string()
    .min(1, 'Service name is required')
    .max(255, 'Service name cannot exceed 255 characters'),
  category: z.string()
    .max(255, 'Category cannot exceed 255 characters')
    .optional()
    .nullable(),
  is_active: z.boolean().default(true),
});

export type LabServiceFormData = z.infer<typeof labServiceSchema>;
```

### 5.2 Lab Service Price Validation Schema
**File:** `src/app/(dashboard)/lab-prices/schemas/lab-service-price.schema.ts`

```typescript
import { z } from 'zod';

export const labServicePriceSchema = z.object({
  lab_service_id: z.number()
    .int('Lab service must be selected'),
  lab: z.string()
    .min(1, 'Lab name is required')
    .max(255, 'Lab name cannot exceed 255 characters'),
  base_price: z.number()
    .positive('Price must be greater than 0')
    .multipleOf(0.01, 'Price must have at most 2 decimal places'),
  is_active: z.boolean().default(true),
});

export type LabServicePriceFormData = z.infer<typeof labServicePriceSchema>;
```

---

## Phase 6: UI/UX Patterns

### 6.1 Search Interface
**Location:** Top of Services/Prices table
```
┌─────────────────────────────────────┐
│ [Search Input]  [Category Filter]   │
│ [Price Range]   [Active Toggle]     │
│                [Clear Filters] [x]  │
└─────────────────────────────────────┘
```

### 6.2 Table Rows
**Services Table:**
- Chevron icon on left to expand price details
- Service name (clickable)
- Category badge
- Current price display
- Active/Inactive badge
- Action menu (Edit, Delete, View Prices)

**Prices Table:**
- Lab name
- Service name
- Price (formatted with currency)
- Active indicator (star/checkmark icon)
- Action menu (Edit, Delete)

### 6.3 Dialogs/Modals
- Create/Edit Service Form
- Create/Edit Price Form
- Delete confirmation
- Price history modal

### 6.4 Status Indicators
- **Active Service:** Green badge "Active"
- **Inactive Service:** Gray badge "Inactive"
- **Active Price:** Green checkmark + "Active"
- **Inactive Price:** Gray indicator

---

## Phase 7: Integration Points

### 7.1 Lab Order Creation Integration
When creating a lab order (existing form):
1. Display service selection dropdown (populated from lab-services API)
2. On service selection, fetch active price
3. Show price in form as read-only initially
4. Allow manual override if needed

**File to modify:** `src/app/(dashboard)/laboratory/components/lab-order-form.tsx`

**Changes:**
- Add service_id field to form
- Add autocomplete for service selection
- Fetch and display active price on selection
- Allow manual price override

### 7.2 Dashboard Integration
Add Lab Services summary card on dashboard:
- Total services configured
- Active services count
- Number of pricing tiers

**File to modify:** `src/app/(dashboard)/dashboard/page.tsx`

### 7.3 Sidebar Navigation
**NO CHANGE NEEDED** - Laboratory menu item already exists
Simply extend existing Laboratory page with new sections

---

## Phase 8: Data Flow Diagram

```
Frontend                          Backend
─────────────────────────────────────────

User visits /lab-prices
         │
         ├─→ GET /api/lab-services (with filters)
         │   └─→ Returns: LabService[]
         │
         ├─→ Display Services Table
         │
         └─→ User clicks "Add Service"
             ├─→ Opens Form Modal
             └─→ User submits form
                 ├─→ POST /api/lab-services
                 │   └─→ Returns: Created LabService
                 ├─→ Show success toast
                 └─→ Refresh services list

User switches to Prices Tab
         │
         ├─→ GET /api/lab-service-prices (with filters)
         │   └─→ Returns: LabServicePrice[]
         │
         ├─→ Display Prices Table
         │
         └─→ User clicks "Add Price"
             ├─→ Opens Price Form Modal
             ├─→ GET /api/lab-services (for dropdown)
             └─→ User submits form
                 ├─→ POST /api/lab-service-prices
                 │   └─→ Returns: Created LabServicePrice
                 ├─→ Show success toast
                 └─→ Refresh prices list
```

---

## Phase 9: Implementation Order

1. **Step 1:** Create API utility functions (`src/lib/api-lab-prices.ts`)
2. **Step 2:** Add types to `src/lib/types.ts`
3. **Step 3:** Create validation schemas
4. **Step 4:** Create individual components (table, form, filter)
5. **Step 5:** Create main page with tab switching
6. **Step 6:** Implement create/edit/delete functionality
7. **Step 7:** Add search and filter functionality
8. **Step 8:** Integrate with lab order creation
9. **Step 9:** Add dashboard summary
10. **Step 10:** Update sidebar navigation
11. **Step 11:** Testing and refinement

---

## Phase 10: Error Handling

**Expected Errors:**
1. Network errors → Show toast with retry button
2. Validation errors → Show field-level errors in form
3. Permission errors → Redirect to dashboard or hide action buttons
4. Duplicate service → Show error message, suggest alternative
5. Price conflict → Warn about deactivating other prices
6. Invalid price range → Show error on filter
7. Service in use → Warn before deletion

---

## Phase 11: Loading States

**Skeleton Screens:**
```
Services Table Skeleton:
┌───────────────────────────────────┐
│ [Skeleton Row]                    │
│ [Skeleton Row]                    │
│ [Skeleton Row]                    │
└───────────────────────────────────┘

Form Loading:
- Disable submit button
- Show loading spinner
- Disable all inputs
```

---

## Phase 12: Accessibility

- Form labels for all inputs
- ARIA labels for icon buttons
- Keyboard navigation support
- Color not the only indicator (use icons/text)
- Proper heading hierarchy
- Focus management in modals
- Toast notifications for screen readers

---

## Phase 13: Performance Considerations

1. **Pagination:** Limit results to 10-20 per page
2. **Caching:** Cache lab services list for quick access
3. **Debouncing:** Debounce search input (300ms)
4. **Lazy Loading:** Load prices on demand
5. **Memoization:** Memoize expensive components
6. **Image Optimization:** Use Next.js Image component

---

## Phase 14: Testing Strategy

**Unit Tests:**
- Validation schemas
- API functions
- Component logic

**Integration Tests:**
- Create flow (form → submit → list update)
- Search flow (input → filter → results)
- Delete flow (confirmation → delete → refresh)

**E2E Tests:**
- Full lab service CRUD workflow
- Search and filter combinations
- Permission-based visibility

---

## File Structure
```
src/app/(dashboard)/laboratory/
├── page.tsx                                   # MODIFIED: Enhanced with Lab Services/Prices tabs
├── components/
│   ├── lab-table.tsx                         # (Existing Lab Orders table)
│   ├── lab-order-form.tsx                    # (Existing - Enhanced with service selection)
│   ├── lab-services-table.tsx                # NEW
│   ├── lab-prices-table.tsx                  # NEW
│   ├── lab-service-form.tsx                  # NEW
│   ├── lab-service-price-form.tsx            # NEW
│   ├── lab-prices-filter.tsx                 # NEW
│   ├── price-history-modal.tsx               # NEW
│   └── lab-section-switcher.tsx              # NEW: Tabs/Dropdown for section switching
└── schemas/
    ├── lab-service.schema.ts                 # NEW
    └── lab-service-price.schema.ts           # NEW

src/lib/
├── api-lab-prices.ts                         # NEW: 11 API functions
├── api.ts                                    # (Existing - may add lab service functions here)
└── types.ts                                  # MODIFIED: Add LabService & LabServicePrice types
```

## Modified Files
```
src/app/(dashboard)/laboratory/page.tsx       # Main change - add section switcher + handlers
src/app/(dashboard)/laboratory/components/lab-order-form.tsx  # Add service_id + price lookup
src/app/(dashboard)/dashboard/page.tsx        # Add Lab Services summary card (optional)
src/lib/api.ts                                # (May import from api-lab-prices.ts)
src/lib/types.ts                              # Add new types
```

---

## Notes

- All forms use React Hook Form + Zod validation
- All API calls use getCustomAxios() for authentication
- All pages check permissions before rendering
- All lists support pagination
- All modals use shadcn/ui Dialog component
- All tables use shadcn/ui Table component
- Loading states use Skeleton component from shadcn/ui
