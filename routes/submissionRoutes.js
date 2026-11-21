// routes/submissionRoutes.js
// --------------------------------------------------
// Submission Routes
// --------------------------------------------------
// Maps direct submission endpoints to controller functions.
//
// Routes:
//   GET /my → Logged-in student views their own submission history
// --------------------------------------------------

const express = require('express');
const router = express.Router();

const { getMySubmissions } = require('../controllers/assignmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// GET /api/submissions/my
// Only authenticated students can access their personal submission records
router.get('/my', protect, authorize('student'), getMySubmissions);

module.exports = router;
