// middleware/errorMiddleware.js
// --------------------------------------------------
// Global Error-Handling Middleware
// --------------------------------------------------
// Catches all errors passed via next(err) and
// returns a consistent JSON error response. Handles
// known error types (validation, auth, not found)
// and unexpected server errors.
// --------------------------------------------------

// 404 — runs when no route matched the request
const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.method} ${req.originalUrl}`));
};

// Central handler — every error ends up here
const errorHandler = (err, req, res, next) => {
  let status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Server error';

  // Mongoose schema validation failed
  if (err.name === 'ValidationError' && err.errors) {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }
  // Invalid ObjectId such as /api/complaints/123
  else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }
  // Duplicate key, e.g. an email that already exists
  else if (err.code === 11000) {
    status = 409;
    message = `Duplicate value for: ${Object.keys(err.keyValue || {}).join(', ')}`;
  }
  // JWT problems
  else if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expired, please log in again';
  }
  // Broken JSON in the request body
  else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON in request body';
  }

  res.status(status).json({
    success: false,
    message,
    // Show the stack trace only while developing
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
