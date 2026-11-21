// routes/assignmentRoutes.js
// --------------------------------------------------
// Assignment Routes
// --------------------------------------------------
// Maps assignment endpoints and nested assignment submission
// endpoints to their respective controller functions.
//
// Routes:
//   POST   /               → Create assignment (Faculty/Admin)
//   GET    /               → List assignments with search/pagination (Authenticated)
//   GET    /:id            → Get assignment details (Authenticated)
//   PUT    /:id            → Update assignment (Creator Faculty/Admin)
//   DELETE /:id            → Safe delete assignment (Creator Faculty/Admin)
//   POST   /:id/submissions → Submit assignment (Student)
//   GET    /:id/submissions → View submissions (Faculty/Admin)
// --------------------------------------------------

const express = require('express');
const router = express.Router();

const {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getAssignmentSubmissions,
} = require('../controllers/assignmentController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const {
  validateCreateAssignment,
  validateUpdateAssignment,
  validateMongoId,
  validateCreateSubmission,
  validatePaginationQuery,
} = require('../middleware/assignmentValidator');

// --------------------------------------------------
// Assignment Collection Routes
// --------------------------------------------------

// POST /api/assignments → Faculty/Admin create assignment
router.post(
  '/',
  protect,
  authorize('faculty', 'admin'),
  validateCreateAssignment,
  createAssignment
);

// GET /api/assignments → Any logged-in user can browse
router.get(
  '/',
  protect,
  validatePaginationQuery,
  getAssignments
);

// --------------------------------------------------
// Nested Submission Routes (Defined before generic parameter routes)
// --------------------------------------------------

// POST /api/assignments/:id/submissions → Students submit assignment
router.post(
  '/:id/submissions',
  protect,
  authorize('student'),
  validateCreateSubmission,
  submitAssignment
);

// GET /api/assignments/:id/submissions → Faculty/Admin view submissions
router.get(
  '/:id/submissions',
  protect,
  authorize('faculty', 'admin'),
  validateMongoId('id'),
  getAssignmentSubmissions
);

// --------------------------------------------------
// Parametric Assignment Routes (:id)
// --------------------------------------------------

// GET /api/assignments/:id → Any logged-in user view single assignment
router.get(
  '/:id',
  protect,
  validateMongoId('id'),
  getAssignmentById
);

// PUT /api/assignments/:id → Faculty creator or Admin update
router.put(
  '/:id',
  protect,
  authorize('faculty', 'admin'),
  validateUpdateAssignment,
  updateAssignment
);

// DELETE /api/assignments/:id → Faculty creator or Admin delete (preserved if submissions exist)
router.delete(
  '/:id',
  protect,
  authorize('faculty', 'admin'),
  validateMongoId('id'),
  deleteAssignment
);

module.exports = router;
