# Dentio Desktop Version: Module Specifications & Desktop-Specific Features

This document outlines the recommended desktop-specific enhancements for the **Dentio** Dental Practice Management System. Developing a native desktop version (using Electron or Tauri) enables direct hardware integrations, offline-first reliability, and enhanced security that are difficult or impossible to achieve in a web browser.

---

## 🖥️ System Architecture & Native Advantages

By transitioning to a desktop app, the system gains access to:
1. **Low-latency hardware access** (TWAIN/WIA scanners, USB/Serial devices, RFID reader).
2. **Offline-first local cache** (SQLite/RxDB local database syncing to the cloud).
3. **Advanced security** (Operating system-level session locking, kiosk mode).
4. **Enhanced windowing** (Multi-monitor setups for operatory clinical charting).

---

## 📦 Module-by-Module Specifications

### 1. 📊 Dashboard
* **System Tray Mode:** Minimize the application to the OS system tray. It runs in the background and flashes or pops up alerts for urgent tasks.
* **Real-Time Operatory Counters:** Instant widget updates tracking total checked-in patients, wait times, and active practitioner locations.

### 2. 👥 Queue
* **Patient-Facing Kiosk/TV Mode:** Launch a simplified, clean view on a secondary display (e.g., waiting room TV) showing queue tickets.
* **Instant Staff Alerts:** Desktop notification banners whenever a patient's room assignment changes.

### 3. 👤 Patients
* **Card Scanner Integration:** Insert national identity, RFID, or insurance cards into connected scanners to automatically parse and populate patient demographic data.
* **Direct Webcam Capture:** Capture high-quality profile photos directly via the system webcam without browser-related confirmation prompts.

### 4. 🦷 Charting
* **RVG & X-Ray Integration:** Direct image capture from dental intraoral cameras and RVG digital sensors via native drivers (TWAIN/WIA), attaching files instantly to the tooth record.
* **Hardware-Accelerated 3D Viewing:** Smooth rendering of heavy 3D digital impressions (STL, OBJ files for crown and implant planning).
* **Offline Dental History:** Locally cached dental charts so dentists can view past treatments and tooth statuses during network dropouts.

### 5. 📅 Appointments
* **Instant Schedule Caching:** Fast loading and seamless drag-and-drop actions on calendars, even with high concurrent scheduling.
* **System Notification Reminders:** Pop-up alerts for approaching appointments and doctor changes.

### 6. 💳 Billing
* **Card Terminal Integration:** Push billing totals directly to USB- or LAN-connected payment terminals.
* **Cash Drawer Control:** Send a signal to open physical cash drawers automatically when cash payments are finalized.

### 7. 💊 Pharmacy
* **Direct Label Printing:** Send instructions directly to thermal label printers (e.g., Dymo/Brother) for medicine containers without browser print previews.
* **Barcode Scan Checkout:** Scan medicine barcode labels to auto-fill inventory items, check expirations, and dispense products.

### 8. 🪙 Accounting
* **Desktop Exports:** Direct local exports to formats like Excel or local accounting system integrations (e.g., QuickBooks Desktop).

### 9. 📦 Inventory
* **Material Batch Scanning:** Use standard barcode scanners to scan incoming stock (composites, gloves, tools) and verify batch numbers.

### 10. 🧪 Laboratory
* **Digital Scan Uploader:** Reliable, multi-threaded upload of large files (e.g., STL teeth scans) to external dental laboratories.

### 11. 👥 HRM (Human Resource Management)
* **Biometric/NFC Clock-In:** Staff tap NFC cards or scan fingerprints on a desktop peripheral to clock in/out for payroll tracking.

### 12. 🏢 Branches & Settings
* **Branch Profiles:** Store local system configurations (e.g., connected printer profiles, camera paths, local cache settings) per device/branch.
* **Local Backups:** Automatically save backup copies of the local database to a network-attached storage (NAS) or external drive daily.
