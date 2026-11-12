// routes/authRoutes.js
// --------------------------------------------------
// Authentication Routes (Minimal)
// --------------------------------------------------
// POST /api/auth/register → Create a new user
// POST /api/auth/login    → Login and get JWT token
//
// These are the minimum routes needed so that
// attendance and user-search can be tested with
// real JWT tokens.
// --------------------------------------------------

const express = require('express');
const router = express.Router();

const { register, login } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);

module.exports = router;
