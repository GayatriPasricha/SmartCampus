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

const validateCreateAnnouncement = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 150 }).withMessage('Title cannot exceed 150 characters'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('audience').optional().isIn(['all', 'student', 'faculty']).withMessage('Audience must be all, student or faculty'),
  handleValidationErrors,
];

const validateUpdateAnnouncement = [
  param('id').isMongoId().withMessage('Invalid announcement id'),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 150 }).withMessage('Title cannot exceed 150 characters'),
  body('message').optional().trim().notEmpty().withMessage('Message cannot be empty'),
  body('audience').optional().isIn(['all', 'student', 'faculty']).withMessage('Audience must be all, student or faculty'),
  handleValidationErrors,
];

const validateAnnouncementId = [
  param('id').isMongoId().withMessage('Invalid announcement id'),
  handleValidationErrors,
];

module.exports = { validateCreateAnnouncement, validateUpdateAnnouncement, validateAnnouncementId };
