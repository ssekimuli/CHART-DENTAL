# Lab Prices Integration with Lab Orders - Implementation Guide

## Overview
The backend Lab Order model has been updated with:
- `lab_service_id` (foreign key to lab services)
- `applied_price` (decimal field to store price at order creation)

This guide ensures frontend Lab Order creation integrates properly with the new Lab Prices system.

---

## Frontend Implementation Strategy

### Phase 1: Update Lab Order Form

**File:** `src/app/(dashboard)/laboratory/components/lab-order-form.tsx`

**Changes Required:**

#### 1.1 Add Service Selection
```typescript
// New field in form
{
  name: 'labServiceId',
  label: 'Lab Service',
  type: 'select', // or autocomplete
  required: false, // Optional - for backward compatibility
  description: 'Select a configured lab service to auto-populate price',
}
```

#### 1.2 Add Applied Price Field
```typescript
// New field in form
{
  name: 'appliedPrice',
  label: 'Service Price',
  type: 'decimal',
  readOnly: true, // Initially read-only, fetched from lab service
  description: 'Price automatically fetched from lab service',
  editable: true, // Allow manual override
}
```

#### 1.3 Add Lab Service API Calls
```typescript
// Import at top
import { getLabServices, getActivePriceForService } from '@/lib/api-lab-prices';

// In component
const [labServices, setLabServices] = useState<LabService[]>([]);

useEffect(() => {
  const fetchServices = async () => {
    const services = await getLabServices(selectedBranch);
    setLabServices(services);
  };
  fetchServices();
}, [selectedBranch]);

// On service selection change
const handleServiceSelect = async (serviceId: number) => {
  const price = await getActivePriceForService(serviceId);
  if (price) {
    form.setValue('appliedPrice', price.base_price);
  }
};
```

#### 1.4 Update Form Validation
```typescript
const labOrderSchema = z.object({
  // ... existing fields ...
  labServiceId: z.number().optional().nullable(),
  appliedPrice: z.number().positive().multipleOf(0.01).optional().nullable(),
});
```

### Phase 2: Backend Controller Update

**File:** `app/Http/Controllers/ManagementController.php::createLabOrder()`

**Changes Required:**

```php
public function createLabOrder(Request $request)
{
    $validated = $request->validate([
        // ... existing fields ...
        'labServiceId' => 'nullable|exists:lab_services,id',
        'appliedPrice' => 'nullable|numeric|min:0',
    ]);

    // If service selected, validate price
    if ($validated['labServiceId'] ?? null) {
        $service = LabService::find($validated['labServiceId']);
        $activePrice = $service->getActivePrice();
        
        // Use provided price or active price from service
        $appliedPrice = $validated['appliedPrice'] ?? $activePrice?->base_price;
    } else {
        $appliedPrice = $validated['appliedPrice'] ?? null;
    }

    $labOrder = LaboratoryOrder::create([
        // ... existing fields ...
        'lab_service_id' => $validated['labServiceId'] ?? null,
        'applied_price' => $appliedPrice,
    ]);

    // ... rest of method ...
}
```

### Phase 3: Frontend Lab Orders List Update

**File:** `src/app/(dashboard)/laboratory/page.tsx`

**Changes:**

#### 3.1 Update Lab Order Type
```typescript
// Already includes new fields:
interface LaboratoryOrder {
  // ... existing fields ...
  lab_service_id?: number | null;
  applied_price?: number | null;
}
```

#### 3.2 Update Lab Orders Table
```typescript
// Add columns to lab-table.tsx
- Lab Service (if available)
- Applied Price (if available)
- Override indicator (if different from current service price)
```

#### 3.3 Update Lab Order API Call
```typescript
// The existing getLabOrders() call will return new fields
// No changes needed on frontend, but can use data when displaying
```

---

## Frontend Components Implementation

### Component 1: Lab Service Selector
**File:** `src/app/(dashboard)/laboratory/components/lab-service-selector.tsx` (NEW)

```typescript
interface LabServiceSelectorProps {
  value?: number;
  onChange: (serviceId: number, price: number) => void;
  onPriceChange?: (price: number) => void;
  showPrice?: boolean;
}

// Features:
// - Autocomplete search for lab services
// - Display service category as hint
// - Show active price in dropdown
// - Handle loading states
// - Error handling for missing services
```

### Component 2: Lab Order Form Enhanced
**File:** `src/app/(dashboard)/laboratory/components/lab-order-form.tsx` (MODIFIED)

**Form Flow:**
```
1. User fills basic info (client, item, dates, etc.)
2. User selects Lab Service (optional)
   - Auto-fetches active price
   - Updates "Applied Price" field
3. User can override price if needed
   - Toggle "Use Custom Price" button
   - Edit price field
4. User submits form
   - Sends all fields including lab_service_id + applied_price
```

---

## API Integration

### New API Function Needed

**File:** `src/lib/api-lab-prices.ts`

```typescript
// Already implemented:
export const getLabServices = async (branchId: number, page?: number, filters?: any)
export const getActivePriceForService = async (serviceId: number)

// Will be used in:
// - Lab Order Form (fetch services, fetch active price)
// - Lab Services Section (list, create, edit, delete)
// - Lab Prices Section (list, create, edit, delete)
```

---

## Data Flow Example

### Creating Lab Order with Service

```
User Action                  Frontend                    Backend
───────────────────────────────────────────────────────────────

Select Lab Service
         │
         └─→ GET /api/lab-services
             (fetch active price)
             
         │
         └─→ Auto-fill "Applied Price"
             (e.g., 5000)

User clicks Submit
         │
         └─→ POST /api/management/lab-orders
             {
               clientId: 1,
               labServiceId: 4,
               appliedPrice: 5000,
               item: "Crown",
               ... other fields ...
             }
             
             │
             └─→ Backend creates LaboratoryOrder
                 - Links to lab service
                 - Stores applied price for audit
                 - Returns created order
             
         │
         └─→ Show success toast
         └─→ Refresh lab orders list
```

---

## Backward Compatibility

### Lab Orders Without Service

Users can still create lab orders without selecting a lab service:
- `lab_service_id` = NULL
- `applied_price` = User-entered cost or NULL
- Existing functionality remains unchanged

### Migration Path

1. **Phase 1:** Deploy frontend & backend changes
2. **Phase 2:** Lab Services/Prices management becomes available
3. **Phase 3:** Users can optionally use lab services
4. **Phase 4:** (Future) Enforce lab service selection for new orders

---

## Validation Rules

### Frontend Validation
```typescript
labServiceId: optional
appliedPrice: optional, must be positive decimal with 2 places

If labServiceId provided:
  - Must be valid service ID
  - If appliedPrice not provided, fetch from service
  - If appliedPrice provided, show warning if different from active price
```

### Backend Validation
```php
labServiceId: nullable, must exist in lab_services table
appliedPrice: nullable, numeric, min 0

If labServiceId provided:
  - Validate service exists
  - Apply price logic (use provided or from service)
  
If appliedPrice provided without service:
  - Accept as manual override
  - Store for historical accuracy
```

---

## UI/UX Enhancements

### Lab Order Form Layout
```
┌─────────────────────────────────────┐
│ Lab Order Form                      │
├─────────────────────────────────────┤
│                                     │
│ Client:      [Select Client ▼]     │
│ Patient:     [Text Input]          │
│                                     │
│ ┌─ Lab Service & Pricing ─────────┐│
│ │                                  ││
│ │ Lab Service: [Service Dropdown]  ││
│ │              (Autocomplete)      ││
│ │              Category: Crown     ││
│ │                                  ││
│ │ Applied Price: [5000]           ││
│ │  ☐ Override price               ││
│ │                                  ││
│ └──────────────────────────────────┘│
│                                     │
│ Item:        [Text Input]          │
│ Tooth:       [Number Input]        │
│ Sent Date:   [Date Picker]         │
│ Due Date:    [Date Picker]         │
│ Material:    [Text Input]          │
│ Shade:       [Text Input]          │
│ Instructions:[Text Area]           │
│                                     │
│ Status:      [Status Selector]     │
│ Doctor:      [Doctor Selector]     │
│                                     │
│                [Cancel] [Save]     │
└─────────────────────────────────────┘
```

### Lab Orders Table Enhancement
```
┌────────────────────────────────────────────────────────────┐
│ Lab Orders                                                 │
├──────────────────────────────────────────────────────────────┤
│ Service    │ Item    │ Price  │ Status │ Sent Date │ Actions│
├──────────────────────────────────────────────────────────────┤
│ Crown      │ Crown   │ 5000   │ Ready  │ 2026-08-28│ [...] │
│ Bridge     │ Bridge  │ 8000   │ Draft  │ 2026-08-27│ [...] │
│ (manual)   │ Veneer  │ 3000   │ Sent   │ 2026-08-26│ [...] │
└──────────────────────────────────────────────────────────────┘
```

---

## Testing Checklist

### Frontend Testing
- [ ] Lab Order form loads without service (backward compat)
- [ ] Lab Service dropdown populates with services
- [ ] Selecting service fetches active price
- [ ] Price field updates when service selected
- [ ] Override price toggle works
- [ ] Can submit form with service + auto price
- [ ] Can submit form with manual price override
- [ ] Can submit form without service (backward compat)
- [ ] Lab orders table shows service (if available)
- [ ] Lab orders table shows applied price (if available)

### Backend Testing
- [ ] Create lab order with lab_service_id + auto price
- [ ] Create lab order with lab_service_id + manual override
- [ ] Create lab order without lab_service_id (backward compat)
- [ ] Applied price saved correctly
- [ ] Lab service relationship works
- [ ] Historical price tracking works (applied_price never changes)

### Integration Testing
- [ ] Create lab service → Create order with it → Price shows correctly
- [ ] Change active price → New orders get new price
- [ ] Old orders keep historical applied_price
- [ ] Override price warning shows (if applicable)

---

## Implementation Priority

### Priority 1 (MVP)
1. ✓ Update Lab Order form with optional service selection
2. ✓ Auto-fetch price when service selected
3. ✓ Send lab_service_id + applied_price to backend
4. ✓ Display service info in lab orders list
5. ✓ Update backend controller

### Priority 2 (Polish)
1. Lab Services management section
2. Lab Prices management section
3. Price history modal
4. Advanced filtering

### Priority 3 (Enhancement)
1. Dashboard summary card
2. Export/import lab services
3. Bulk price updates
4. Analytics/reporting

---

## Notes for Implementation

1. **Backward Compatibility:** Always allow orders without service selection
2. **Applied Price:** Store at order creation time, never update (audit trail)
3. **Auto-fetch:** Use getActivePriceForService() API function
4. **Error Handling:** If service has no active price, show warning but allow manual entry
5. **UI Priority:** Service selection is optional in initial implementation
6. **Future:** May require service selection in Phase 4+

---

## Files to Create/Modify

### CREATE
- `src/app/(dashboard)/laboratory/components/lab-service-selector.tsx`
- `src/app/(dashboard)/laboratory/components/lab-services-table.tsx`
- `src/app/(dashboard)/laboratory/components/lab-prices-table.tsx`
- `src/app/(dashboard)/laboratory/components/lab-service-form.tsx`
- `src/app/(dashboard)/laboratory/components/lab-service-price-form.tsx`
- `src/app/(dashboard)/laboratory/components/lab-prices-filter.tsx`
- `src/app/(dashboard)/laboratory/components/price-history-modal.tsx`
- `src/app/(dashboard)/laboratory/components/lab-section-switcher.tsx`
- `src/app/(dashboard)/laboratory/schemas/lab-service.schema.ts`
- `src/app/(dashboard)/laboratory/schemas/lab-service-price.schema.ts`
- `src/lib/api-lab-prices.ts`

### MODIFY
- `src/app/(dashboard)/laboratory/page.tsx`
- `src/app/(dashboard)/laboratory/components/lab-order-form.tsx`
- `src/lib/types.ts`
- `src/lib/api.ts` (optional - re-export lab price functions)
- `app/Http/Controllers/ManagementController.php::createLabOrder()` (backend)

---

## Backend Update Required

Before frontend deployment, update `ManagementController.php`:

```php
// In createLabOrder() method, add:
'labServiceId' => 'nullable|exists:lab_services,id',
'appliedPrice' => 'nullable|numeric|min:0',

// And add to create() call:
'lab_service_id' => $validated['labServiceId'] ?? null,
'applied_price' => $appliedPrice,
```
