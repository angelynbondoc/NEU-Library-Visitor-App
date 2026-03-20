# NEU Library Visitor App

**Modern, responsive digital visitor logging system for New Era University Library**

Secure check-in using **NEU institutional Google accounts** (@neu.edu.ph).  

**Live Application**  
https://neu-library-visitor-app.vercel.app/?v=2

---

## System Overview

The **NEU Library Visitor App** aims to replaces the traditional paper-based visitor logbook with a clean, digital platform.  
It allows students, faculty members, and employees to quickly log their library visits while giving library staff real-time usage insights and visitor management tools.

Main goals:
- Digitize visitor records
- Improve tracking and monitoring of library usage
- Provide useful statistics for library administrators
- Streamline the check-in process

---

## Key Features

### Authentication & First-time Registration
- Sign in with **NEU Google institutional email** (@neu.edu.ph)
- **First-time users** choose their role and affiliation:
  - **Student** → select College + Program (dependent dropdowns)
  - **Faculty / Employee** → choose type (Faculty Member / Employee)  
    → Admins are marked manually via `isAdmin: true` in Firestore
- Returning users skip setup

### Visit Logging
- **Students**: select reason for visit  
  (Reading, Research, Studying, Using computers, Other…)
- **Faculty / Employees / Admins**: no reason required → instant welcome
- After logging → greeting message:  
  **“Welcome to NEU Library!”**

### Dashboards & Statistics

**Admin Dashboard** (full access)
- Real-time **Today's Visitors** cards  
  (total count + breakdown by top 3 colleges)
- Searchable visit history table (filter by name or email)
- Date filters:  
  • Today  
  • Last 7 days  
  • This Month  
  • Custom date range
- **User Management** section  
  → List all registered users  
  → Block / Unblock toggle (real-time enforcement)
- Export statistics as PDF

**Employee / Faculty Dashboard** (read-only)
- Same statistics cards, history table and date filters
- **No** user blocking or management features
- Export statistics as PDF

### Security
- Google Sign-In restricted to @neu.edu.ph domain
- Real-time Firestore listener prevents blocked users from logging visits
- Role-based access control (`role` + `isAdmin` fields)

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
    L --> M[Admin? → Full Dashboard with Block & Export]
    L --> N[Employee → Read-only Stats + Export]
