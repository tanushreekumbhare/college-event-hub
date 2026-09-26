# College Event Hub - System Architecture

## Overview
College Event Hub is a centralized cloud-based platform for managing college events built with Node.js, Express.js, HTML5/CSS3/Vanilla JavaScript, and MongoDB Atlas Cloud Database.

```text
                STUDENTS / ORGANIZERS / ADMINS
                               |
                               | (HTTPS Request)
                         WEB BROWSER
                               |
                               v
                     HTML5 + CSS3 + JavaScript
                               |
                               v (REST APIs / JSON)
                        Node.js + Express.js
                               |
             +-----------------+-----------------+
             |                                   |
             v                                   v
       Mongoose ODM                         Cloudinary SDK
             |                                   |
             v                                   v
      MongoDB Atlas                         Cloud Storage
   (Cloud Database)                       (Event Posters)
```

## Core Components
1. **Frontend**: Responsive UI using Vanilla JavaScript, HTML5, modern CSS, Chart.js for analytics, and QRCode rendering.
2. **Backend**: Node.js v20+ with Express.js implementing RESTful APIs, Session/JWT Auth, bcrypt password hashing, and role authorization.
3. **Database**: MongoDB Atlas Cloud Database with Mongoose ODM modeling users, events, registrations, attendance, feedback, certificates, clubs, venues, and categories.
4. **Cloud Storage (Optional)**: Cloudinary for event posters.
