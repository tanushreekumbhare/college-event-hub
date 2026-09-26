# College Event Hub - Database Schema & Design

## MongoDB Atlas Collections

```text
users
events
registrations
attendance
feedback
notifications
favorites
certificates
clubs
venues
categories
participationPoints
auditLogs
```

## Collection Descriptions
- **users**: Stores student, organizer, and admin credentials, department, year, points, suspension status.
- **events**: Stores title, description, category, date, venue, capacity, organizer reference, poster image URL, approval status.
- **registrations**: Links student to event with timestamps and attendance flag.
- **attendance**: Records verified QR check-in timestamp and staff member.
- **feedback**: Stores 1-5 rating and comment per event.
- **certificates**: Stores unique certificate IDs and PDF paths for verified attendees.
- **clubs**: Manages campus clubs and leads.
- **venues**: Manages campus halls, labs, and grounds with capacity limits.
- **categories**: Manages event categories (Technical, Cultural, Sports, Workshop, etc.).
- **participationPoints**: Tracks point allocation audit log.
- **auditLogs**: Tracks security and admin actions.
