# 🎓 College Event Hub

> **Discover. Register. Participate.**
> A modern, cloud-native college event management web application engineered for **Google App Engine** and **MongoDB Atlas**.

---

## 📋 Table of Contents
1. [Project Overview](#1-project-overview)
2. [Key Features](#2-key-features)
3. [Technology Stack](#3-technology-stack)
4. [System Architecture](#4-system-architecture)
5. [Folder Structure](#5-folder-structure)
6. [Cloud Computing Architecture & Explanation](#6-cloud-computing-architecture--explanation)
7. [MongoDB Atlas Setup Guide](#7-mongodb-atlas-setup-guide)
8. [Environment Variables](#8-environment-variables)
9. [Local Development & Testing Instructions](#9-local-development--testing-instructions)
10. [How the Frontend Communicates with the Backend](#10-how-the-frontend-communicates-with-the-backend)
11. [How MongoDB is Used](#11-how-mongodb-is-used)
12. [How Google App Engine is Used](#12-how-google-app-engine-is-used)
13. [Google Cloud App Engine Deployment Steps](#13-google-cloud-app-engine-deployment-steps)
14. [Admin Account Seeding](#14-admin-account-seeding)
15. [Common Errors and Troubleshooting](#15-common-errors-and-troubleshooting)
16. [College Viva Examination Q&A Guide](#16-college-viva-examination-qa-guide)

---

## 1. Project Overview

**College Event Hub** is a centralized web platform designed to eliminate disjointed flyers, scattered WhatsApp messages, and manual paper rosters for college campus events. It enables students to easily discover upcoming hackathons, cultural festivals, sports tournaments, technical workshops, and seminars, and register with real-time capacity validation. Administrators have a dedicated dashboard to publish events, adjust limits, and inspect live attendee rosters.

The project is built as a single, lightweight Node.js/Express application that simultaneously serves modern, responsive frontend pages and provides robust RESTful APIs, designed for deployment to Google App Engine Standard Environment (Node.js 24).

---

## 2. Key Features

### 🧑‍🎓 Student Features
- **Account Registration & Login**: Secure sign-up and session-based login with hashed passwords.
- **Event Discovery & Live Search**: Instant search by title, venue, or organizing department.
- **Category Filtering**: Quickly filter events into Technical, Cultural, Sports, Workshops, and Seminars.
- **Real-Time Capacity Check**: Displays available seats (e.g., `18 spots left`) or `Full` status badge.
- **One-Click Registration**: Secure an event seat with automatic duplicate registration prevention.
- **Personalized Student Dashboard**: View all enrolled events, schedules, and event locations.
- **Registration Cancellation**: Cancel an enrollment at any time, instantly releasing the seat to other students.
- **Feedback & Notifications**: User-friendly alerts for every action.

### 🛡️ Admin Features
- **Protected Administrator Console**: Strictly gated by role-based session authorization (`admin`).
- **Real-Time Analytics Metrics**:
  - Total Events
  - Upcoming Events (computed dynamically)
  - Total Event Registrations
  - Total Enrolled Students
- **Event Lifecycle Management**:
  - **Create**: Publish new events with custom date, time, venue, category, capacity, and banner image.
  - **Edit**: Update event logistics or descriptions.
  - **Delete**: Remove cancelled events with automatic cascading removal of attendee registrations.
- **Live Attendee Rosters**: Click "Attendees" on any event to inspect student names, college emails, and registration timestamps.

---

## 3. Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Runtime** | Node.js | `24.x` | Modern server-side JavaScript runtime |
| **Backend Framework** | Express.js | `4.21.x` | Fast, unopinionated web framework for APIs and static serving |
| **Database** | MongoDB Atlas | Cloud M0/Serverless | Managed cloud NoSQL document database |
| **ODM** | Mongoose | `8.8.x` | Schema validation, type casting, and query builder |
| **Authentication** | bcryptjs & express-session | `2.4.x` / `1.18.x` | Salted password hashing (10 rounds) and HTTP-only cookie sessions |
| **Frontend** | HTML5, CSS3, Vanilla JS | Modern ES6+ | Lightweight, responsive, zero-build client application |
| **Cloud Hosting** | Google App Engine | Standard (F1) | Fully managed platform-as-a-service (PaaS) with auto-scaling |

---

## 4. System Architecture

```mermaid
flowchart TD
    User([Student / Admin Browser]) <-->|HTTPS Requests / Cookies| GAE[Google App Engine Standard]
    
    subgraph GAE_App [Node.js 24 Express Application]
        Static[Static File Server\npublic/*.html, css, js]
        AuthMid[Auth & DB Middleware]
        APIs[REST API Endpoints\n/api/auth, /api/events,\n/api/registrations, /api/admin]
        SessionStore[Express Session Store]
    end

    GAE <--> Static
    GAE <--> AuthMid
    AuthMid <--> APIs
    AuthMid <--> SessionStore

    APIs <-->|Mongoose ODM / TLS| Atlas[(MongoDB Atlas Cloud Cluster\nUsers, Events, Registrations)]
```

---

## 5. Folder Structure

```
collegeeventhub/
│
├── public/                       # Frontend static files served by Express
│   ├── index.html                # Landing page with hero banner & upcoming events
│   ├── login.html                # Unified login portal (Student & Admin)
│   ├── register.html             # Student account registration page
│   ├── events.html               # Event catalog with search and category filters
│   ├── event-details.html        # Detailed event view with one-click registration
│   ├── student-dashboard.html    # Enrolled events & ticket management
│   ├── admin-dashboard.html      # Metrics cards, event table & attendee roster modal
│   ├── create-event.html         # Form for creating and editing events
│   ├── css/
│   │   └── style.css             # Unified modern responsive design system
│   └── js/
│       ├── auth.js               # Client session state, dynamic navbar, login/register
│       ├── events.js             # Event discovery, filtering, and registration actions
│       ├── student.js            # Student dashboard data fetching and cancellation
│       └── admin.js              # Admin statistics, event CRUD, and attendee rosters
│
├── models/                       # Mongoose database schemas
│   ├── User.js                   # Name, email, hashed password, role, createdAt
│   ├── Event.js                  # Title, description, date, venue, capacity, etc.
│   └── Registration.js           # Student ref, Event ref, unique compound index
│
├── routes/                       # Express REST API routes
│   ├── authRoutes.js             # /api/auth (register, login, logout, me)
│   ├── eventRoutes.js            # /api/events (CRUD, search, capacity aggregation)
│   ├── registrationRoutes.js     # /api/registrations (register, my registrations, cancel)
│   └── adminRoutes.js            # /api/admin (stats, event attendees roster)
│
├── middleware/
│   └── authMiddleware.js         # Session validation (isAuthenticated, isAdmin, isStudent, requireDB)
│
├── config/
│   └── database.js               # Mongoose connection logic with resilient error handling
│
├── seedAdmin.js                  # Safe script to create or update administrator account
├── server.js                     # Main application entry point
├── app.yaml                      # Google App Engine deployment configuration
├── .gcloudignore                 # Rules for files excluded from App Engine uploads
├── .env.example                  # Template of required environment variables
├── .gitignore                    # Git ignore file for secrets and dependencies
├── package.json                  # Project manifest and npm scripts
└── README.md                     # Comprehensive project documentation
```

---

## 6. Cloud Computing Architecture & Explanation

For your college evaluation and viva, it is essential to understand how each component operates within a cloud computing model:

```
[Development Environment]
Google Cloud Shell Editor / Local VS Code
           │
           │  (Source Code via gcloud app deploy)
           ▼
[Hosting Environment]
Google App Engine (PaaS - Platform as a Service)
- Runs Node.js 24 runtime
- Binds to process.env.PORT (8080)
- Auto-scales instances based on incoming web traffic
- Handles HTTPS termination and routing
           │
           │  (Database Connection via TLS)
           ▼
[Database Storage]
MongoDB Atlas (DBaaS - Database as a Service)
- Managed cloud replica set
- Automatic backups and high availability
- Replaces local database installations
```

- **Development**: The source code can be developed locally or maintained directly in a cloud development environment such as **Google Cloud Shell Editor**.
- **Database**: **MongoDB Atlas** provides managed, cloud-hosted NoSQL database storage accessible over an encrypted TLS connection.
- **Hosting**: **Google App Engine** hosts the web application code, automatically provisioning server instances, monitoring health, and serving traffic.
- **Deployment**: The application is deployed directly to App Engine using `gcloud app deploy` and becomes accessible worldwide through a secure Google Cloud public URL (e.g. `https://<PROJECT-ID>.uc.r.appspot.com`).

*(Note: Antigravity is your AI pair programming assistant and development agent; Google App Engine and MongoDB Atlas provide the actual cloud infrastructure.)*

---

## 7. MongoDB Atlas Setup Guide

Follow these quick steps to get a free cloud database cluster:

1. **Create an Account**: Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and register for a free account.
2. **Create a Free Cluster**:
   - Choose **M0 Free Tier** (Shared).
   - Select your preferred cloud provider (Google Cloud or AWS) and closest region.
   - Click **Create Deployment**.
3. **Configure Database User**:
   - Under **Database Access**, click **Add New Database User**.
   - Select **Password Authentication**.
   - Enter a username (e.g. `eventhub_admin`) and a secure password.
   - Assign the user role: **Read and write to any database**.
   - Click **Add User**.
4. **Configure Network Access (Crucial for App Engine)**:
   - Under **Network Access**, click **Add IP Address**.
   - Click **Allow Access From Anywhere** (`0.0.0.0/0`).
   - *Why is this necessary?* Google App Engine uses dynamic outgoing IP addresses; allowing `0.0.0.0/0` ensures the deployed application can always connect to your database.
5. **Get Connection String**:
   - Click **Databases** -> **Connect** -> **Drivers** (Node.js).
   - Copy the connection string. It will look like:
     ```
     mongodb+srv://eventhub_admin:<password>@cluster0.abcde.mongodb.net/college_events?retryWrites=true&w=majority
     ```
   - Replace `<password>` with the password you created in step 3.

---

## 8. Environment Variables

Create a file named `.env` in the root folder (`collegeeventhub/`) by copying `.env.example`:

```bash
cp .env.example .env
```

Set the following variables inside `.env`:

```env
PORT=8080
NODE_ENV=development

# Paste your actual MongoDB Atlas connection string:
MONGODB_URI=mongodb+srv://eventhub_admin:YourSecretPassword123@cluster0.abcde.mongodb.net/college_events?retryWrites=true&w=majority

# Strong random secret string for session signing:
SESSION_SECRET=campus_secret_key_987654321

# Credentials for seeding the first admin account:
ADMIN_NAME=Campus Admin
ADMIN_EMAIL=admin@college.edu
ADMIN_PASSWORD=AdminSecurePass2026!
```

> **Security Notice**: Never commit your `.env` file to Git. It is already added to `.gitignore` and `.gcloudignore`.

---

## 9. Local Development & Testing Instructions

### Step 1: Open Terminal in Project Directory
```powershell
cd c:\Users\tanus\OneDrive\Desktop\collegeeventhub
```

### Step 2: Install Dependencies
```powershell
npm install
```
*(On Windows PowerShell, if script execution policy is restricted, use `npm.cmd install`)*

### Step 3: Seed the Admin Account (Once DB is connected)
```powershell
npm run seed:admin
```
*(Or specify inline: `ADMIN_PASSWORD="AdminSecurePass2026!" npm.cmd run seed:admin`)*

### Step 4: Start the Application
```powershell
npm start
```
You will see output similar to:
```
[College Event Hub] MongoDB Connected: cluster0-shard-00-00.mongodb.net
[College Event Hub] Server is running successfully!
[College Event Hub] Local URL: http://localhost:8080
[College Event Hub] Ready for Google App Engine standard environment
```

### Step 5: Test in Your Browser
Open your browser and navigate to:
- **Homepage**: `http://localhost:8080`
- **Browse Events**: `http://localhost:8080/events.html`
- **Student Sign Up**: `http://localhost:8080/register.html`
- **Login Portal**: `http://localhost:8080/login.html`
- **Admin Dashboard**: `http://localhost:8080/admin-dashboard.html`
- **Health Check API**: `http://localhost:8080/api/health`

---

## 10. How the Frontend Communicates with the Backend

1. **Zero External Frontend Frameworks**: The frontend utilizes pure standards-compliant HTML5, CSS3, and modern Vanilla JavaScript (`fetch` API).
2. **RESTful JSON Communication**:
   - The browser sends HTTP requests (`GET`, `POST`, `PUT`, `DELETE`) with `Content-Type: application/json` headers to `/api/*` endpoints.
   - The Express backend parses payloads using `express.json()` and responds with structured JSON containing status codes, data, and user messages.
3. **Session State via HTTP Cookies**:
   - When a user logs in, Express creates a session record and sends back a signed `connect.sid` cookie.
   - On subsequent page loads, `public/js/auth.js` queries `GET /api/auth/me`. The browser automatically includes the cookie.
   - The backend validates the session and returns user information, allowing `auth.js` to render the correct navigation links (e.g., student name badge vs. admin links).

---

## 11. How MongoDB is Used

Mongoose models structure and enforce college event data rules:

1. **`User` Model** (`models/User.js`):
   - Stores student and administrator records.
   - Performs email normalization and regex validation.
   - Safely strips the `password` hash before serializing user records to JSON.
2. **`Event` Model** (`models/Event.js`):
   - Stores event title, description, category, date, time, venue, organizer, capacity, and banner image.
   - Validates that `maxParticipants >= 1`.
3. **`Registration` Model** (`models/Registration.js`):
   - Establishes relational links between `User` and `Event` using Mongoose ObjectIds (`ref`).
   - Implements a **compound unique index**:
     ```javascript
     registrationSchema.index({ student: 1, event: 1 }, { unique: true });
     ```
   - This ensures that duplicate registrations are prevented at both the application level and the database engine level.

---

## 12. How Google App Engine is Used

Google App Engine Standard Environment provides a zero-server-management runtime:

- **Node.js 24 Runtime**: Configured in `app.yaml` via `runtime: nodejs24`.
- **Dynamic Port Binding**: App Engine automatically sets the `PORT` environment variable. The server code listens on `process.env.PORT || 8080` bound to host `0.0.0.0`.
- **Automated Startup**: App Engine looks for `npm start` in `package.json`, which runs `node server.js`.
- **Reverse Proxy Support**: `app.set('trust proxy', 1)` enables Express to correctly read client IPs and handle SSL termination through Google's cloud load balancers.
- **Optimized Uploads**: `.gcloudignore` ensures `node_modules` and `.env` are omitted from the upload. Google App Engine builds dependencies securely inside the cloud build environment.

---

## 13. Google Cloud App Engine Deployment Steps

Follow these steps to deploy your project live to the web:

### Step 1: Install Google Cloud SDK
If not already installed, download and install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install).

### Step 2: Initialize and Authenticate
Open PowerShell or your terminal and run:
```powershell
gcloud init
```
Log in with your Google account and select or create a new Google Cloud Project (e.g. `college-event-hub-2026`).

### Step 3: Create App Engine Application
If you haven't enabled App Engine in your project:
```powershell
gcloud app create --region=us-central
```
*(Choose the region nearest to you)*

### Step 4: Configure `app.yaml` with your MongoDB URI
Open `app.yaml` and set your `MONGODB_URI` under `env_variables`:
```yaml
env_variables:
  NODE_ENV: 'production'
  SESSION_SECRET: 'production_secure_secret_key_987654'
  MONGODB_URI: 'mongodb+srv://eventhub_admin:YourPass@cluster0.abcde.mongodb.net/college_events?retryWrites=true&w=majority'
```

### Step 5: Deploy to Google Cloud
From your `collegeeventhub` project root directory, run:
```powershell
gcloud app deploy --quiet
```
Google Cloud will upload your project, install dependencies, provision the container, and assign a public URL.

### Step 6: View Your Live Web Application
```powershell
gcloud app browse
```
Your live URL will open in your browser: `https://<YOUR-PROJECT-ID>.appspot.com`!

---

## 14. Admin Account Seeding

To securely generate an administrator account without exposing passwords in source code:

1. In your `.env` file (or terminal), define:
   ```env
   ADMIN_NAME="Faculty Coordinator"
   ADMIN_EMAIL="admin@college.edu"
   ADMIN_PASSWORD="CollegeAdmin2026!"
   ```
2. Execute the seed script:
   ```powershell
   npm run seed:admin
   ```
3. The script will hash the password using `bcryptjs` (10 salt rounds) and save the user with `role: 'admin'`.
4. Log in at `/login.html` using those credentials to access `/admin-dashboard.html`.

---

## 15. Common Errors and Troubleshooting

| Error Symptom | Root Cause | Solution |
|---|---|---|
| `MongoServerSelectionError` / `querySrv ENOTFOUND` | MongoDB URI has incorrect syntax or invalid cluster hostname. | Re-copy connection string from Atlas dashboard. Make sure you replaced `<password>` with your real password. |
| `MongoServerError: bad auth : authentication failed` | Wrong database username or password. | Ensure password does not contain unencoded special characters (e.g., `#`, `@`, `%` must be URL-encoded). Check Atlas Database Access. |
| `MongooseError: operation timed out after 5000ms` | IP access not configured in Atlas. | Go to Atlas **Network Access**, add `0.0.0.0/0` (Allow access from anywhere). |
| `Database is not connected (503)` | `MONGODB_URI` environment variable is missing or empty. | Create `.env` file from `.env.example` and set `MONGODB_URI`. |
| `npm.ps1 cannot be loaded because running scripts is disabled` | Windows PowerShell ExecutionPolicy restriction. | Use `npm.cmd` instead of `npm`, or run `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`. |
| `Error: listen EADDRINUSE :::8080` | Port 8080 is already used by another running process. | Change port in `.env` (e.g., `PORT=5000`) or stop the competing process. |

---

## 16. College Viva Examination Q&A Guide

Prepare for your college project viva with these simple, clear answers:

### Q1: What is the purpose of College Event Hub?
> **Answer**: It is a full-stack, cloud-hosted web application that streamlines college event discovery, registrations, and attendance management. Students can browse, filter, and register for campus events with live seat limits, while administrators can create, edit, delete events, and download/view attendee rosters.

### Q2: Why did you choose Node.js and Express instead of a multi-server setup?
> **Answer**: By using a single Node.js Express application, the server can serve both the client-side user interface (`public/` static directory) and provide RESTful API endpoints (`/api/*`). This reduces complexity, eliminates Cross-Origin Resource Sharing (CORS) issues, simplifies session management, and makes deployment to Google App Engine seamless.

### Q3: How is user authentication implemented?
> **Answer**: Authentication uses session-based authentication via `express-session` and password hashing via `bcryptjs`. When a user registers or logs in, their password is encrypted using a cryptographic salt and one-way hashing algorithm. Passwords are never stored in plain text. On successful authentication, an HTTP-only session cookie is issued to identify the user on subsequent requests.

### Q4: How is role-based access control (RBAC) enforced?
> **Answer**: We use custom Express middleware (`isAuthenticated`, `isAdmin`, `isStudent` in `authMiddleware.js`). Before any sensitive API endpoint executes, the middleware inspects `req.session.user.role`. If a student attempts to call an admin route (such as creating an event or accessing student rosters), the server returns HTTP 403 Forbidden.

### Q5: How do you prevent duplicate registrations and overbooking?
> **Answer**: 
> 1. **Duplicate Prevention**: Before creating a registration, the server checks if a registration with `{ student: studentId, event: eventId }` already exists. In addition, Mongoose enforces a compound unique index in the database.
> 2. **Capacity Enforcement**: The server counts the number of existing registrations for the event. If `count >= maxParticipants`, the registration is rejected with an informative message ("Event is full").

### Q6: Why did you use MongoDB Atlas instead of a local database?
> **Answer**: MongoDB Atlas is a cloud Database-as-a-Service (DBaaS). Local databases (like `localhost:27017`) cannot be reached by cloud instances running in Google App Engine. MongoDB Atlas provides a globally accessible, secure, high-availability database cluster accessible over TLS encryption.

### Q7: What is Google App Engine and how does it host your project?
> **Answer**: Google App Engine is a Platform-as-a-Service (PaaS) product by Google Cloud. Instead of managing virtual machines, operating system updates, or firewalls, we provide an `app.yaml` descriptor file and our code. App Engine automatically provisions Node.js runtime containers, manages incoming HTTPS traffic, and scales instances up or down based on request demand.

### Q8: What is the role of `.gcloudignore`?
> **Answer**: Similar to `.gitignore`, `.gcloudignore` prevents uploading unnecessary or sensitive files—such as `node_modules` and `.env`—to Google Cloud. This keeps deployments fast and prevents credentials from leaking. App Engine builds dependencies cleanly in the cloud using `package.json`.

---

**College Event Hub** — Prepared for academic presentation, demonstration, and Google Cloud App Engine deployment.
