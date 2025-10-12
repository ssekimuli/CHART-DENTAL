# Odontogram Seeder Data

This document provides sample data that can be used to seed the Odontogram chart for a patient within the Dentio application. The data is structured as a JSON array of `DentalRecord` objects.

## Data Structure

Each object in the `dental_records` array of a `Patient` must conform to the following structure:

-   `tooth_id` (number): The universal numbering system ID for the tooth (1-32 for permanent teeth).
-   `condition` (string): The current state of the tooth. See allowed values below.
-   `notes` (string): Any relevant notes about the condition or tooth history.

### Allowed Conditions

The `condition` field must be one of the following values:

-   `Healthy`
-   `Caries`
-   `Filling`
-   `Crown`
-   `Missing`
-   `Fracture`

## Sample JSON Data

Below is a comprehensive sample JSON array that can be used as the value for a patient's `dental_records` field to populate a full Odontogram.

```json
[
  { "tooth_id": 1, "condition": "Missing", "notes": "Impacted and surgically removed in 2018." },
  { "tooth_id": 2, "condition": "Crown", "notes": "Porcelain crown placed due to large fracture." },
  { "tooth_id": 3, "condition": "Filling", "notes": "MOD composite filling." },
  { "tooth_id": 4, "condition": "Healthy", "notes": "" },
  { "tooth_id": 5, "condition": "Healthy", "notes": "" },
  { "tooth_id": 6, "condition": "Caries", "notes": "Small occlusal caries detected." },
  { "tooth_id": 7, "condition": "Healthy", "notes": "" },
  { "tooth_id": 8, "condition": "Healthy", "notes": "" },
  { "tooth_id": 9, "condition": "Healthy", "notes": "" },
  { "tooth_id": 10, "condition": "Filling", "notes": "Small facial composite." },
  { "tooth_id": 11, "condition": "Healthy", "notes": "" },
  { "tooth_id": 12, "condition": "Healthy", "notes": "" },
  { "tooth_id": 13, "condition": "Healthy", "notes": "" },
  { "tooth_id": 14, "condition": "Filling", "notes": "Large amalgam filling." },
  { "tooth_id": 15, "condition": "Crown", "notes": "Gold crown, patient reports it was done 20+ years ago." },
  { "tooth_id": 16, "condition": "Missing", "notes": "Prophylactically removed." },
  { "tooth_id": 17, "condition": "Missing", "notes": "Prophylactically removed." },
  { "tooth_id": 18, "condition": "Filling", "notes": "Occlusal amalgam." },
  { "tooth_id": 19, "condition": "Crown", "notes": "Root canal treated with PFM crown." },
  { "tooth_id": 20, "condition": "Caries", "notes": "Recurrent caries at crown margin." },
  { "tooth_id": 21, "condition": "Healthy", "notes": "" },
  { "tooth_id": 22, "condition": "Healthy", "notes": "" },
  { "tooth_id": 23, "condition": "Healthy", "notes": "" },
  { "tooth_id": 24, "condition": "Healthy", "notes": "" },
  { "tooth_id": 25, "condition": "Fracture", "notes": "Chipped incisal edge." },
  { "tooth_id": 26, "condition": "Healthy", "notes": "" },
  { "tooth_id": 27, "condition": "Healthy", "notes": "" },
  { "tooth_id": 28, "condition": "Filling", "notes": "Buccal pit composite." },
  { "tooth_id": 29, "condition": "Filling", "notes": "MOD amalgam." },
  { "tooth_id": 30, "condition": "Caries", "notes": "Deep occlusal caries, requires RCT evaluation." },
  { "tooth_id": 31, "condition": "Filling", "notes": "DO composite." },
  { "tooth_id": 32, "condition": "Missing", "notes": "Impacted and surgically removed in 2018." }
]
```
