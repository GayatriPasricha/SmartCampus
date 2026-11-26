// middleware/complaintValidator.js
// --------------------------------------------------
// Validation for complaint requests (express-validator)
// --------------------------------------------------

const { body, param, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const validateCreateComplaint = [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 150 }).withMessage('Title cannot exceed 150 characters'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  handleValidationErrors,
];

const validateComplaintStatus = [
  param('id').isMongoId().withMessage('Invalid complaint id'),
  body('status').isIn(['Pending', 'In Progress', 'Resolved'])
    .withMessage('Status must be Pending, In Progress or Resolved'),
  body('remarks').optional().trim(),
  handleValidationErrors,
];

module.exports = { validateCreateComplaint, validateComplaintStatus };
