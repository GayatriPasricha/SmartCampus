// controllers/userController.js
// --------------------------------------------------
// User Controller
// --------------------------------------------------
// Handles user search, filtering, and pagination.
//
// The main function here is getUsers(), which
// supports:
//   ?search=rahul      → search by name or email
//   ?role=student      → filter by role
//   ?page=1&limit=10   → pagination
//
// All three can be combined in one request:
//   GET /api/users?search=rahul&role=student&page=1&limit=10
//
// How the query building works:
//   1. Start with an empty filter {}
//   2. If "search" is provided → add name/email regex
//   3. If "role" is provided → add role condition
//   4. Use skip() and limit() for pagination
//   5. Never return password field
// --------------------------------------------------

const User = require('../models/User');

// -------------------------------------------------
// GET USERS (with search, filter, pagination)
// -------------------------------------------------
// Called when: GET /api/users
// Who can call: Any logged-in user (protected route)
// -------------------------------------------------
const getUsers = async (req, res) => {
  try {
    // ----- Step 1: Build the filter object -----
    const filter = {};

    // Search by name or email (case-insensitive partial match)
    // Example: ?search=rahul
    // This will match "Rahul Sharma", "rahul@email.com", etc.
    if (req.query.search) {
      // $or means "match ANY of these conditions"
      // $regex does pattern matching (like LIKE in SQL)
      // $options: 'i' means case-insensitive
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    // Filter by role
    // Example: ?role=student
    if (req.query.role) {
      const validRoles = ['student', 'faculty', 'admin'];
      if (!validRoles.includes(req.query.role.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role. Must be student, faculty, or admin',
        });
      }
      filter.role = req.query.role.toLowerCase();
    }

    // ----- Step 2: Pagination setup -----
    // parseInt converts string to number. "2" → 2
    // If not provided or invalid, use defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Validate: page and limit must be positive
    if (page < 1 || limit < 1) {
      return res.status(400).json({
        success: false,
        message: 'Page and limit must be positive numbers',
      });
    }

    // Cap the limit to prevent huge queries
    const safeLimit = Math.min(limit, 100);

    // skip = how many documents to skip before starting
    // Page 1 → skip 0, Page 2 → skip 10, Page 3 → skip 20
    const skip = (page - 1) * safeLimit;

    // ----- Step 3: Count total matching documents -----
    // We need this for pagination metadata
    const totalRecords = await User.countDocuments(filter);

    // ----- Step 4: Fetch the users -----
    // .select('-password') means "include everything EXCEPT password"
    // .sort({ createdAt: -1 }) means newest users first
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit);

    // ----- Step 5: Calculate pagination metadata -----
    const totalPages = Math.ceil(totalRecords / safeLimit);

    res.status(200).json({
      success: true,
      count: users.length,
      pagination: {
        totalRecords,
        currentPage: page,
        pageSize: safeLimit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  getUsers,
};
