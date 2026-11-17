// test-verification.js
// Exhaustive verification of all frontend and backend requirements
// Tests: Auth (Student, Faculty, Admin), Stats, Attendance CRUD & Scoping, User Search/Filter/Pagination, and Security.

const http = require('http');
const mongoose = require('mongoose');

const BASE = 'http://localhost:5000';

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

let checksPassed = 0;
let checksFailed = 0;
function test(label, condition, details = '') {
  if (condition) {
    console.log(`  [PASS] ${label}`);
    checksPassed++;
  } else {
    console.log(`  [FAIL] ${label} - ${details}`);
    checksFailed++;
  }
}

async function runVerification() {
  console.log('\n============================================================');
  console.log(' SMART CAMPUS — LIVE SYSTEM VERIFICATION');
  console.log('============================================================\n');

  // Clear database to start with fresh, known state
  await mongoose.connect('mongodb://127.0.0.1:27017/smart_campus');
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
  console.log('Database reset for clean verification.\n');

  // ==========================================================
  // SECTION 1: ROLE ACCOUNTS & AUTHENTICATION
  // ==========================================================
  console.log('--- 1. Testing Registration & Authentication Across All 3 Roles ---');

  // Register Faculty
  const regFac = await request('POST', '/api/auth/register', {
    name: 'Dr. Priya Sharma',
    email: 'priya.faculty@campus.com',
    password: 'faculty123',
    role: 'faculty',
  });
  test('Register Faculty returns 201', regFac.status === 201);
  test('Register Faculty returns token & user data', !!regFac.body.token && regFac.body.data.role === 'faculty');
  const facultyToken = regFac.body.token;
  const facultyId = regFac.body.data._id;

  // Register Student 1
  const regStu1 = await request('POST', '/api/auth/register', {
    name: 'Rahul Kumar',
    email: 'rahul.student@campus.com',
    password: 'student123',
    role: 'student',
  });
  test('Register Student 1 returns 201', regStu1.status === 201);
  const student1Token = regStu1.body.token;
  const student1Id = regStu1.body.data._id;

  // Register Student 2
  const regStu2 = await request('POST', '/api/auth/register', {
    name: 'Ananya Gupta',
    email: 'ananya.student@campus.com',
    password: 'student123',
    role: 'student',
  });
  test('Register Student 2 returns 201', regStu2.status === 201);
  const student2Token = regStu2.body.token;
  const student2Id = regStu2.body.data._id;

  // Register Admin
  const regAdm = await request('POST', '/api/auth/register', {
    name: 'Admin System',
    email: 'admin@campus.com',
    password: 'admin123',
    role: 'admin',
  });
  test('Register Admin returns 201', regAdm.status === 201);
  const adminToken = regAdm.body.token;
  const adminId = regAdm.body.data._id;

  // Duplicate email check
  const dup = await request('POST', '/api/auth/register', {
    name: 'Duplicate',
    email: 'priya.faculty@campus.com',
    password: 'password',
  });
  test('Reject registration with duplicate email (409)', dup.status === 409);

  // Login verification for each role
  const loginFac = await request('POST', '/api/auth/login', {
    email: 'priya.faculty@campus.com',
    password: 'faculty123',
  });
  test('Faculty login returns 200 and token', loginFac.status === 200 && !!loginFac.body.token);

  const loginStu = await request('POST', '/api/auth/login', {
    email: 'rahul.student@campus.com',
    password: 'student123',
  });
  test('Student login returns 200 and token', loginStu.status === 200 && !!loginStu.body.token);

  const loginAdm = await request('POST', '/api/auth/login', {
    email: 'admin@campus.com',
    password: 'admin123',
  });
  test('Admin login returns 200 and token', loginAdm.status === 200 && !!loginAdm.body.token);

  const loginBad = await request('POST', '/api/auth/login', {
    email: 'rahul.student@campus.com',
    password: 'wrongpassword',
  });
  test('Reject invalid password (401)', loginBad.status === 401);

  // ==========================================================
  // SECTION 2: DASHBOARD STATISTICS (Empty & Populated)
  // ==========================================================
  console.log('\n--- 2. Testing Dashboard Statistics Endpoint (/api/attendance/stats) ---');

  // Initial stats (0 attendance records)
  const initialStats = await request('GET', '/api/attendance/stats', null, facultyToken);
  test('Initial stats returns 200', initialStats.status === 200);
  test('Initial totalStudents matches registered student count (2)', initialStats.body.data.totalStudents === 2);
  test('Initial attendance records is 0', initialStats.body.data.totalAttendanceRecords === 0);
  test('Initial overallPercentage is 0', initialStats.body.data.overallPercentage === 0);

  // ==========================================================
  // SECTION 3: ATTENDANCE MANAGEMENT & ROLE-BASED ACCESS
  // ==========================================================
  console.log('\n--- 3. Testing Attendance Management & Role Authorization ---');

  // Student attempts to mark attendance -> MUST FAIL (403)
  const studentMarkAttempt = await request(
    'POST',
    '/api/attendance',
    { student: student1Id, date: '2026-11-20', status: 'Present' },
    student1Token
  );
  test('Student CANNOT mark attendance (403 Forbidden)', studentMarkAttempt.status === 403);

  // Faculty marks Student 1: Present on Nov 20
  const mark1 = await request(
    'POST',
    '/api/attendance',
    { student: student1Id, date: '2026-11-20', status: 'Present' },
    facultyToken
  );
  test('Faculty marks Student 1 Present on Nov 20 (201)', mark1.status === 201);
  const rec1Id = mark1.body.data?._id;

  // Duplicate check: Same student on same date -> MUST FAIL (409)
  const dupMark = await request(
    'POST',
    '/api/attendance',
    { student: student1Id, date: '2026-11-20', status: 'Absent' },
    facultyToken
  );
  test('Duplicate attendance on same student + date rejected (409 Conflict)', dupMark.status === 409);

  // Faculty marks Student 1: Absent on Nov 21
  const mark2 = await request(
    'POST',
    '/api/attendance',
    { student: student1Id, date: '2026-11-21', status: 'Absent' },
    facultyToken
  );
  test('Faculty marks Student 1 Absent on Nov 21 (201)', mark2.status === 201);

  // Faculty marks Student 1: Present on Nov 22
  const mark3 = await request(
    'POST',
    '/api/attendance',
    { student: student1Id, date: '2026-11-22', status: 'Present' },
    facultyToken
  );
  test('Faculty marks Student 1 Present on Nov 22 (201)', mark3.status === 201);

  // Admin marks Student 2: Present on Nov 20
  const mark4 = await request(
    'POST',
    '/api/attendance',
    { student: student2Id, date: '2026-11-20', status: 'Present' },
    adminToken
  );
  test('Admin can mark attendance (201)', mark4.status === 201);
  const rec4Id = mark4.body.data?._id;

  // Status validation check
  const badStatus = await request(
    'POST',
    '/api/attendance',
    { student: student2Id, date: '2026-11-23', status: 'Excused' },
    facultyToken
  );
  test('Reject invalid status (400)', badStatus.status === 400);

  // Viewing attendance: Faculty sees all 4 records
  const allFac = await request('GET', '/api/attendance', null, facultyToken);
  test('Faculty sees all campus attendance records (4)', allFac.status === 200 && allFac.body.count === 4);

  // Viewing attendance: Student 1 sees ONLY their own 3 records
  const allStu1 = await request('GET', '/api/attendance', null, student1Token);
  test('Student 1 sees only own records (3)', allStu1.status === 200 && allStu1.body.count === 3);
  test('Student 1 sees no records belonging to Student 2', !allStu1.body.data.some((r) => r.student?._id === student2Id));

  // Viewing attendance: Student 2 sees ONLY their own 1 record
  const allStu2 = await request('GET', '/api/attendance', null, student2Token);
  test('Student 2 sees only own record (1)', allStu2.status === 200 && allStu2.body.count === 1);

  // Filter attendance by status
  const presFilter = await request('GET', '/api/attendance?status=Present', null, facultyToken);
  test('Filter by status=Present returns 3 records', presFilter.status === 200 && presFilter.body.count === 3);

  // Filter attendance by date
  const dateFilter = await request('GET', '/api/attendance?date=2026-11-20', null, facultyToken);
  test('Filter by date=2026-11-20 returns 2 records', dateFilter.status === 200 && dateFilter.body.count === 2);

  // Edit attendance: Student attempts -> MUST FAIL (403)
  const studentEditAttempt = await request('PUT', `/api/attendance/${rec1Id}`, { status: 'Absent' }, student1Token);
  test('Student CANNOT edit attendance (403 Forbidden)', studentEditAttempt.status === 403);

  // Edit attendance: Faculty updates rec1 from Present to Absent
  const editFac = await request('PUT', `/api/attendance/${rec1Id}`, { status: 'Absent' }, facultyToken);
  test('Faculty updates attendance status to Absent (200)', editFac.status === 200 && editFac.body.data.status === 'Absent');

  // Edit attendance: Admin updates rec1 back to Present
  const editAdm = await request('PUT', `/api/attendance/${rec1Id}`, { status: 'Present' }, adminToken);
  test('Admin updates attendance status (200)', editAdm.status === 200 && editAdm.body.data.status === 'Present');

  // Delete attendance: Student attempts -> MUST FAIL (403)
  const studentDelAttempt = await request('DELETE', `/api/attendance/${rec4Id}`, null, student1Token);
  test('Student CANNOT delete attendance (403 Forbidden)', studentDelAttempt.status === 403);

  // Delete attendance: Faculty deletes record 4
  const delFac = await request('DELETE', `/api/attendance/${rec4Id}`, null, facultyToken);
  test('Faculty deletes attendance record (200)', delFac.status === 200);

  // Verifying delete worked
  const delCheck = await request('DELETE', `/api/attendance/${rec4Id}`, null, facultyToken);
  test('Deleting already deleted record returns 404', delCheck.status === 404);

  // Percentage calculation: Student 1 has 3 records: 2 Present, 1 Absent = 66.67%
  const pct1 = await request('GET', `/api/attendance/percentage/${student1Id}`, null, facultyToken);
  test('Attendance percentage calculates correctly (2/3 = 66.67%)', pct1.status === 200 && pct1.body.data.percentage === 66.67);

  // Student 1 checks own percentage
  const pctSelf = await request('GET', `/api/attendance/percentage/${student1Id}`, null, student1Token);
  test('Student checks own percentage (200)', pctSelf.status === 200);

  // Student 1 checks Student 2's percentage -> MUST FAIL (403)
  const pctOther = await request('GET', `/api/attendance/percentage/${student2Id}`, null, student1Token);
  test('Student CANNOT check another student percentage (403 Forbidden)', pctOther.status === 403);

  // Verify updated Dashboard stats from MongoDB
  const updatedStats = await request('GET', '/api/attendance/stats', null, facultyToken);
  test('Dashboard totalAttendanceRecords reflects live DB count (3)', updatedStats.body.data.totalAttendanceRecords === 3);
  test('Dashboard presentRecords matches DB count (2)', updatedStats.body.data.presentRecords === 2);
  test('Dashboard absentRecords matches DB count (1)', updatedStats.body.data.absentRecords === 1);
  test('Dashboard overallPercentage matches DB calculation (66.67%)', updatedStats.body.data.overallPercentage === 66.67);

  // ==========================================================
  // SECTION 4: USER SEARCH, FILTERING, PAGINATION & SECURITY
  // ==========================================================
  console.log('\n--- 4. Testing User Search, Role Filter, Pagination & Data Security ---');

  // Fetch all users
  const allUsers = await request('GET', '/api/users', null, facultyToken);
  test('Fetch all users returns 200', allUsers.status === 200);
  test('Pagination metadata is present and accurate', allUsers.body.pagination.totalRecords === 4);

  // Security Check: Passwords must NEVER be returned in responses
  const hasExposedPassword = allUsers.body.data.some((u) => u.password !== undefined);
  test('SECURITY: Passwords are NEVER exposed in user responses', !hasExposedPassword);

  // Search by name (case-insensitive partial match)
  const searchName = await request('GET', '/api/users?search=rahul', null, facultyToken);
  test('Search by partial name "rahul" returns 1 user', searchName.status === 200 && searchName.body.count === 1);

  // Search by email domain
  const searchEmail = await request('GET', '/api/users?search=campus.com', null, facultyToken);
  test('Search by email domain "campus.com" returns all 4 users', searchEmail.status === 200 && searchEmail.body.count === 4);

  // Role filter: student
  const filterStu = await request('GET', '/api/users?role=student', null, facultyToken);
  test('Filter by role=student returns 2 students', filterStu.status === 200 && filterStu.body.count === 2);
  test('All filtered results have role=student', filterStu.body.data.every((u) => u.role === 'student'));

  // Role filter: faculty
  const filterFaculty = await request('GET', '/api/users?role=faculty', null, facultyToken);
  test('Filter by role=faculty returns 1 faculty', filterFaculty.status === 200 && filterFaculty.body.count === 1);

  // Combined search + role
  const combined = await request('GET', '/api/users?search=ananya&role=student', null, facultyToken);
  test('Combined search="ananya" and role=student returns 1 record', combined.status === 200 && combined.body.count === 1);

  // Pagination: Page 1 with limit 2
  const p1 = await request('GET', '/api/users?page=1&limit=2', null, facultyToken);
  test('Pagination page 1 with limit 2 returns 2 records', p1.status === 200 && p1.body.count === 2);
  test('Pagination page 1 indicates hasNextPage=true', p1.body.pagination.hasNextPage === true);
  test('Pagination page 1 indicates hasPreviousPage=false', p1.body.pagination.hasPreviousPage === false);

  // Pagination: Page 2 with limit 2
  const p2 = await request('GET', '/api/users?page=2&limit=2', null, facultyToken);
  test('Pagination page 2 returns 2 records', p2.status === 200 && p2.body.count === 2);
  test('Pagination page 2 indicates hasPreviousPage=true', p2.body.pagination.hasPreviousPage === true);

  // Pagination: Page 3 with limit 2 (out of range)
  const p3 = await request('GET', '/api/users?page=3&limit=2', null, facultyToken);
  test('Pagination page 3 returns 0 records and hasNextPage=false', p3.status === 200 && p3.body.count === 0 && p3.body.pagination.hasNextPage === false);

  // Unauthenticated request without token -> MUST FAIL (401)
  const noToken = await request('GET', '/api/users');
  test('Unauthenticated request rejected with 401 Unauthorized', noToken.status === 401);

  // Invalid role parameter
  const badRole = await request('GET', '/api/users?role=invalidrole', null, facultyToken);
  test('Reject invalid role filter (400)', badRole.status === 400);

  // ==========================================================
  // SUMMARY
  // ==========================================================
  console.log('\n============================================================');
  console.log(` VERIFICATION COMPLETE: ${checksPassed} PASSED, ${checksFailed} FAILED`);
  console.log('============================================================\n');

  process.exit(checksFailed > 0 ? 1 : 0);
}

runVerification().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});
