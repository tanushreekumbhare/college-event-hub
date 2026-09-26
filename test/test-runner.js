/**
 * Automated Test Runner for College Event Hub
 * Tests:
 * 1. Static asset serving (HTML, CSS, JS)
 * 2. API Health check endpoint
 * 3. 404 API handling
 * 4. Missing MONGODB_URI handling (503 responses with clear guidance)
 * 5. Session authentication middleware (401 unauthenticated)
 * 6. Role-Based Access Control (403 for student accessing admin endpoints)
 * 7. Password hashing verification with bcryptjs
 * 8. User model Mongoose schema validations (email regex, required fields, role enum)
 * 9. Event model Mongoose schema validations (required fields, category enum, maxParticipants)
 * 10. Registration model Mongoose schema validations (student & event references)
 * 11. Event capacity & duplicate registration logic simulation
 * 12. App Engine configuration validation (app.yaml & .gcloudignore)
 */

const request = require('supertest');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Import models
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

// Import app
const app = require('../server');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${testName}`);
  }
}

async function runTests() {
  console.log('\n=============================================================');
  console.log('🧪 Starting College Event Hub Automated Test Suite');
  console.log('=============================================================\n');

  // -----------------------------------------------------------------
  // 1. Static Frontend Assets Serving
  // -----------------------------------------------------------------
  console.log('--- Test Group 1: Static Files Serving ---');
  try {
    const resHome = await request(app).get('/');
    assert(resHome.status === 200 && resHome.text.includes('College Event Hub'), 'GET / serves index.html with brand title');

    const resEvents = await request(app).get('/events.html');
    assert(resEvents.status === 200 && resEvents.text.includes('Discover College Events'), 'GET /events.html serves event catalog');

    const resLogin = await request(app).get('/login.html');
    assert(resLogin.status === 200 && resLogin.text.includes('Sign in to your student or administrator account'), 'GET /login.html serves login page');

    const resRegister = await request(app).get('/register.html');
    assert(resRegister.status === 200 && resRegister.text.includes('Create Student Account'), 'GET /register.html serves registration page');

    const resDetails = await request(app).get('/event-details.html');
    assert(resDetails.status === 200 && resDetails.text.includes('Event Details'), 'GET /event-details.html serves event details');

    const resStudentDash = await request(app).get('/student-dashboard.html');
    assert(resStudentDash.status === 200 && resStudentDash.text.includes('Student Dashboard'), 'GET /student-dashboard.html serves student dashboard');

    const resAdminDash = await request(app).get('/admin-dashboard.html');
    assert(resAdminDash.status === 200 && resAdminDash.text.includes('Campus Administrator Console'), 'GET /admin-dashboard.html serves admin dashboard');

    const resCreateEvent = await request(app).get('/create-event.html');
    assert(resCreateEvent.status === 200 && resCreateEvent.text.includes('Create College Event'), 'GET /create-event.html serves event form');

    const resCss = await request(app).get('/css/style.css');
    assert(resCss.status === 200 && resCss.text.includes('--primary'), 'GET /css/style.css serves compiled CSS');

    const resJsAuth = await request(app).get('/js/auth.js');
    assert(resJsAuth.status === 200 && resJsAuth.text.includes('handleLoginSubmit'), 'GET /js/auth.js serves client auth script');
  } catch (err) {
    console.error('Error in Group 1:', err);
    failedTests++;
  }

  // -----------------------------------------------------------------
  // 2. Health Check & API Route Routing
  // -----------------------------------------------------------------
  console.log('\n--- Test Group 2: Health Check & 404 Routing ---');
  try {
    const resHealth = await request(app).get('/api/health');
    assert(resHealth.status === 200 && resHealth.body.status === 'ok', 'GET /api/health returns HTTP 200 with status ok');

    const resNotFound = await request(app).get('/api/invalid-endpoint-12345');
    assert(resNotFound.status === 404 && resNotFound.body.success === false, 'GET /api/* invalid route returns HTTP 404 with JSON');

    const resMeGuest = await request(app).get('/api/auth/me');
    assert(resMeGuest.status === 200 && resMeGuest.body.user === null, 'GET /api/auth/me returns user: null for unauthenticated visitors');
  } catch (err) {
    console.error('Error in Group 2:', err);
    failedTests++;
  }

  // -----------------------------------------------------------------
  // 3. Database Connection Handling (Missing MONGODB_URI)
  // -----------------------------------------------------------------
  console.log('\n--- Test Group 3: Database Handling When MONGODB_URI is Missing ---');
  try {
    const resReg = await request(app).post('/api/auth/register').send({
      name: 'Test Student',
      email: 'student@college.edu',
      password: 'password123'
    });
    assert(
      resReg.status === 503 && resReg.body.message.includes('Database is not connected'),
      'POST /api/auth/register gracefully returns 503 explaining MONGODB_URI is needed'
    );

    const resLogin = await request(app).post('/api/auth/login').send({
      email: 'student@college.edu',
      password: 'password123'
    });
    assert(
      resLogin.status === 503 && resLogin.body.message.includes('Database is not connected'),
      'POST /api/auth/login gracefully returns 503 when DB is offline'
    );

    const resEvents = await request(app).get('/api/events');
    assert(
      resEvents.status === 503 && resEvents.body.message.includes('Database is not connected'),
      'GET /api/events gracefully returns 503 when DB is offline'
    );
  } catch (err) {
    console.error('Error in Group 3:', err);
    failedTests++;
  }

  // -----------------------------------------------------------------
  // 4. Authentication & Authorization Middleware
  // -----------------------------------------------------------------
  console.log('\n--- Test Group 4: Authentication & Role-Based Middleware ---');
  try {
    const { isAuthenticated, isAdmin, isStudent } = require('../middleware/authMiddleware');

    // Test isAuthenticated with unauthenticated request
    let unauthResStatus = null;
    let unauthResBody = null;
    const mockRes = {
      status: (code) => {
        unauthResStatus = code;
        return {
          json: (body) => { unauthResBody = body; }
        };
      }
    };

    let nextCalled = false;
    isAuthenticated({ session: {} }, mockRes, () => { nextCalled = true; });
    assert(unauthResStatus === 401 && !nextCalled, 'isAuthenticated rejects requests without session with HTTP 401');

    // Test isAdmin with student session
    let adminDeniedStatus = null;
    const mockAdminRes = {
      status: (code) => {
        adminDeniedStatus = code;
        return { json: () => {} };
      }
    };
    let adminNextCalled = false;
    isAdmin({ session: { user: { role: 'student' } } }, mockAdminRes, () => { adminNextCalled = true; });
    assert(adminDeniedStatus === 403 && !adminNextCalled, 'isAdmin rejects student role with HTTP 403 Forbidden');

    // Test isAdmin with admin session
    let adminApproved = false;
    isAdmin({ session: { user: { role: 'admin' } } }, mockAdminRes, () => { adminApproved = true; });
    assert(adminApproved, 'isAdmin grants access to user with role admin');

    // Test isStudent with student session
    let studentApproved = false;
    isStudent({ session: { user: { role: 'student' } } }, mockAdminRes, () => { studentApproved = true; });
    assert(studentApproved, 'isStudent grants access to user with role student');

    // Test isStudent with admin session
    let studentDeniedStatus = null;
    const mockStudentRes = {
      status: (code) => {
        studentDeniedStatus = code;
        return { json: () => {} };
      }
    };
    let studentNextCalled = false;
    isStudent({ session: { user: { role: 'admin' } } }, mockStudentRes, () => { studentNextCalled = true; });
    assert(studentDeniedStatus === 403 && !studentNextCalled, 'isStudent rejects admin role with HTTP 403 Forbidden');
  } catch (err) {
    console.error('Error in Group 4:', err);
    failedTests++;
  }

  // -----------------------------------------------------------------
  // 5. Password Security & Hashing
  // -----------------------------------------------------------------
  console.log('\n--- Test Group 5: Password Hashing with bcryptjs ---');
  try {
    const plainPassword = 'SuperSecretPassword2026!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(plainPassword, salt);

    assert(hash !== plainPassword, 'Password is never stored in plain text');
    assert(hash.startsWith('$2a$') || hash.startsWith('$2b$'), 'Password hash uses valid bcrypt format');

    const isValid = await bcrypt.compare(plainPassword, hash);
    assert(isValid === true, 'bcrypt correctly verifies matching plain password against hash');

    const isWrongValid = await bcrypt.compare('WrongPassword!', hash);
    assert(isWrongValid === false, 'bcrypt rejects non-matching password');
  } catch (err) {
    console.error('Error in Group 5:', err);
    failedTests++;
  }

  // -----------------------------------------------------------------
  // 6. Mongoose Model Validation Checks
  // -----------------------------------------------------------------
  console.log('\n--- Test Group 6: Mongoose Schema & Validation ---');
  try {
    // User Model
    const validUser = new User({
      name: 'Valid Student',
      email: 'student@college.edu',
      password: 'hashedPassword123',
      role: 'student'
    });
    const userErr = validUser.validateSync();
    assert(userErr === undefined, 'User model validates correct student schema');

    const invalidEmailUser = new User({
      name: 'Student',
      email: 'not-an-email',
      password: 'password123',
      role: 'student'
    });
    const emailErr = invalidEmailUser.validateSync();
    assert(emailErr && emailErr.errors.email, 'User model rejects invalid email format');

    const invalidRoleUser = new User({
      name: 'Student',
      email: 'valid@college.edu',
      password: 'password123',
      role: 'superman'
    });
    const roleErr = invalidRoleUser.validateSync();
    assert(roleErr && roleErr.errors.role, 'User model rejects roles other than student or admin');

    // Event Model
    const validEvent = new Event({
      title: 'AI & Cloud Hackathon',
      description: 'Annual campus hackathon',
      category: 'Technical',
      date: '2026-10-15',
      time: '09:00 AM',
      venue: 'Auditorium A',
      organizer: 'CSE Dept',
      maxParticipants: 50
    });
    const eventErr = validEvent.validateSync();
    assert(eventErr === undefined, 'Event model validates complete event document');

    const invalidCapacityEvent = new Event({
      title: 'Bad Capacity Event',
      description: 'Desc',
      category: 'Technical',
      date: '2026-10-15',
      time: '10:00 AM',
      venue: 'Room 1',
      organizer: 'Club',
      maxParticipants: 0
    });
    const capacityErr = invalidCapacityEvent.validateSync();
    assert(capacityErr && capacityErr.errors.maxParticipants, 'Event model enforces maxParticipants >= 1');

    // Registration Model
    const validReg = new Registration({
      student: validUser._id,
      event: validEvent._id
    });
    const regErr = validReg.validateSync();
    assert(regErr === undefined, 'Registration model validates student and event ObjectIds');
  } catch (err) {
    console.error('Error in Group 6:', err);
    failedTests++;
  }

  // -----------------------------------------------------------------
  // 7. Event Capacity & Duplicate Registration Logic Simulation
  // -----------------------------------------------------------------
  console.log('\n--- Test Group 7: Capacity and Duplicate Registration Logic ---');
  try {
    const mockEvent = {
      _id: 'event-101',
      title: 'Web Dev Workshop',
      maxParticipants: 2
    };

    const mockRegistrations = [];

    // Helper simulating registration endpoint logic
    function registerStudent(studentId, event) {
      // 1. Duplicate check
      const alreadyRegistered = mockRegistrations.some(
        (r) => r.student === studentId && r.event === event._id
      );
      if (alreadyRegistered) {
        return { success: false, status: 400, message: 'Already registered' };
      }

      // 2. Capacity check
      const currentCount = mockRegistrations.filter((r) => r.event === event._id).length;
      if (currentCount >= event.maxParticipants) {
        return { success: false, status: 400, message: 'Event is full' };
      }

      // 3. Register
      const newReg = { id: `reg-${Date.now()}`, student: studentId, event: event._id };
      mockRegistrations.push(newReg);
      return { success: true, status: 201, registration: newReg };
    }

    // Student 1 registers -> success
    const reg1 = registerStudent('student-1', mockEvent);
    assert(reg1.success === true && reg1.status === 201, 'Student 1 successfully registers when spots are open');

    // Student 1 tries registering again -> rejected
    const reg1Dup = registerStudent('student-1', mockEvent);
    assert(reg1Dup.success === false && reg1Dup.message === 'Already registered', 'Duplicate registration is prevented with "Already registered"');

    // Student 2 registers -> success (capacity now 2/2)
    const reg2 = registerStudent('student-2', mockEvent);
    assert(reg2.success === true && reg2.status === 201, 'Student 2 successfully registers reaching max capacity');

    // Student 3 tries registering -> rejected (event full)
    const reg3 = registerStudent('student-3', mockEvent);
    assert(reg3.success === false && reg3.message === 'Event is full', 'Student 3 rejected with "Event is full" when capacity reached');

    // Student 1 cancels registration -> spot freed
    const cancelIdx = mockRegistrations.findIndex((r) => r.student === 'student-1');
    mockRegistrations.splice(cancelIdx, 1);
    assert(mockRegistrations.length === 1, 'Cancellation successfully frees seat');

    // Student 3 retries after cancellation -> now succeeds!
    const reg3Retry = registerStudent('student-3', mockEvent);
    assert(reg3Retry.success === true && reg3Retry.status === 201, 'Student 3 successfully registers after cancellation frees a spot');
  } catch (err) {
    console.error('Error in Group 7:', err);
    failedTests++;
  }

  // -----------------------------------------------------------------
  // 8. Google App Engine Configuration Checks
  // -----------------------------------------------------------------
  console.log('\n--- Test Group 8: Google App Engine Configuration ---');
  try {
    const appYamlPath = path.join(__dirname, '../app.yaml');
    const appYamlContent = fs.readFileSync(appYamlPath, 'utf8');

    assert(appYamlContent.includes('runtime: nodejs24') || appYamlContent.includes('runtime: nodejs20'), 'app.yaml specifies runtime: nodejs20 or nodejs24');
    assert(appYamlContent.includes('instance_class: F1'), 'app.yaml defines standard instance class F1');

    const gcloudignorePath = path.join(__dirname, '../.gcloudignore');
    const gcloudignoreContent = fs.readFileSync(gcloudignorePath, 'utf8');

    assert(gcloudignoreContent.includes('node_modules/'), '.gcloudignore excludes node_modules/');
    assert(gcloudignoreContent.includes('.env'), '.gcloudignore excludes .env credentials file');

    const pkgPath = path.join(__dirname, '../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    assert(pkg.scripts && pkg.scripts.start === 'node server.js', 'package.json start script is "node server.js"');
  } catch (err) {
    console.error('Error in Group 8:', err);
    failedTests++;
  }

  // -----------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------
  console.log('\n=============================================================');
  console.log(`📊 Test Summary: ${passedTests} / ${totalTests} passed`);
  if (failedTests === 0) {
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! No defects found.');
  } else {
    console.error(`⚠️ ${failedTests} test(s) failed.`);
  }
  console.log('=============================================================\n');

  process.exit(failedTests === 0 ? 0 : 1);
}

runTests();
