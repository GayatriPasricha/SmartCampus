// controllers/assignmentController.js
// --------------------------------------------------
// Assignment & Submission Controller
// --------------------------------------------------
// Manages assignment creation, retrieval, updates, and
// safe deletion, as well as student submissions with
// server-side deadline and late-flag tracking.
//
// Features:
//   - createAssignment: Faculty/Admin create new assignment
//   - getAssignments: Authenticated users browse assignments (with search & pagination)
//   - getAssignmentById: Retrieve single assignment details
//   - updateAssignment: Creator faculty or admin updates assignment
//   - deleteAssignment: Creator faculty or admin deletes assignment (safely preserving submissions)
//   - submitAssignment: Student submits work; server computes isLate against dueDate
//   - getAssignmentSubmissions: Faculty/Admin inspect submissions for an assignment
//   - getMySubmissions: Students view their own submission history
// --------------------------------------------------

const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');

// --------------------------------------------------
// 1. CREATE ASSIGNMENT
// --------------------------------------------------
// POST /api/assignments
// Access: Faculty or Admin
const createAssignment = async (req, res) => {
  try {
    const { title, description, subject, dueDate } = req.body;

    const assignment = await Assignment.create({
      title,
      description,
      subject: subject || 'General',
      dueDate: new Date(dueDate),
      createdBy: req.user._id,
    });

    const populated = await assignment.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: populated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error creating assignment',
      error: error.message,
    });
  }
};

// --------------------------------------------------
// 2. GET ALL ASSIGNMENTS (with search & pagination)
// --------------------------------------------------
// GET /api/assignments
// Access: Any Authenticated User
const getAssignments = async (req, res) => {
  try {
    const filter = {};

    // Search by title or subject
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { subject: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    // Filter by specific subject
    if (req.query.subject) {
      filter.subject = { $regex: req.query.subject, $options: 'i' };
    }

    // Pagination setup
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * safeLimit;

    const totalRecords = await Assignment.countDocuments(filter);

    const assignments = await Assignment.find(filter)
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(safeLimit);

    const totalPages = Math.ceil(totalRecords / safeLimit) || 1;

    res.status(200).json({
      success: true,
      count: assignments.length,
      pagination: {
        totalRecords,
        currentPage: page,
        pageSize: safeLimit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      data: assignments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error retrieving assignments',
      error: error.message,
    });
  }
};

// --------------------------------------------------
// 3. GET SINGLE ASSIGNMENT
// --------------------------------------------------
// GET /api/assignments/:id
// Access: Any Authenticated User
const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id).populate('createdBy', 'name email');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    res.status(200).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment ID format',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error retrieving assignment',
      error: error.message,
    });
  }
};

// --------------------------------------------------
// 4. UPDATE ASSIGNMENT
// --------------------------------------------------
// PUT /api/assignments/:id
// Access: Faculty Creator or Admin
const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, subject, dueDate } = req.body;

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    // Ownership check: must be admin or the faculty member who created it
    const isOwner = assignment.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied — you can only update assignments you created',
      });
    }

    // Apply updates
    if (title !== undefined) assignment.title = title;
    if (description !== undefined) assignment.description = description;
    if (subject !== undefined) assignment.subject = subject;
    if (dueDate !== undefined) assignment.dueDate = new Date(dueDate);

    await assignment.save();
    const populated = await assignment.populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Assignment updated successfully',
      data: populated,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment ID format',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error updating assignment',
      error: error.message,
    });
  }
};

// --------------------------------------------------
// 5. DELETE ASSIGNMENT (Safe with Submission Preservation)
// --------------------------------------------------
// DELETE /api/assignments/:id
// Access: Faculty Creator or Admin
// Safety: Blocks deletion if student submissions exist to preserve records.
const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    // Ownership check
    const isOwner = assignment.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied — you can only delete assignments you created',
      });
    }

    // SAFE APPROACH: Check if any student submissions exist
    const submissionCount = await Submission.countDocuments({ assignment: id });
    if (submissionCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete assignment: ${submissionCount} student submission(s) exist. Student academic records must be preserved.`,
      });
    }

    await Assignment.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully',
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment ID format',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error deleting assignment',
      error: error.message,
    });
  }
};

// --------------------------------------------------
// 6. SUBMIT ASSIGNMENT (Student Submission & Late Tracking)
// --------------------------------------------------
// POST /api/assignments/:id/submissions
// Access: Student Only
//
// Deadline & Late-Flag Tracking:
//   - Captures actual server timestamp (Date.now())
//   - Compares against assignment.dueDate
//   - Sets isLate = true if submitted after deadline, else false
//   - Disallows duplicate submissions by same student
// --------------------------------------------------
const submitAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    // Verify assignment exists
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    // Prevent duplicate submissions
    const existingSubmission = await Submission.findOne({
      assignment: id,
      student: req.user._id,
    });

    if (existingSubmission) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted this assignment. Duplicate submissions are not allowed.',
      });
    }

    // SERVER-SIDE DEADLINE CALCULATION
    // Strictly uses server clock and assignment due date
    const serverTimestamp = new Date();
    const deadline = new Date(assignment.dueDate);
    const isLate = serverTimestamp.getTime() > deadline.getTime();

    const submission = await Submission.create({
      assignment: id,
      student: req.user._id,
      content,
      submittedAt: serverTimestamp,
      isLate,
    });

    const populated = await submission.populate([
      { path: 'student', select: 'name email' },
      { path: 'assignment', select: 'title dueDate subject' },
    ]);

    res.status(201).json({
      success: true,
      message: isLate
        ? 'Assignment submitted successfully (Marked Late: past due date)'
        : 'Assignment submitted successfully (On Time)',
      data: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted this assignment.',
      });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment ID format',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error submitting assignment',
      error: error.message,
    });
  }
};

// --------------------------------------------------
// 7. GET ASSIGNMENT SUBMISSIONS (Faculty/Admin View)
// --------------------------------------------------
// GET /api/assignments/:id/submissions
// Access: Faculty or Admin
const getAssignmentSubmissions = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify assignment exists
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    const submissions = await Submission.find({ assignment: id })
      .populate('student', 'name email')
      .populate('assignment', 'title dueDate subject')
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment ID format',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error retrieving submissions',
      error: error.message,
    });
  }
};

// --------------------------------------------------
// 8. GET MY SUBMISSIONS (Student View)
// --------------------------------------------------
// GET /api/submissions/my
// Access: Student Only
const getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user._id })
      .populate('assignment', 'title description subject dueDate')
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error retrieving your submissions',
      error: error.message,
    });
  }
};

module.exports = {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getAssignmentSubmissions,
  getMySubmissions,
};
