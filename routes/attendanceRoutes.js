// routes/attendanceRoutes.js
// --------------------------------------------------
// Attendance Routes
// --------------------------------------------------
// Maps URL endpoints to controller functions.
//
// How routing works:
//   1. A request comes in (e.g., POST /api/attendance)
//   2. server.js sends it here because of:
//      app.use('/api/attendance', attendanceRoutes)
//   3. This file matches the remaining path (e.g., '/')
//      to the right controller function
//   4. Middleware runs BEFORE the controller:
//      auth → checks JWT token
//      role → checks if user has permission
//
// Routes:
//   POST   /                     → Mark attendance
//   GET    /                     → View attendance records
//   PUT    /:id                  → Update a record
//   DELETE /:id                  → Delete a record
//   GET    /percentage/:studentId → Get attendance %
// --------------------------------------------------

const express = require('express');
const router = express.Router();

// Import controller functions
const {
  markAttendance,
  getAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendancePercentage,
  getAttendanceStats,
} = require('../controllers/attendanceController');

// Import middleware
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// --------------------------------------------------
// Define Routes
// --------------------------------------------------

// GET /api/attendance/stats
// → Dashboard statistics endpoint (total students, records, % rate)
router.get('/stats', protect, getAttendanceStats);

// GET /api/attendance/percentage/:studentId
// → Must be ABOVE the generic '/' routes, otherwise
//   Express would try to match "percentage" as an :id
// → Any logged-in user can access (students restricted in controller)
router.get('/percentage/:studentId', protect, getAttendancePercentage);

// POST /api/attendance
// → Only faculty and admin can mark attendance
router.post('/', protect, authorize('faculty', 'admin'), markAttendance);

// GET /api/attendance
// → Any logged-in user (students see only their own in controller)
router.get('/', protect, getAttendance);

// PUT /api/attendance/:id
// → Only faculty and admin can update
router.put('/:id', protect, authorize('faculty', 'admin'), updateAttendance);

// DELETE /api/attendance/:id
// → Only faculty and admin can delete
router.delete('/:id', protect, authorize('faculty', 'admin'), deleteAttendance);

module.exports = router;
