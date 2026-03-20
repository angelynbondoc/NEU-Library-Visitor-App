# NEU Library Visitor App

**Modern, responsive visitor logging system for New Era University (NEU) Library**  
Secure check-in using **NEU institutional Google accounts** (@neu.edu.ph). Built with React, Firebase Authentication + Firestore, and Tailwind CSS. Mobile-friendly UI.

**Live Demo:** https://neu-library-visitor-app.vercel.app

---

## Features

### User Types & Flows
- **Students**  
  - One-time profile setup: Choose **College → Program** (dependent dropdowns)  
  - Every visit: Select reason (`Reading`, `Research`, `Computer Use`, `Studying`, etc.)  
  - Shows: “Welcome to NEU Library!”

- **Faculty / Employees**  
  - One-time choice: **Faculty Member** or **Employee**  
  - No reason required → instant welcome → dashboard

- **Admins** (subset of Faculty/Employees with `isAdmin: true`)  
  - Full control: view stats, search logs, block users

### Dashboards
**Admin Dashboard**  
- Real-time **Today's Visitors** cards (total count + top 3 colleges breakdown)
- Export the stats as PDF 
- Searchable visit history table (filter by name/email)  
- Date filters: Today · Last 7 days · This Month · Custom range  
- **User Management**: list all users + Block / Unblock toggle (real-time enforcement)

**Employee Dashboard** (non-admin faculty/employees)  
- Same stats cards, history table, and date filters  
- **Read-only** — no blocking or user management
- Export the stats as PDF

### Security & Real-time
- Google Sign-In restricted to @neu.edu.ph domain  
- Firestore real-time listeners → blocked users can't log visits  
- Role-based access (`role` + `isAdmin` fields)

---

## 📋 User Journey

```mermaid
graph TD
    A[Visit neu-library-visitor-app.vercel.app] --> B[Sign in with NEU Google Account]
    B --> C{First time?}
    C -->|Yes| D[Choose Role]
    D --> E[Student → College + Program]
    D --> F[Faculty Member → Admin? / Employee]
    C -->|No| G[Load Role from Firestore]
    G --> H{Blocked?}
    H -->|Yes| I["Sorry, access denied"]
    H -->|No| J{Is Student?}
    J -->|Yes| K[Select Reason → Log Visit → Welcome]
    J -->|No| L[Welcome → Dashboard]
    L --> M[Admin? → Full Dashboard with Block]
    L --> N[Employee → Read-only Stats]
