# College Event Hub - REST API Documentation

## Authentication APIs
- `POST /api/auth/register`: Register new student account
- `POST /api/auth/login`: Authenticate user and open session
- `GET  /api/auth/me`: Get current logged-in user profile
- `POST /api/auth/logout`: Destroy session

## Event APIs
- `GET    /api/events`: List approved events (or all events for admins)
- `GET    /api/events/:id`: Fetch single event details
- `POST   /api/events`: Create new event (requires poster file or URL)
- `PUT    /api/events/:id`: Update event
- `DELETE /api/events/:id`: Delete event

## Registration APIs
- `POST   /api/events/:id/register`: Register student for event
- `DELETE /api/events/:id/register`: Cancel event registration
- `GET    /api/registrations/my-registrations`: Get student's registrations
- `GET    /api/registrations/:id/qr`: Get QR code DataURL for registration ticket

## Attendance APIs
- `POST /api/attendance/scan`: Scan QR registration ID and mark attendance
- `GET  /api/attendance/event/:eventId`: Get attendance list for event

## Admin APIs
- `GET /api/admin/stats`: Get system stats
- `GET /api/admin/events/pending`: List events awaiting approval
- `PUT /api/admin/events/:id/approve`: Approve pending event
- `PUT /api/admin/events/:id/reject`: Reject pending event
- `GET /api/admin/users`: List all registered users
- `PUT /api/admin/users/:id/suspend`: Toggle user suspension
- `GET /api/admin/analytics`: Get aggregation analytics
- `GET /api/admin/events/:id/export-csv`: Export CSV roster
