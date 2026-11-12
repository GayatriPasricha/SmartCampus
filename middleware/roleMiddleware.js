// middleware/roleMiddleware.js
// --------------------------------------------------
// Role-Based Authorization Middleware — authorize()
// --------------------------------------------------
// This middleware runs AFTER authMiddleware (protect).
// By this point, req.user already exists.
//
// It checks if the logged-in user's role is in the
// list of allowed roles for this route.
//
// Usage in routes:
//   router.post('/', protect, authorize('faculty', 'admin'), handler)
//
// This means: only faculty and admin can access this route.
// If a student tries → 403 Forbidden.
//
// How it works:
//   authorize('faculty', 'admin') returns a function.
//   That function checks if req.user.role is in the list.
// --------------------------------------------------

// This is a "higher-order function" — a function that returns a function.
// We do this so we can pass the allowed roles as arguments.
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if the user's role is in the allowed list
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied — role "${req.user.role}" is not authorized for this action`,
      });
    }

    // Role is allowed, continue
    next();
  };
};

module.exports = { authorize };
