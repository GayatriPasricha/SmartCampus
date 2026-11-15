// routes/userRoutes.js
// --------------------------------------------------
// User Routes
// --------------------------------------------------
// Maps URL endpoints to user controller functions.
//
// Currently supports:
//   GET /api/users → Search, filter, and paginate users
//
// Query parameters:
//   ?search=rahul      → partial match on name or email
//   ?role=student      → filter by role
//   ?page=1&limit=10   → pagination
//
// All query params are optional and can be combined.
// --------------------------------------------------

const express = require('express');
const router = express.Router();

// Import controller
const { getUsers } = require('../controllers/userController');

// Import middleware
const { protect } = require('../middleware/authMiddleware');

// GET /api/users → Any logged-in user can search
router.get('/', protect, getUsers);

module.exports = router;
