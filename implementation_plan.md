# Institute Security Management System

A comprehensive institute gate security system that manages visitor flows across 13 gates, generates QR-based passes, tracks entry/exit events, controls access to special rooms/labs, and provides a full movement audit trail.

---

## Proposed Architecture

A **single-page application (SPA)** built with Vanilla HTML + CSS + JavaScript using `localStorage` for persistence (no backend required for this prototype). QR codes are generated client-side using the `qrcode.js` library and scanned using `html5-qrcode`.

---

## App Modules / Pages

### 1. 🏠 Dashboard
- Live gate status (13 gates) — active visitors, current occupancy
- Real-time movement feed (last 20 events)
- Stats cards: Total active passes, entries today, exits today

### 2. 🪪 Pass Generation
- Form to issue a new pass
- Fields: Name, Photo (optional), ID Number, Contact, Organization/Class, Purpose, Pass Type, Allowed Gates, Special Room Access
- Pass Types:
  - 👑 **Chief Guest Pass** (Gold) — full access, VIP
  - 🧑‍🤝‍🧑 **Visitor Pass** (Blue) — restricted gates, limited rooms
  - 🎓 **Student Entry Pass** (Green) — specific gates, hostel/labs
  - 👷 **Labourer Pass** (Orange) — service entrances only
- Generates a styled, printable QR pass card
- QR contains encoded JSON: `{passId, name, type, allowedGates, allowedRooms, issuedAt, expiresAt}`

### 3. 📱 Gate Scanner
- Select active gate (Gate 1–13)
- Scan QR code using device camera
- System checks: valid pass? allowed at this gate? expired?
- If entry: logs entry time, marks pass as "inside"
- If exit (already checked in): logs exit time, calculates duration
- Visual feedback: ✅ Green (allowed) / ❌ Red (denied)

### 4. 🔑 Room/Lab Access Control
- List of special rooms/labs (e.g., Server Room, Chemistry Lab, Library, Auditorium)
- Scan pass at room entry
- System validates if pass has room permission
- Logs room entry/exit with timestamp

### 5. 📍 Movement Tracker
- Timeline view per person: all gate + room events
- Filter by: Pass ID, Name, Date, Pass Type, Gate
- Export movement log as CSV

### 6. 📋 Pass Management
- Table of all issued passes
- Status: Active / Expired / Inside / Outside
- Revoke / extend pass
- Search/filter by type, name, gate

### 7. ⚙️ Admin Settings
- Configure gate names
- Configure room/lab list
- Set pass validity duration per type
- Audit log of admin actions

---

## Data Models

```json
Pass: {
  id, name, photo, idNumber, contact, org, purpose,
  type: "chief_guest" | "visitor" | "student" | "labourer",
  allowedGates: [1-13],
  allowedRooms: ["Lab1", "ServerRoom", ...],
  issuedAt, expiresAt, issuedBy,
  status: "active" | "revoked" | "expired"
}

Event: {
  id, passId, passengerName, passType,
  gate: 1-13 | null,
  room: string | null,
  type: "gate_entry" | "gate_exit" | "room_entry" | "room_exit" | "denied",
  timestamp, duration (on exit)
}
```

---

## UI Design

- **Dark theme** with gate-status color coding
- **Color palette**: Deep navy `#0a0f1e` bg, accent `#00d4ff` (cyan), pass-type colors
- **Card-based layout** with glassmorphism panels
- **Animated gate grid** on dashboard showing live occupancy
- **Printable pass cards** styled per pass type

---

## Tech Stack

| Concern | Library |
|---------|---------|
| QR Generation | `qrcode.min.js` (CDN) |
| QR Scanning | `html5-qrcode` (CDN) |
| Charts (Dashboard) | `Chart.js` (CDN) |
| Icons | Font Awesome (CDN) |
| Fonts | Google Fonts — Inter + Rajdhani |
| Storage | `localStorage` |

---

## File Structure

```
d:\VJTI WORK\secuirity app\
├── index.html          # Main SPA shell
├── style.css           # Full design system
├── app.js              # Core application logic
├── modules/
│   ├── passes.js       # Pass generation & management
│   ├── scanner.js      # Gate & room scanner
│   ├── tracker.js      # Movement tracking
│   ├── dashboard.js    # Dashboard rendering
│   └── data.js         # LocalStorage data layer
└── assets/
    └── logo.png        # (generated)
```

---

## Verification Plan

- Generate passes of each type and verify QR encodes correctly
- Scan QR at gate — verify entry/exit toggle logic
- Deny test: scan a pass at a non-permitted gate → expect red denial
- Room access: grant/deny room access based on pass config
- Movement tracker: verify all events appear in timeline
- Check printable pass card renders correctly
