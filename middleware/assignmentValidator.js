// middleware/assignmentValidator.js
// --------------------------------------------------
// Dedicated Validation Middleware for Assignments & Submissions
// --------------------------------------------------
// Uses express-validator to validate incoming request bodies,
// URL route parameters, and query strings.
//
// Does NOT touch or alter the shared team error/validation
// middleware files.
// --------------------------------------------------

const { body, param, query, validationResult } = require('express-validator');

// Helper to inspect validation result and return standard 400 Bad Request
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

// --------------------------------------------------
// Assignment Validators
// --------------------------------------------------

// POST /api/assignments
const validateCreateAssignment = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Assignment title is required')
    .isLength({ max: 150 })
    .withMessage('Title cannot exceed 150 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Assignment description is required'),

  body('subject')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Subject cannot exceed 100 characters'),

  body('dueDate')
    .notEmpty()
    .withMessage('Due date is required')
    .isISO8601()
    .withMessage('Due date must be a valid date format (ISO 8601)'),

  handleValidationErrors,
];

// PUT /api/assignments/:id
const validateUpdateAssignment = [
  param('id')
    .isMongoId()
    .withMessage('Invalid assignment ID format'),

  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 150 })
    .withMessage('Title cannot exceed 150 characters'),

  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty'),

  body('subject')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Subject cannot exceed 100 characters'),

  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date format (ISO 8601)'),

  handleValidationErrors,
];

// Reusable Mongo ID validation for URL parameters (:id)
const validateMongoId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} format`),
  handleValidationErrors,
];

// --------------------------------------------------
// Submission Validators
// --------------------------------------------------

// POST /api/assignments/:id/submissions
const validateCreateSubmission = [
  param('id')
    .isMongoId()
    .withMessage('Invalid assignment ID format'),

  body('content')
    .trim()
    .notEmpty()
    .withMessage('Submission content or answer cannot be empty'),

  handleValidationErrors,
];

// --------------------------------------------------
// Query / Pagination Validators
// --------------------------------------------------
const validatePaginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),

  handleValidationErrors,
];

module.exports = {
  validateCreateAssignment,
  validateUpdateAssignment,
  validateMongoId,
  validateCreateSubmission,
  validatePaginationQuery,
};
