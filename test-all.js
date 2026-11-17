// test-all.js
// Comprehensive end-to-end test for Attendance and User modules
// Run: node test-all.js (while server is running)

const http = require('http');
const mongoose = require('mongoose');

const BASE = 'http://localhost:5000';

// Helper to make HTTP requests
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

let passed = 0;
let failed = 0;
function check(label, condition, detail) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label} — ${detail || 'FAILED'}`);
    failed++;
  }
}

async function run() {
  // Connect to DB and clear for clean test run
  await mongoose.connect('mongodb://127.0.0.1:27017/smart_campus');
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();

  console.log('\n========================================');
  console.log(' SMART CAMPUS — END-TO-END TESTS');
  console.log('========================================\n');

  // --- 1. Test route ---
  console.log('1. TEST ROUTE');
  let r = await request('GET', '/api/test');
  check('GET /api/test returns 200', r.status === 200);
  check('Response has success: true', r.body.success === true);

  // --- 2. Register users ---
  console.log('\n2. REGISTER USERS');

  r = await request('POST', '/api/auth/register', {
    name: 'Dr. Priya Sharma',
    email: 'priya.faculty@campus.com',
    password: 'faculty123',
    role: 'faculty',
  });
  check('Register faculty', r.status === 201, JSON.stringify(r.body));
  const facultyId = r.body.data?._id;
  const facultyToken = r.body.token;

  r = await request('POST', '/api/auth/register', {
    name: 'Rahul Kumar',
    email: 'rahul.student@campus.com',
    password: 'student123',
    role: 'student',
  });
  check('Register student 1', r.status === 201, JSON.stringify(r.body));
  const student1Id = r.body.data?._id;
  const student1Token = r.body.token;

  r = await request('POST', '/api/auth/register', {
    name: 'Ananya Gupta',
    email: 'ananya.student@campus.com',
    password: 'student123',
    role: 'student',
  });
  check('Register student 2', r.status === 201, JSON.stringify(r.body));
  const student2Id = r.body.data?._id;

  r = await request('POST', '/api/auth/register', {
    name: 'Admin User',
    email: 'admin@campus.com',
    password: 'admin123',
    role: 'admin',
  });
  check('Register admin', r.status === 201, JSON.stringify(r.body));
  const adminToken = r.body.token;

  // Duplicate email
  r = await request('POST', '/api/auth/register', {
    name: 'Duplicate',
    email: 'rahul.student@campus.com',
    password: 'pass123',
  });
  check('Reject duplicate email', r.status === 409);

  // --- 3. Login ---
  console.log('\n3. LOGIN');
  r = await request('POST', '/api/auth/login', {
    email: 'priya.faculty@campus.com',
    password: 'faculty123',
  });
  check('Faculty login', r.status === 200 && r.body.token);

  r = await request('POST', '/api/auth/login', {
    email: 'rahul.student@campus.com',
    password: 'wrongpassword',
  });
  check('Reject wrong password', r.status === 401);

  // --- 4. Mark attendance ---
  console.log('\n4. MARK ATTENDANCE');

  // No token → 401
  r = await request('POST', '/api/attendance', {
    student: student1Id,
    date: '2026-11-20',
    status: 'Present',
  });
  check('Reject without token', r.status === 401);

  // Student tries to mark → 403
  r = await request(
    'POST',
    '/api/attendance',
    { student: student1Id, date: '2026-11-20', status: 'Present' },
    student1Token
  );
  check('Student cannot mark attendance', r.status === 403);

  // Faculty marks student 1 present
  r = await request(
    'POST',
    '/api/attendance',
    { student: student1Id, date: '2026-11-20', status: 'Present' },
    facultyToken
  );
  check('Faculty marks student 1 present on Nov 20', r.status === 201, JSON.stringify(r.body));
  const record1Id = r.body.data?._id;

  // Faculty marks student 1 absent on different date
  r = await request(
    'POST',
    '/api/attendance',
    { student: student1Id, date: '2026-11-21', status: 'Absent' },
    facultyToken
  );
  check('Faculty marks student 1 absent on Nov 21', r.status === 201);

  // Faculty marks student 1 present on another date
  r = await request(
    'POST',
    '/api/attendance',
    { student: student1Id, date: '2026-11-22', status: 'Present' },
    facultyToken
  );
  check('Faculty marks student 1 present on Nov 22', r.status === 201);

  // Duplicate: same student + same date
  r = await request(
    'POST',
    '/api/attendance',
    { student: student1Id, date: '2026-11-20', status: 'Absent' },
    facultyToken
  );
  check('Reject duplicate attendance', r.status === 409);

  // Invalid status value
  r = await request(
    'POST',
    '/api/attendance',
    { student: student1Id, date: '2026-11-23', status: 'Late' },
    facultyToken
  );
  check('Reject invalid status "Late"', r.status === 400);

  // Mark attendance for student 2
  r = await request(
    'POST',
    '/api/attendance',
    { student: student2Id, date: '2026-11-20', status: 'Present' },
    facultyToken
  );
  check('Faculty marks student 2 present', r.status === 201);

  // --- 5. Get attendance ---
  console.log('\n5. GET ATTENDANCE');

  // Faculty sees all records
  r = await request('GET', '/api/attendance', null, facultyToken);
  check('Faculty sees all records', r.status === 200 && r.body.count === 4, `count=${r.body.count}`);

  // Student sees only own records
  r = await request('GET', '/api/attendance', null, student1Token);
  check('Student 1 sees only own records', r.status === 200 && r.body.count === 3, `count=${r.body.count}`);

  // Filter by status
  r = await request('GET', '/api/attendance?status=Present', null, facultyToken);
  check('Filter status=Present', r.status === 200 && r.body.count === 3, `count=${r.body.count}`);

  // Filter by date
  r = await request('GET', '/api/attendance?date=2026-11-20', null, facultyToken);
  check('Filter date=2026-11-20', r.status === 200 && r.body.count === 2, `count=${r.body.count}`);

  // --- 6. Update attendance ---
  console.log('\n6. UPDATE ATTENDANCE');

  r = await request(
    'PUT',
    `/api/attendance/${record1Id}`,
    { status: 'Absent' },
    facultyToken
  );
  check('Update status to Absent', r.status === 200 && r.body.data.status === 'Absent');

  // Invalid ID
  r = await request(
    'PUT',
    '/api/attendance/invalidid123',
    { status: 'Present' },
    facultyToken
  );
  check('Reject invalid record ID', r.status === 400);

  // Non-existent ID
  r = await request(
    'PUT',
    '/api/attendance/507f1f77bcf86cd799439011',
    { status: 'Present' },
    facultyToken
  );
  check('Reject non-existent record', r.status === 404);

  // --- 7. Attendance percentage & stats ---
  console.log('\n7. ATTENDANCE PERCENTAGE & STATS');

  // Attendance stats for dashboard
  r = await request('GET', '/api/attendance/stats', null, facultyToken);
  check('Faculty gets dashboard stats', r.status === 200 && r.body.data.totalStudents === 2, JSON.stringify(r.body.data));
  console.log(`     → Stats: ${r.body.data?.totalStudents} students, ${r.body.data?.totalAttendanceRecords} attendance records, rate: ${r.body.data?.overallPercentage}%`);

  r = await request(
    'GET',
    `/api/attendance/percentage/${student1Id}`,
    null,
    facultyToken
  );
  check(
    'Faculty gets student 1 percentage',
    r.status === 200 && r.body.data.totalClasses === 3,
    JSON.stringify(r.body.data)
  );
  console.log(`     → ${r.body.data?.presentClasses}/${r.body.data?.totalClasses} = ${r.body.data?.percentage}%`);

  // Student checks own percentage
  r = await request(
    'GET',
    `/api/attendance/percentage/${student1Id}`,
    null,
    student1Token
  );
  check('Student 1 checks own percentage', r.status === 200);

  // Student tries to check another student → 403
  r = await request(
    'GET',
    `/api/attendance/percentage/${student2Id}`,
    null,
    student1Token
  );
  check('Student 1 cannot check student 2 percentage', r.status === 403);

  // --- 8. User search, filter, pagination ---
  console.log('\n8. USER SEARCH, FILTER, PAGINATION');

  r = await request('GET', '/api/users', null, facultyToken);
  check('Get all users', r.status === 200 && r.body.count === 4, `count=${r.body.count}`);
  check('Pagination metadata present', r.body.pagination?.totalRecords === 4);
  check('Passwords not exposed', !r.body.data?.some((u) => u.password));

  // Search by name
  r = await request('GET', '/api/users?search=rahul', null, facultyToken);
  check('Search "rahul"', r.status === 200 && r.body.count === 1);

  // Search by email
  r = await request('GET', '/api/users?search=campus.com', null, facultyToken);
  check('Search "campus.com"', r.status === 200 && r.body.count === 4);

  // Filter by role
  r = await request('GET', '/api/users?role=student', null, facultyToken);
  check('Filter role=student', r.status === 200 && r.body.count === 2);

  r = await request('GET', '/api/users?role=faculty', null, facultyToken);
  check('Filter role=faculty', r.status === 200 && r.body.count === 1);

  // Combine search + role
  r = await request('GET', '/api/users?search=ananya&role=student', null, facultyToken);
  check('Search "ananya" + role=student', r.status === 200 && r.body.count === 1);

  // Pagination
  r = await request('GET', '/api/users?page=1&limit=2', null, facultyToken);
  check('Page 1, limit 2', r.status === 200 && r.body.count === 2 && r.body.pagination.hasNextPage === true);

  r = await request('GET', '/api/users?page=2&limit=2', null, facultyToken);
  check('Page 2, limit 2', r.status === 200 && r.body.count === 2 && r.body.pagination.hasPreviousPage === true);

  r = await request('GET', '/api/users?page=3&limit=2', null, facultyToken);
  check('Page 3, limit 2 (empty)', r.status === 200 && r.body.count === 0 && r.body.pagination.hasNextPage === false);

  // Invalid role
  r = await request('GET', '/api/users?role=superuser', null, facultyToken);
  check('Reject invalid role', r.status === 400);

  // No token
  r = await request('GET', '/api/users');
  check('Reject without token', r.status === 401);

  // --- 9. Delete attendance ---
  console.log('\n9. DELETE ATTENDANCE');

  r = await request('DELETE', `/api/attendance/${record1Id}`, null, facultyToken);
  check('Delete attendance record', r.status === 200);

  r = await request('DELETE', `/api/attendance/${record1Id}`, null, facultyToken);
  check('Delete same record again → 404', r.status === 404);

  // --- Summary ---
  console.log('\n========================================');
  console.log(` RESULTS: ${passed} passed, ${failed} failed`);
  console.log('========================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Test error:', err.message);
  process.exit(1);
});
