# 🎓 College Event Hub

> **Discover. Register. Participate. Validate.**
> A modern, production-grade cloud-native college event management web platform powered by **Node.js, Express.js, MongoDB Atlas Cloud Database, Cloudinary, Nodemailer, PDFKit, and QRCode**.

---

## 📋 Table of Contents
1. [Project Overview](#1-project-overview)
2. [Problem Statement & Objectives](#2-problem-statement--objectives)
3. [Key Features](#3-key-features)
4. [User Roles](#4-user-roles)
5. [Technology Stack](#5-technology-stack)
6. [System Architecture](#6-system-architecture)
7. [Database Design & Mongoose Schemas](#7-database-design--mongoose-schemas)
8. [MongoDB Atlas Cloud Database Setup](#8-mongodb-atlas-cloud-database-setup)
9. [Environment Variables](#9-environment-variables)
10. [Local Installation & Running Guide](#10-local-installation--running-guide)
11. [Demo Credentials](#11-demo-credentials)
12. [REST API Documentation](#12-rest-api-documentation)
13. [Cloud Computing Demonstration & Concepts](#13-cloud-computing-demonstration--concepts)
14. [Security Implementation](#14-security-implementation)
15. [Testing Suite](#15-testing-suite)
16. [College Viva Examination Q&A Guide](#16-college-viva-examination-qa-guide)

---

## 1. Project Overview

**College Event Hub** is a centralized cloud-based web application designed to eliminate paper posters, scattered social media messages, and manual attendance tracking for college campus events. It enables students to discover events, register with real-time seat limits, receive digital QR event passes, submit feedback, download PDF participation certificates, and accumulate participation points on a live campus leaderboard.

Organizers and Administrators manage event creation, poster image uploads to **Cloudinary**, pending approvals, participant rosters, attendance validation via QR scanning, and interactive analytics powered by **Chart.js**.

---

## 2. Problem Statement & Objectives

### Problem Statement
College campuses struggle with decentralized event announcements, manual paper attendance sign-ins, lost participation certificates, and lack of real-time attendance analytics for faculty and organizers.

### Objectives
1. Provide a single, centralized discovery portal for all technical, cultural, sports, and workshop events.
2. Automate registration with strict capacity restrictions and duplicate prevention.
3. Generate secure digital QR passes for instant check-in at event venues.
4. Issue automated PDF participation certificates to verified attendees.
5. Demonstrate **Cloud Computing concepts** using **MongoDB Atlas Cloud Database** and cloud hosting.

---

## 3. Key Features

- **Event Discovery & Live Search**: Instant search by title, organizer, category, or venue.
- **Category & Custom Filtering**: Filter by Technical, Cultural, Sports, Workshops, Seminars, Hackathons.
- **Real-Time Capacity Restriction**: Enforces seat limits and prevents overbooking.
- **Digital QR Passes**: Generates a high-density QR code per registration for instant scanning.
- **QR Attendance Verification**: Organizers scan student QR passes to record present attendance.
- **PDF Certificate Generation**: Generates downloadable PDF certificates for attended events.
- **Cloud Image Uploads**: Cloudinary integration for event posters.
- **Email Notifications**: Automated registration confirmation and cancellation emails via Nodemailer.
- **Participation Points & Leaderboard**: Gamification awarding points for registrations, attendance, and workshops.
- **Analytics Dashboard**: Visual charts for category breakdown, signup trends, and attendance percentages.

---

## 4. User Roles

### 🧑‍🎓 Student
- Browse, search, filter events.
- 1-Click event registration and cancellation.
- View registered events and digital QR event passes.
- Save events to Favorites.
- Provide 1–5 star ratings and comments.
- Download PDF certificates upon verified event attendance.
- View participation points and rank on campus leaderboard.

### 👔 Organizer / Club Lead
- Create and submit new events with poster image uploads.
- Manage club events and view participant rosters.
- Scan QR passes to mark live attendance.
- View turnout analytics and student feedback.

### 🛡️ Admin / Faculty Coordinator
- Approve or reject pending event submissions with rationale.
- Suspend/unsuspend user accounts.
- View total users, events, registrations, and attendance metrics.
- Export attendee rosters as downloadable CSV files.

---

## 5. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript ES6+, Chart.js, QRCode | Zero-framework, responsive client application |
| **Backend** | Node.js v20+, Express.js | REST APIs, authentication, static serving |
| **Database** | MongoDB Atlas Cloud, Mongoose ODM | Managed cloud document storage and schemas |
| **Cloud Storage** | Cloudinary | Event poster image storage |
| **Email** | Nodemailer | Transactional email notifications |
| **PDF Generation**| PDFKit | Dynamic certificate generation |
| **Hosting** | Render.com / Google App Engine | PaaS Cloud Hosting |

---

## 6. System Architecture

```text
                STUDENTS / ORGANIZERS / ADMINS
                               |
                               v
                     HTML5 + CSS3 + JavaScript
                               |
                               v (REST APIs / JSON)
                        Node.js + Express.js
                               |
          +--------------------+--------------------+
          |                    |                    |
          v                    v                    v
    MongoDB Atlas         Cloudinary           Nodemailer
   (Cloud Database)    (Poster Images)      (Email Alerts)
```

---

## 7. Database Design & Mongoose Schemas

The application uses 13 MongoDB collections:
- `users`: Accounts, roles, hashed passwords, participation points, suspension flag.
- `events`: Titles, descriptions, dates, capacity, approval status, Cloudinary image URLs.
- `registrations`: Student and event references, attendance status.
- `attendance`: Verified check-in records with timestamps and staff ID.
- `feedback`: Student event ratings (1-5) and feedback comments.
- `notifications`: In-app system alerts.
- `favorites`: Bookmarked student events.
- `certificates`: Issued certificate logs.
- `clubs`: Campus clubs data.
- `venues`: Campus hall capacities.
- `categories`: Event category definitions.
- `participationPoints`: Points transaction logs.
- `auditLogs`: Administrative security action logs.

---

## 8. MongoDB Atlas Cloud Database Setup

1. Create a free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Create an **M0 Free Tier Cluster**.
3. Under **Database Access**, create a user (e.g. `admin_user`).
4. Under **Network Access**, add IP `0.0.0.0/0` (Allow access from anywhere).
5. Copy your connection string and add it to `.env`:
```env
MONGODB_URI=mongodb+srv://admin_user:YourPassword@cluster0.mongodb.net/college_event_hub
```

---

## 9. Environment Variables

Create `.env` in the root folder:

```env
PORT=8080
NODE_ENV=development

MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/college_event_hub
SESSION_SECRET=college_event_hub_secret_key_2026

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

---

## 10. Local Installation & Running Guide

### Step 1: Clone & Install Dependencies
```bash
npm install
```

### Step 2: Seed Database
```bash
npm run seed
```

### Step 3: Run Development Server
```bash
npm start
```
App will run at `http://localhost:8080`.

### Step 4: Run Automated Tests
```bash
npm test
```

---

## 11. Demo Credentials

- **Admin**: `admin@college.edu` / `AdminPassword2026!`
- **Organizer**: `organizer@college.edu` / `OrganizerPassword2026!`
- **Student**: `student@college.edu` / `StudentPassword2026!`

---

## 12. REST API Documentation

### Auth APIs
- `POST /api/auth/register` - Register student
- `POST /api/auth/login` - Authenticate user
- `GET /api/auth/me` - Fetch profile
- `POST /api/auth/logout` - Logout session

### Event APIs
- `GET /api/events` - Fetch events
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Attendance & QR APIs
- `GET /api/registrations/:id/qr` - Generate ticket QR code
- `POST /api/attendance/scan` - Mark attendance via QR ticket scan

### Admin APIs
- `GET /api/admin/stats` - System overview metrics
- `PUT /api/admin/events/:id/approve` - Approve event
- `GET /api/admin/analytics` - Category & signup aggregation analytics

---

## 13. Cloud Computing Demonstration & Concepts

### 1. Database as a Service (DBaaS)
The app uses **MongoDB Atlas**, eliminating local database maintenance and allowing cloud instances to read/write centralized data safely.

### 2. High Availability & Remote Access
Data is hosted across cloud data centers, allowing simultaneous access from web browsers, mobile devices, and servers globally.

### 3. Elasticity & PaaS Deployment
Deploying to Render or Google App Engine standard environment automatically scales compute instances based on HTTP request volume.

---

## 14. Security Implementation

- **bcryptjs**: Password salt rounds = 10.
- **Generic Login Errors**: Prevents username enumeration.
- **Strict Role Enforcement**: Public registration forces `role: student`.
- **Session Security**: HTTP-only cookies prevent XSS theft.
- **Input Sanitization**: Mongoose validation schema constraints.

---

## 15. Testing Suite

Run all automated unit and integration tests:
```bash
npm test
```
Verifies static serving, 404 routing, DB disconnection fallbacks, session authorization, password hashing, and capacity restrictions.

---

## 16. College Viva Examination Q&A Guide

### Q1: Why did you use MongoDB Atlas instead of MySQL/PostgreSQL?
> **Answer**: MongoDB Atlas provides a managed cloud NoSQL database that easily handles dynamic event attributes (custom rules, requirements, Cloudinary image links) and allows multi-instance PaaS deployments without managing local database hardware.

### Q2: How does the QR Code attendance system work?
> **Answer**: Each registration generates a unique QR code DataURL containing the Registration ObjectId. When an organizer scans or enters the code, the backend verifies registration existence, checks student enrollment, marks attendance, and prevents duplicate check-ins.

### Q3: How are certificates issued?
> **Answer**: PDFKit dynamically generates an official PDF certificate stream containing the student's name, event title, date, and unique certificate ID only after verified event attendance.

---
**College Event Hub** — Built for Cloud Computing project presentation & viva.
