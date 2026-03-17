# NEU Library Visitor App

The **NEU Library Visitor App** is a web-based system designed to digitally record and manage the entry of **students, faculty members, and employees** visiting the New Era University Library.

The application provides a **simple, responsive interface** that works on both **desktop and mobile devices**, allowing users to quickly log their library visits using their institutional email accounts.

**Live Application:**  
https://neu-library-visitor-app.vercel.app/?v=2

---

## Project Overview

This system aims to modernize the traditional visitor logbook used in the library by replacing it with a **digital logging platform**. The application records visitor information, their purpose for visiting, and provides administrators with tools to monitor library usage.

---

## User Features

### Institutional Email Authentication
Users sign in using their **New Era University institutional email (Google-based email)** to ensure that only legitimate university members can access the system.

### First-Time Visit Registration
If a user is visiting the library for the **first time**, they must specify the **college or office** they belong to.

After this initial registration, the system remembers the user's affiliation, so it **will not be required in future visits**.

### Library Visit Logging
After successful authentication, users select their **reason for visiting the library**, such as:

- Reading
- Research
- Studying
- Using computers
- Other academic purposes

The visit information is then recorded in the database.

### Greeting Message
After successful validation of credentials and visit purpose, the system displays the message:

> **Welcome to NEU Library!**

---

## Admin Features

Administrators have access to a **dashboard interface** that allows them to monitor library activity and manage visitors.

### Visitor Statistics Dashboard
The admin dashboard displays statistics in **card-based components**, including:

- Total visitors for the **current day**
- Visitor summaries **weekly**
- Visitor summaries **monthly**
- **Custom date range filtering**

### Search Visitor Logs
Admins can search for a **specific user** to view their visit records.

### Block Visitors
Administrators have the authority to **block users**, preventing them from entering the library if necessary.

---

## User Roles

### User
Includes:
- Students
- Faculty members
- University employees

Users can:
- Log in using institutional email
- Record their visit reason
- Automatically log visits for future entries

### Admin
Admins can:
- View visitor statistics
- Search visitor logs
- Filter reports by time period
- Block users from accessing the system

---

## Responsive Design

The application is designed with a **responsive user interface**, allowing it to work seamlessly across:

- Desktop computers
- Tablets
- Mobile phones

This ensures accessibility and convenience for both visitors and administrators.

---

## Data Recorded

Each visit entry includes the following information:

- User Email
- User Name
- College / Office
- Date and Time of Visit
- Reason for Visit
- Account Status (Active / Blocked)

---

## Purpose of the System

The NEU Library Visitor App aims to:

- Digitize library visitor records
- Improve tracking and monitoring of library usage
- Provide administrators with useful statistics
- Streamline the visitor logging process

---

## Future Improvements

Possible future enhancements for the system include:

- QR code check-in for faster entry
- Real-time library occupancy monitoring
- Integration with university ID systems
- Advanced analytics for library usage

---

## Live Demo

Try the application here: https://neu-library-visitor-app.vercel.app/?v=2
