// middleware/authMiddleware.js
// --------------------------------------------------
// Authentication Middleware — protect()
// --------------------------------------------------
// This middleware runs BEFORE your route handler.
// It checks if the user sent a valid JWT token.
//
// How it works:
//   1. Client sends request with header:
//      Authorization: Bearer <token>
//   2. This middleware extracts the token
//   3. Verifies it using the JWT_SECRET from .env
//   4. Finds the user in the database
//   5. Attaches the user to req.user
//   6. Calls next() to let the request continue
//
// If the token is missing or invalid → 401 Unauthorized
// --------------------------------------------------

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    // Check if the Authorization header exists and starts with "Bearer"
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // "Bearer eyJhbGci..." → split by space → take the second part
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token was found, the user is not logged in
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — no token provided',
      });
    }

    // Verify the token using our secret key
    // If the token is expired or tampered with, this throws an error
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user in the database using the ID stored in the token
    // .select('-password') means don't include the password field
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — user not found',
      });
    }

    // Attach the user to the request object
    // Now every controller can access req.user
    req.user = user;

    // Move on to the next middleware or the controller
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized — invalid token',
    });
  }
};

module.exports = { protect };
