// routes/complaintRoutes.js
// --------------------------------------------------
// Complaint Routes
// --------------------------------------------------
//   POST  /            → Register complaint (Student/Faculty)
//   GET   /me          → My complaints
//   GET   /            → All complaints with filter (Admin)
//   PATCH /:id/status  → Update status and remarks (Admin)
// --------------------------------------------------

const express = require('express');
const router = express.Router();

const {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  updateComplaintStatus,
} = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  validateCreateComplaint,
  validateComplaintStatus,
} = require('../middleware/complaintValidator');

router.post('/', protect, authorize('student', 'faculty'), validateCreateComplaint, createComplaint);
router.get('/me', protect, getMyComplaints);
router.get('/', protect, authorize('admin'), getAllComplaints);
router.patch('/:id/status', protect, authorize('admin'), validateComplaintStatus, updateComplaintStatus);

module.exports = router;
