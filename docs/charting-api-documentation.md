# 🦷 Patient Charting — Full API & UI Documentation

> **Route:** `/patients/{id}/charting`  
> **Base API URL:** `https://victoriousdentalapi.poslycloud.com/api`  
> **Auth:** Bearer Token (sent via Axios interceptor)  
> **Content-Type:** `application/json` (except document uploads: `multipart/form-data`)

---

## Page Bootstrap — Load Patient Data

Before any charting tab renders, the page fetches the full patient record **once** and stores it in React state. Every charting section then reads from that shared state.

### GET Patient Record

| Field | Value |
|---|---|
| **Endpoint** | `GET /patients/{id}` |
| **Function** | `getPatientById(id)` in `src/lib/api.ts` |

#### Response Body (mapped to frontend `Patient` type)

```json
{
  "id": 7,
  "first_name": "Jane",
  "last_name": "Doe",
  "avatar": "https://...",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "address": "123 Dental St",
  "gender": "Female",
  "date_of_birth": "1990-05-20T00:00:00.000Z",
  "last_visit": "2024-07-01T00:00:00.000Z",
  "next_visit": null,
  "status": "Active",
  "history": "No known allergies.",
  "branch_id": 1,
  "dental_records": [
    { "tooth_id": 11, "condition": "Caries", "notes": "" }
  ],
  "treatment_plans": [
    { "id": 42, "procedure_id": 5, "procedure": "Filling", "tooth": 11, "status": "Proposed", "cost": "150.00", "date": "2024-07-01", "invoice_id": null }
  ],
  "images": [
    { "id": 1, "url": "https://...", "description": "Panoramic X-ray", "date": "2024-06-01", "category": "X-Ray" }
  ],
  "periodontal_records": [ /* JSON array or string */ ],
  "occlusal_records": { "overbite": 2, "overjet": 3, "crossbite": "None", "openbite": "None", "malocclusion": "Class I" },
  "soft_tissue_records": [],
  "orthodontic_records": [],
  "endodontic_records": [],
  "restorative_records": []
}
```

#### Frontend Field Mapping

| API Field | Frontend Field | Notes |
|---|---|---|
| `date_of_birth` | `dateOfBirth` | Strips time (`split('T')[0]`) |
| `last_visit` | `lastVisit` | Strips time |
| `branch_id` | `branchId` | Converted to `String` |
| `dental_records` | `dentalRecords` | Array of `DentalRecord` |
| `treatment_plans` | `treatmentPlans` | Array of `Treatment` |
| `images` | `imaging` | Array of `PatientImage` |
| `periodontal_records` | `periodontalRecords` | Parsed as `PeriodontalMeasurement[]` |
| `occlusal_records` | `occlusalRecords` | Parsed as `OcclusalRecord` |
| `soft_tissue_records` | `softTissueRecords` | Array of `SoftTissueRecord` |
| `orthodontic_records` | `orthodonticRecords` | Parsed via `mapOrthodonticRecords()` |
| `endodontic_records` | `endodonticRecords` | Parsed via `mapEndodonticRecords()` |
| `restorative_records` | `restorativeRecords` | Array of `RestorativeRecord` |

---

---

## 1. Odontogram (Dental Chart)

> **Tab value:** `odontogram`  
> **Component:** `DentalChart` → `src/app/(dashboard)/patients/[id]/components/dental-chart.tsx`

### Overview

Interactive SVG/image-based full-mouth chart using FDI tooth numbering (11–18, 21–28, 31–38, 41–48, plus deciduous 51–85). Each tooth is clickable and colour-coded by condition.

### UI Layout

- **Top bar:** "Odontogram (Dental Chart)" title + "New Treatment" button (permission-guarded)
- **Tooth grid:** 4 quadrants (upper right, upper left, lower left, lower right); each tooth shows a PNG image from `/public/teeth/{toothId}.png`, overlaid with a colour that maps to its condition
- **Condition colours:**

| Condition | Display Colour |
|---|---|
| `Healthy` | Green overlay |
| `Caries` | Red overlay |
| `Filling` | Blue overlay |
| `Crown` | Yellow overlay |
| `Missing` | Grey / crossed-out |
| `Fracture` | Orange overlay |
| `Implant` | Purple + implant image |
| `Bridge` | Connected multi-tooth blue bar |
| `Retained Root` | Brown overlay |

- **Click a tooth** → context menu: Log Condition, Add Treatment, Add Restorative Record
- **Legend bar:** colour-to-condition key at bottom of chart

---

### 1.1 — Load Odontogram Records

Data is loaded as part of the patient bootstrap (`dental_records` in `GET /patients/{id}`). No separate GET call.

---

### 1.2 — Save / Update Dental Condition (Log Condition)

| Field | Value |
|---|---|
| **Endpoint** | `POST /patients/{id}/odontogram-records` |
| **Function** | `saveDentalRecord(patientId, record)` |
| **Trigger** | User clicks tooth → "Log Condition" → selects condition → saves |

#### Request Payload

```json
{
  "tooth_id": 11,
  "condition": "Caries",
  "notes": "Small pit cavity on buccal surface",
  "bridge_group_id": null
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `tooth_id` | `number` | ✅ | FDI tooth number |
| `condition` | `string` | ✅ | One of: `Healthy`, `Caries`, `Filling`, `Crown`, `Missing`, `Fracture`, `Implant`, `Bridge`, `Retained Root`, `Malocclusion`, `Generalized Calculus` |
| `notes` | `string` | ❌ | Free-text clinical notes |
| `bridge_group_id` | `string \| null` | ❌ | UUID string grouping multi-tooth bridge spans |

#### Response Body

```json
{
  "data": {
    "id": 101,
    "tooth_id": 11,
    "condition": "Caries",
    "notes": "Small pit cavity on buccal surface",
    "bridge_group_id": null,
    "created_at": "2024-07-15T10:00:00.000Z",
    "updated_at": "2024-07-15T10:00:00.000Z"
  }
}
```

> **UI Update:** After save, the tooth's colour on the chart updates instantly (React state update).

---

### 1.3 — Batch Log Condition (Multiple Teeth)

| Field | Value |
|---|---|
| **Endpoint** | `POST /patients/{id}/odontogram-records` (called in parallel via `Promise.allSettled`) |
| **Function** | `handleBatchLogCondition(toothIds, condition, notes)` |
| **Trigger** | User multi-selects teeth → ConditionLogger → Save |

The frontend calls `saveDentalRecord()` individually for each selected tooth ID in parallel.

---

### 1.4 — Save Bridge (Multi-Tooth)

| Field | Value |
|---|---|
| **Endpoint** | `POST /patients/{id}/odontogram-records` (sequential per tooth) |
| **Function** | `handleConfirmBridge(toothIds, bridgeGroupId)` |

Each tooth in the bridge span is saved with `condition: "Bridge"` and the same `bridge_group_id` UUID.

---

### 1.5 — Update Dental Record

| Field | Value |
|---|---|
| **Endpoint** | `PUT /patients/{id}/odontogram-records/{recordId}` |
| **Function** | `updateDentalRecord(patientId, recordId, record)` |

#### Request Payload

```json
{
  "tooth_id": 11,
  "condition": "Filling",
  "notes": "Composite filling placed"
}
```

---

### 1.6 — Delete Dental Record

| Field | Value |
|---|---|
| **Endpoint** | `DELETE /patients/{id}/odontogram-records/{recordId}` |
| **Function** | `deleteDentalRecord(patientId, recordId)` |

---

### 1.7 — Add Treatment from Odontogram

See **Treatment Plan** section (below) — the same `addTreatment` / `addTreatmentsBatch` APIs are called.

---

---

## 2. Periodontal Chart

> **Tab value:** `periodontal`  
> **Component:** `PeriodontalChart` → `src/app/(dashboard)/patients/[id]/charting/components/periodontal-chart.tsx`

### Overview

Full-mouth periodontal screening grid with 6 probe points per tooth (distobuccal, buccal, mesiobuccal, distolingual, lingual, mesiolingual). Tracks pocket depths, recession, mobility, furcation, and clinical conditions (bleeding, suppuration, plaque, calculus). Also includes a PSR (Periodontal Screening and Recording) sextant summary.

### UI Layout

- **Header:** "Periodontal Chart" title + PSR sextant scores + "Save" button
- **Tooth sequence:** all 32 permanent teeth arranged in two rows (upper arch top row, lower arch bottom row), ordered from right to left (mirroring dental convention)
- **Per-tooth input grid:**
  - 6 pocket depth inputs (mm) — coloured red if ≥4 mm
  - Recession field (numeric)
  - Mobility selector (0, 1, 2, 3)
  - Furcation selector (None, I, II, III)
  - 4 condition checkboxes (Bleeding, Suppuration, Plaque, Calculus)
- **PSR summary strip** at top showing sextant codes
- **Send button:** opens dialog to share results via email or WhatsApp

---

### 2.1 — Load Periodontal Records

Data comes from `periodontal_records` in `GET /patients/{id}`. The `mapPeriodontalRecords()` helper converts backend snake_case to frontend camelCase.

---

### 2.2 — Save Periodontal Records

| Field | Value |
|---|---|
| **Endpoint** | `POST /patients/{id}/periodontal-records` |
| **Function** | `savePeriodontalRecord(patientId, records)` |
| **Trigger** | User fills probe data → clicks "Save Chart" |

#### Request Payload

```json
{
  "records": [
    {
      "tooth_id": 11,
      "pockets": {
        "distobuccal": 2,
        "buccal": 3,
        "mesiobuccal": 2,
        "distolingual": 2,
        "lingual": 2,
        "mesiolingual": 2
      },
      "recession": 0,
      "mobility": "0",
      "furcation": null,
      "conditions": {
        "bleeding": false,
        "suppuration": false,
        "plaque": true,
        "calculus": false
      }
    }
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `records` | `array` | ✅ | Array of per-tooth measurements |
| `records[].tooth_id` | `number` | ✅ | FDI tooth number |
| `records[].pockets` | `object` | ✅ | 6 probe depth values (mm) |
| `records[].recession` | `number` | ❌ | Gingival recession in mm |
| `records[].mobility` | `"0" \| "1" \| "2" \| "3"` | ❌ | Miller mobility grade |
| `records[].furcation` | `"I" \| "II" \| "III" \| null` | ❌ | Furcation involvement grade |
| `records[].conditions` | `object` | ✅ | Clinical flags |
| `records[].conditions.bleeding` | `boolean` | ✅ | Bleeding on probing |
| `records[].conditions.suppuration` | `boolean` | ✅ | Suppuration present |
| `records[].conditions.plaque` | `boolean` | ✅ | Plaque index |
| `records[].conditions.calculus` | `boolean` | ✅ | Calculus present |

#### Response

Returns HTTP 200/201. The frontend then re-fetches the full patient via `getPatientById(patientId)` and updates state.

---

### 2.3 — Send Periodontal Results (Email / WhatsApp)

| Field | Value |
|---|---|
| **Endpoint** | `POST /patients/{id}/periodontal/send` |
| **Function** | `sendPeriodontalResult(patientId, channel, recipient, customMessage, data)` |

#### Request Payload

```json
{
  "channel": "email",
  "recipient": "patient@example.com",
  "custom_message": "Please review your periodontal screening results.",
  "data": { /* periodontal records object */ }
}
```

| Field | Type | Values |
|---|---|---|
| `channel` | `string` | `"email"` or `"whatsapp"` |
| `recipient` | `string` | Email address or phone number |
| `custom_message` | `string` | Optional personalised note |
| `data` | `object` | Full periodontal data payload |

---

---

## 3. Orthodontic Chart

> **Tab value:** `orthodontic`  
> **Component:** `OrthodonticChart` → `src/app/(dashboard)/patients/[id]/charting/components/orthodontic-chart.tsx`  
> **Form page (new):** `/patients/{id}/charting/orthodontic/new`  
> **Form page (edit):** `/patients/{id}/charting/orthodontic/{recordId}`

### Overview

Tracks braces / aligner treatment progress over time. Each visit session is a separate record with details about the appliance, wires, brackets, and next-visit goals.

### UI Layout

- **Header:** "Orthodontic Chart" + "Add Record" button
- **Summary strip** (only if records exist): shows latest Current Appliance, Phase, Treatment Time (auto-calculated from first to latest record date), Next Visit Goal
- **Records table** with columns: Date, Appliance, Location, Phase, Wire Size (Upper/Lower), Notes, Actions
- **Actions (per row):** Edit → navigates to edit page; Delete → confirmation dialog

---

### 3.1 — Load Orthodontic Records

Comes from `orthodontic_records` in `GET /patients/{id}`. Mapped via `mapOrthodonticRecords()`.

---

### 3.2 — Create Orthodontic Record

| Field | Value |
|---|---|
| **Endpoint** | `POST /patients/{id}/orthodontic-records` |
| **Function** | `saveOrthodonticRecord(patientId, record)` |
| **Trigger** | User fills form on `/patients/{id}/charting/orthodontic/new` → submits |

#### Request Payload

```json
{
  "appliance": "Fixed Braces",
  "appliance_location": "Full Arch",
  "treatment_phase": "Active",
  "wire_size": null,
  "wire_size_upper": "0.016 NiTi",
  "wire_size_lower": "0.014 NiTi",
  "archwire_material": "NiTi",
  "elastics": "Class II",
  "compliance": "Good",
  "oral_hygiene": "Fair",
  "bracket_changes": ["14", "24"],
  "broken_brackets": [],
  "next_visit_goals": "Level and align upper arch",
  "notes": "Patient compliant. Good progress."
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `appliance` | `string` | ✅ | e.g., `Fixed Braces`, `Aligners`, `Retainer` |
| `appliance_location` | `string` | ❌ | e.g., `Upper Arch`, `Lower Arch`, `Full Arch` |
| `treatment_phase` | `string` | ❌ | e.g., `Active`, `Retention`, `Finishing` |
| `wire_size` | `string \| null` | ❌ | Single wire size (legacy) |
| `wire_size_upper` | `string` | ❌ | Upper arch wire (e.g., `0.016 NiTi`) |
| `wire_size_lower` | `string` | ❌ | Lower arch wire |
| `archwire_material` | `string` | ❌ | e.g., `NiTi`, `Stainless Steel`, `TMA` |
| `elastics` | `string` | ❌ | e.g., `Class I`, `Class II`, `None` |
| `compliance` | `string` | ❌ | Patient compliance rating |
| `oral_hygiene` | `string` | ❌ | Oral hygiene observation |
| `bracket_changes` | `string[]` | ❌ | Tooth IDs where brackets were changed |
| `broken_brackets` | `string[]` | ❌ | Tooth IDs with broken brackets |
| `next_visit_goals` | `string` | ❌ | Clinical goal for next visit |
| `notes` | `string` | ❌ | Free-text session notes |

#### Response

Backend returns saved record. Frontend re-fetches via `getPatientById()`.

---

### 3.3 — Update Orthodontic Record

| Field | Value |
|---|---|
| **Endpoint** | `PUT /patients/{id}/orthodontic-records/{recordId}` |
| **Function** | `updateOrthodonticRecord(patientId, record)` |
| **Trigger** | User edits form on `/patients/{id}/charting/orthodontic/{recordId}` → submits |

Same payload as create (with `id` identifying the record).

---

### 3.4 — Delete Orthodontic Record

| Field | Value |
|---|---|
| **Endpoint** | `DELETE /patients/{id}/orthodontic-records/{recordId}` |
| **Function** | `deleteOrthodonticRecord(patientId, recordId)` |
| **Trigger** | User clicks Delete in dropdown → confirms in alert dialog |

---

#### Orthodontic Record Type (Frontend)

```typescript
type OrthodonticRecord = {
  id: string | number;
  date: string;                  // "YYYY-MM-DD"
  appliance: string;
  applianceLocation?: string;
  treatmentPhase?: string;
  wireSize?: string;
  wireSizeUpper?: string;
  wireSizeLower?: string;
  archwireMaterial?: string;
  elastics?: string;
  compliance?: string;
  oralHygiene?: string;
  bracketChanges?: string[];
  brokenBrackets?: string[];
  notes?: string;
  nextVisitGoals?: string;
  monthsInTreatment?: number;
}
```

---

---

## 4. Endodontic Chart

> **Tab value:** `endodontic`  
> **Component:** `EndodonticChart` → `src/app/(dashboard)/patients/[id]/charting/components/endodontic-chart.tsx`  
> **Form:** `EndodonticRecordForm` → `src/app/(dashboard)/patients/[id]/charting/components/endodontic-record-form.tsx`

### Overview

Tracks Root Canal Treatment (RCT) details per tooth: pulpal and periapical diagnoses, per-canal measurements, obturation material, and post placement.

### UI Layout

- **Header:** "Endodontic Chart" + "Add Record" button (permission-guarded)
- **Records table** columns: Date, Tooth (with mini tooth PNG icon + red glow if canals filled), Pulpal Diagnosis, Periapical Diagnosis, Canals (WL), Obturation Material, Post Type, Actions
- **Canal badges:** each canal shown as `{name}: {workingLength}mm`
- **Post Type badge:** styled blue only if post type is not "None"
- **Actions:** Edit (opens inline form replacing the card), Delete (alert dialog)
- **Empty state:** "No endodontic records found."

---

### 4.1 — Load Endodontic Records

Comes from `endodontic_records` in `GET /patients/{id}`. Mapped via `mapEndodonticRecords()`.

---

### 4.2 — Create Endodontic Record

| Field | Value |
|---|---|
| **Endpoint** | `POST /patients/{id}/endodontic-records` |
| **Function** | `saveEndodonticRecord(patientId, record)` |
| **Trigger** | User clicks "Add Record" → fills form → saves |

#### Request Payload

```json
{
  "tooth_id": 36,
  "pulpal_diagnosis": "Irreversible Pulpitis",
  "periapical_diagnosis": "Normal Apical Tissues",
  "canals": [
    {
      "name": "MB",
      "referencePoint": "Incisal Edge",
      "workingLength": 21.5,
      "fileSize": "25",
      "obturationSize": "25"
    },
    {
      "name": "DB",
      "referencePoint": "Incisal Edge",
      "workingLength": 20.0,
      "fileSize": "30",
      "obturationSize": "30"
    },
    {
      "name": "P",
      "referencePoint": "Incisal Edge",
      "workingLength": 22.0,
      "fileSize": "35",
      "obturationSize": "35"
    }
  ],
  "obturation_material": "Gutta-Percha",
  "post_type": "None",
  "notes": "3-canal lower molar, successful obturation."
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `tooth_id` | `number` | ✅ | FDI tooth number |
| `pulpal_diagnosis` | `string` | ✅ | e.g., `Irreversible Pulpitis`, `Necrotic Pulp` |
| `periapical_diagnosis` | `string` | ✅ | e.g., `Normal Apical Tissues`, `Apical Periodontitis` |
| `canals` | `CanalDetail[]` | ✅ | Array of canal objects |
| `canals[].name` | `string` | ✅ | Canal identifier: `MB`, `DB`, `ML`, `P`, etc. |
| `canals[].referencePoint` | `string` | ❌ | Measurement reference (e.g., cusp tip) |
| `canals[].workingLength` | `number` | ❌ | Working length in mm |
| `canals[].fileSize` | `string` | ❌ | ISO file size at working length |
| `canals[].obturationSize` | `string` | ❌ | Obturation cone size |
| `obturation_material` | `string` | ❌ | e.g., `Gutta-Percha`, `Bioceramic` |
| `post_type` | `string` | ❌ | e.g., `None`, `Fiber Post`, `Cast Post` |
| `notes` | `string` | ❌ | Clinical session notes |

#### Response

```json
{
  "id": 55,
  "tooth_id": 36,
  "pulpal_diagnosis": "Irreversible Pulpitis",
  "periapical_diagnosis": "Normal Apical Tissues",
  "canals": [ /* CanalDetail objects */ ],
  "obturation_material": "Gutta-Percha",
  "post_type": "None",
  "notes": "3-canal lower molar.",
  "created_at": "2024-07-15T11:00:00.000Z",
  "updated_at": "2024-07-15T11:00:00.000Z"
}
```

---

### 4.3 — Update Endodontic Record

| Field | Value |
|---|---|
| **Endpoint** | `PUT /patients/{id}/endodontic-records/{recordId}` |
| **Function** | `updateEndodonticRecord(patientId, record)` |

Same payload as create.

---

### 4.4 — Delete Endodontic Record

| Field | Value |
|---|---|
| **Endpoint** | `DELETE /patients/{id}/endodontic-records/{recordId}` |
| **Function** | `deleteEndodonticRecord(patientId, recordId)` |

---

#### Endodontic Record Type (Frontend)

```typescript
type CanalDetail = {
  name: string;
  referencePoint?: string;
  workingLength?: number;
  fileSize?: string;
  obturationSize?: string;
};

type EndodonticRecord = {
  id: string | number;
  date: string;               // "YYYY-MM-DD"
  toothId: number;
  pulpalDiagnosis: string;
  periapicalDiagnosis: string;
  canals: CanalDetail[];
  obturationMaterial?: string;
  postType?: string;
  notes?: string;
};
```

---

---

## 5. Give Prescription

> **Trigger:** "Give Prescription" button in charting header (top bar)  
> **Component:** `PrescriptionForm` → `src/app/(dashboard)/patients/[id]/components/prescription-form.tsx`  
> **Modal:** Full-screen Dialog overlay

### Overview

Issues a drug prescription for the patient directly from the charting view. Pulls pharmacy inventory (medicines + units) and doctor list. Optionally bills the prescription to the patient's pending invoice automatically.

### UI Layout

1. **Patient field** (auto-filled, read-only)
2. **Prescribing Doctor** combobox (searchable dropdown from `/doctors`)
3. **Medicines grid** (each row):
   - Medicine name (searchable combobox from pharmacy inventory)
   - Unit/size selector (e.g., "100mg Tablet" with price)
   - Quantity (numeric input with stock indicator shown below)
   - Dosage instructions (text input, e.g., "1 daily after dinner")
   - Remove row button
4. **"Add Medicine"** button to add more rows
5. **Prescription Notes** (textarea)
6. **Checkbox:** "Automatically add prescription items to the patient's billing invoice"
7. **Footer:** Cancel / Issue Prescription (submit)

---

### 5.1 — Pre-load: Fetch Medicines

| Field | Value |
|---|---|
| **Endpoint** | `GET /pharmacy/medicines?branch_id={branchId}` |
| **Function** | `getMedicines(branchId)` |

#### Response Shape

```json
[
  {
    "id": 1,
    "name": "Amoxicillin",
    "description": "Antibiotic",
    "category": "Antibiotic",
    "branch_id": 1,
    "units": [
      {
        "id": 10,
        "medicine_id": 1,
        "unit_name": "500mg Capsule",
        "price": 2.50,
        "stock_quantity": 200
      }
    ]
  }
]
```

---

### 5.2 — Pre-load: Fetch Doctors

| Field | Value |
|---|---|
| **Endpoint** | `GET /doctors` |
| **Function** | `getDoctorsList()` |

Returns list of employees with `role` field for display in combobox.

---

### 5.3 — Submit Prescription

| Field | Value |
|---|---|
| **Endpoint** | `POST /pharmacy/prescriptions` |
| **Function** | `storePrescription(prescriptionData)` |
| **Trigger** | User fills form → clicks "Issue Prescription" |

#### Request Payload

```json
{
  "patient_id": 7,
  "doctor_id": 3,
  "prescription_date": "2024-07-15",
  "notes": "Take after meals. Avoid alcohol.",
  "branch_id": 1,
  "bill_to_invoice": true,
  "items": [
    {
      "medicine_id": 1,
      "medicine_unit_id": 10,
      "dosage": "1 capsule 3 times daily",
      "quantity": 21,
      "price": 2.50
    }
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `patient_id` | `number` | ✅ | Patient ID |
| `doctor_id` | `number \| undefined` | ❌ | Prescribing doctor ID |
| `prescription_date` | `string` | ✅ | ISO date `YYYY-MM-DD` |
| `notes` | `string` | ❌ | General prescription notes |
| `branch_id` | `number` | ✅ | Branch context |
| `bill_to_invoice` | `boolean` | ❌ | Auto-bill to current pending invoice |
| `items` | `array` | ✅ | At least 1 medicine item |
| `items[].medicine_id` | `number` | ✅ | Medicine catalog ID |
| `items[].medicine_unit_id` | `number` | ✅ | Specific unit/size ID |
| `items[].dosage` | `string` | ✅ | Free-text dosage instructions |
| `items[].quantity` | `number` | ✅ | Number of units to dispense |
| `items[].price` | `number` | ✅ | Unit price (from pharmacy inventory) |

#### Response

```json
{
  "id": 88,
  "patient_id": 7,
  "patient_name": "Jane Doe",
  "doctor_id": 3,
  "doctor_name": "Dr. Smith",
  "prescription_date": "2024-07-15",
  "status": "Pending",
  "invoice_id": null,
  "notes": "Take after meals.",
  "branch_id": 1,
  "items": [
    {
      "id": 201,
      "prescription_id": 88,
      "medicine_id": 1,
      "medicine_unit_id": 10,
      "dosage": "1 capsule 3 times daily",
      "quantity": 21,
      "price": "2.50"
    }
  ]
}
```

---

### 5.4 — Get Patient Prescription History

| Field | Value |
|---|---|
| **Endpoint** | `GET /patients/{id}/prescriptions` |
| **Function** | `getPatientPrescriptions(patientId)` |

---

### 5.5 — Update Prescription Status

| Field | Value |
|---|---|
| **Endpoint** | `PATCH /pharmacy/prescriptions/{id}/status` |
| **Function** | `updatePrescriptionStatus(id, status)` |

#### Request Payload

```json
{ "status": "Dispensed" }
```

Status values: `"Pending"` → `"Dispensed"` → `"Billed"`

---

### 5.6 — Delete Prescription

| Field | Value |
|---|---|
| **Endpoint** | `DELETE /pharmacy/prescriptions/{id}` |
| **Function** | `deletePrescription(id)` |

---

#### Prescription Type (Frontend)

```typescript
type Prescription = {
  id: number;
  patient_id: number;
  patient_name: string;
  doctor_id?: number;
  doctor_name?: string;
  prescription_date: string;
  status: 'Pending' | 'Dispensed' | 'Billed';
  invoice_id?: number;
  notes?: string;
  branch_id: number;
  items: PrescriptionItem[];
};

type PrescriptionItem = {
  id?: number;
  prescription_id?: number;
  medicine_id: number;
  medicine_unit_id: number;
  dosage: string;
  quantity: number;
  price: number;
  medicine?: Medicine;
  unit?: MedicineUnit;
};
```

---

---

## 6. Documents Handling (Patient Images & Files)

> **Trigger:** "Upload Documents" button in charting header (navigates back to `/patients/{id}`)  
> **Component (upload form):** `ImageUploadForm` → `src/app/(dashboard)/patients/[id]/components/image-upload-form.tsx`  
> **Component (display):** Patient detail page → imaging gallery

### Overview

Manages patient files attached to their record: clinical photos, X-rays, and other documents. Files are uploaded as multipart form data. The gallery on the patient detail page (`/patients/{id}`) displays thumbnails with category badges and allows sharing via email/WhatsApp.

### UI Layout — Upload Dialog

1. **File input** — multi-file picker (`multiple`)
2. **Preview strip** — scrollable horizontal row of thumbnails (images) or file icons (PDFs/other)
3. **Document Category** dropdown: `Image`, `X-Ray`, `Other Doc`
4. **Description** textarea (required)
5. **Footer:** Cancel / Upload Document(s) button (shows spinner while uploading)

---

### 6.1 — Upload Document(s)

| Field | Value |
|---|---|
| **Endpoint** | `POST /patients/{id}/images` |
| **Function** | `addImageToPatient(patientId, imageFormData)` |
| **Content-Type** | `multipart/form-data` |
| **Trigger** | User selects files, fills description, chooses category → Upload |

#### Request Payload (FormData)

```
POST /patients/7/images
Content-Type: multipart/form-data

files[]        → (binary file 1)
files[]        → (binary file 2)   ← supports multi-file
description    → "Panoramic X-ray, July 2024"
category       → "X-Ray"
```

| Field | Type | Required | Description |
|---|---|---|---|
| `files[]` | `File` (binary) | ✅ | One or more files (images, PDFs, etc.) |
| `description` | `string` | ✅ | Human-readable description |
| `category` | `string` | ✅ | `Image`, `X-Ray`, or `Other Doc` |

#### Response

Returns the full updated patient object (same shape as `GET /patients/{id}`). Frontend extracts `images` array from response and updates state.

```json
{
  "id": 7,
  "first_name": "Jane",
  ...
  "images": [
    {
      "id": 15,
      "url": "https://storage.example.com/patients/7/xray-july-2024.jpg",
      "description": "Panoramic X-ray, July 2024",
      "date": "2024-07-15",
      "category": "X-Ray"
    }
  ]
}
```

---

### 6.2 — Get Patient Images

| Field | Value |
|---|---|
| **Endpoint** | `GET /patients/{id}/images` |
| **Function** | `getPatientImages(patientId, filters?)` |
| **Query Params** | `category=X-Ray`, `search=panoramic` |

#### Response

```json
{
  "data": [
    {
      "id": 15,
      "url": "https://...",
      "description": "Panoramic X-ray, July 2024",
      "date": "2024-07-15",
      "category": "X-Ray"
    }
  ]
}
```

---

### 6.3 — Send Documents (Email / WhatsApp)

| Field | Value |
|---|---|
| **Endpoint** | `POST /patients/{id}/images/send` |
| **Function** | `sendPatientDocuments(patientId, documentIds, channel, recipient, customMessage)` |

#### Request Payload

```json
{
  "document_ids": [15, 16],
  "channel": "email",
  "recipient": "patient@example.com",
  "custom_message": "Please find your X-rays attached."
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `document_ids` | `number[]` | ✅ | Array of image record IDs to send |
| `channel` | `string` | ✅ | `"email"` or `"whatsapp"` |
| `recipient` | `string` | ✅ | Email or phone number |
| `custom_message` | `string` | ❌ | Optional message to include |

#### Response

Returns `true` (boolean) on success.

---

#### PatientImage Type (Frontend)

```typescript
type PatientImage = {
  id?: string | number;
  url: string;
  description: string;
  date: string;              // "YYYY-MM-DD"
  category?: 'Image' | 'X-Ray' | 'Other Doc';
};
```

---

---

## Supplementary: Treatment Plan (Charting Tab)

> **Tab value:** `treatment`  
> **Visible within charting page as the last tab**

### UI Layout

- **Table:** Procedure | Tooth | Status | Cost | Actions
- **Status badge** rendered as `<Badge variant="outline">`
- **Actions (per row):** Edit (opens `TreatmentPlanForm`) | Delete

---

### Add Treatment (Single)

| Field | Value |
|---|---|
| **Endpoint** | `POST /patients/{id}/treatments` |
| **Function** | `addTreatment(patientId, treatmentData, condition?)` |

#### Request Payload

```json
{
  "procedure_id": 5,
  "procedure": "Composite Filling",
  "tooth": 11,
  "status": "Proposed",
  "cost": 150.00,
  "total_cost": 150.00,
  "date": "2024-07-15",
  "condition": "Caries",
  "notes": "Composite Filling"
}
```

---

### Add Treatments (Batch)

| Field | Value |
|---|---|
| **Endpoint** | `POST /patients/{id}/treatments/batch` |
| **Function** | `addTreatmentsBatch(patientId, treatments)` |

#### Request Payload

```json
{
  "total_cost": 450.00,
  "treatments": [
    {
      "procedure_id": 5,
      "procedure": "Composite Filling",
      "tooth": 11,
      "status": "Proposed",
      "cost": 150.00,
      "total_cost": 150.00,
      "date": "2024-07-15",
      "condition": "Caries",
      "notes": "Composite Filling"
    }
  ]
}
```

---

### Update Treatment

| Field | Value |
|---|---|
| **Endpoint** | `PUT /patients/{id}/treatments/{treatmentId}` |
| **Function** | `updateTreatment(patientId, treatment)` |

---

### Delete Treatment

| Field | Value |
|---|---|
| **Endpoint** | `DELETE /patients/{id}/treatments/{treatmentId}` |
| **Function** | `deleteTreatment(patientId, treatmentId)` |

---

#### Treatment Type (Frontend)

```typescript
type Treatment = {
  id: string | number;
  procedureId: string | number;
  procedure: string;
  tooth?: number;
  status: 'Proposed' | 'In Progress' | 'Completed' | 'Cancelled';
  cost: number;
  totalCost?: number;
  total_cost?: number;
  date: string;            // "YYYY-MM-DD"
  invoiceId?: string | number;
};
```

---

---

## Complete API Endpoint Reference

| Section | Method | Endpoint | Frontend Function |
|---|---|---|---|
| Patient | GET | `/patients/{id}` | `getPatientById` |
| Odontogram | GET | `/patients/{id}/odontogram-records` | `getDentalRecords` |
| Odontogram | POST | `/patients/{id}/odontogram-records` | `saveDentalRecord` |
| Odontogram | PUT | `/patients/{id}/odontogram-records/{recordId}` | `updateDentalRecord` |
| Odontogram | DELETE | `/patients/{id}/odontogram-records/{recordId}` | `deleteDentalRecord` |
| Periodontal | POST | `/patients/{id}/periodontal-records` | `savePeriodontalRecord` |
| Periodontal | POST | `/patients/{id}/periodontal/send` | `sendPeriodontalResult` |
| Orthodontic | POST | `/patients/{id}/orthodontic-records` | `saveOrthodonticRecord` |
| Orthodontic | PUT | `/patients/{id}/orthodontic-records/{recordId}` | `updateOrthodonticRecord` |
| Orthodontic | DELETE | `/patients/{id}/orthodontic-records/{recordId}` | `deleteOrthodonticRecord` |
| Endodontic | POST | `/patients/{id}/endodontic-records` | `saveEndodonticRecord` |
| Endodontic | PUT | `/patients/{id}/endodontic-records/{recordId}` | `updateEndodonticRecord` |
| Endodontic | DELETE | `/patients/{id}/endodontic-records/{recordId}` | `deleteEndodonticRecord` |
| Prescription | GET | `/pharmacy/prescriptions` | `getPrescriptions` |
| Prescription | GET | `/patients/{id}/prescriptions` | `getPatientPrescriptions` |
| Prescription | POST | `/pharmacy/prescriptions` | `storePrescription` |
| Prescription | PUT | `/pharmacy/prescriptions/{id}` | `updatePrescription` |
| Prescription | PATCH | `/pharmacy/prescriptions/{id}/status` | `updatePrescriptionStatus` |
| Prescription | DELETE | `/pharmacy/prescriptions/{id}` | `deletePrescription` |
| Medicines | GET | `/pharmacy/medicines` | `getMedicines` |
| Doctors | GET | `/doctors` | `getDoctorsList` |
| Documents | GET | `/patients/{id}/images` | `getPatientImages` |
| Documents | POST | `/patients/{id}/images` | `addImageToPatient` |
| Documents | POST | `/patients/{id}/images/send` | `sendPatientDocuments` |
| Treatment Plan | POST | `/patients/{id}/treatments` | `addTreatment` |
| Treatment Plan | POST | `/patients/{id}/treatments/batch` | `addTreatmentsBatch` |
| Treatment Plan | PUT | `/patients/{id}/treatments/{id}` | `updateTreatment` |
| Treatment Plan | DELETE | `/patients/{id}/treatments/{id}` | `deleteTreatment` |

---

*Generated from source code analysis of `CHART-DENTAL` — Next.js 14 / TypeScript frontend*  
*Source files: `src/lib/api.ts`, `src/lib/types.ts`, `src/app/(dashboard)/patients/[id]/charting/`*
