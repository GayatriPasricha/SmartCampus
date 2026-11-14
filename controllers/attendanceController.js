// controllers/attendanceController.js
// --------------------------------------------------
// Attendance Controller
// --------------------------------------------------
// Contains all the business logic for attendance:
//   - markAttendance:  Create a new attendance record
//   - getAttendance:   Retrieve records with filters
//   - updateAttendance: Modify an existing record
//   - deleteAttendance: Remove a record
//   - getAttendancePercentage: Calculate % for a student
//
// Each function receives (req, res) from Express.
//   req = the incoming request (body, params, query)
//   res = the response we send back to the client
// --------------------------------------------------

const Attendance = require('../models/Attendance');
const User = require('../models/User');

// -------------------------------------------------
// 1. MARK ATTENDANCE
// -------------------------------------------------
// Called when: POST /api/attendance
// Who can call: Faculty or Admin
// What it does:
//   - Takes student ID, date, and status from req.body
//   - Sets markedBy to the logged-in user's ID
//   - Checks for duplicate (same student + same date)
//   - Saves the record to the database
// -------------------------------------------------
const markAttendance = async (req, res) => {
  try {
    const { student, date, status } = req.body;

    // Validate required fields
    if (!student || !date || !status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide student, date, and status',
      });
    }

    // Validate status value
    if (!['Present', 'Absent'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "Present" or "Absent"',
      });
    }

    // Check if the student exists and is actually a student
    const studentUser = await User.findById(student);
    if (!studentUser) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }
    if (studentUser.role !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'The given user ID does not belong to a student',
      });
    }

    // Check for duplicate: same student + same date
    const existingRecord = await Attendance.findOne({
      student,
      date: new Date(date),
    });
    if (existingRecord) {
      return res.status(409).json({
        success: false,
        message: 'Attendance already marked for this student on this date',
      });
    }

    // Create the attendance record
    // req.user._id comes from the auth middleware (the logged-in faculty)
    const attendance = await Attendance.create({
      student,
      date: new Date(date),
      status,
      markedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// -------------------------------------------------
// 2. GET ATTENDANCE
// -------------------------------------------------
// Called when: GET /api/attendance
// Who can call:
//   - Student → sees only their own records
//   - Faculty/Admin → sees all, can filter
// Query parameters (all optional):
//   ?student=<userId>  → filter by student
//   ?date=2026-11-24   → filter by exact date
//   ?status=Present    → filter by status
// -------------------------------------------------
const getAttendance = async (req, res) => {
  try {
    // Start building a filter object
    // This object tells MongoDB "find records matching these conditions"
    const filter = {};

    // If the logged-in user is a student, they can only see their own records
    if (req.user.role === 'student') {
      filter.student = req.user._id;
    }

    // If a student filter is passed in the query and user is not a student
    if (req.query.student && req.user.role !== 'student') {
      filter.student = req.query.student;
    }

    // Filter by date if provided
    if (req.query.date) {
      filter.date = new Date(req.query.date);
    }

    // Filter by status if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Find matching records and populate student & markedBy names
    // .populate() replaces the ObjectId with the actual user document
    // "name email" means only include those fields (not password)
    const records = await Attendance.find(filter)
      .populate('student', 'name email')
      .populate('markedBy', 'name email')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// -------------------------------------------------
// 3. UPDATE ATTENDANCE
// -------------------------------------------------
// Called when: PUT /api/attendance/:id
// Who can call: Faculty or Admin
// What it does:
//   - Finds the record by its MongoDB _id
//   - Updates the status (and optionally the date)
//   - Returns the updated record
// -------------------------------------------------
const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, date } = req.body;

    // Validate status if provided
    if (status && !['Present', 'Absent'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "Present" or "Absent"',
      });
    }

    // Build the update object — only include fields that were sent
    const updateData = {};
    if (status) updateData.status = status;
    if (date) updateData.date = new Date(date);

    // findByIdAndUpdate finds the document and updates it in one step
    // { new: true } means return the updated document (not the old one)
    // { runValidators: true } means check schema rules on the new values
    const attendance = await Attendance.findByIdAndUpdate(id, updateData, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Attendance updated successfully',
      data: attendance,
    });
  } catch (error) {
    // Handle invalid MongoDB ObjectId format
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance record ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// -------------------------------------------------
// 4. DELETE ATTENDANCE
// -------------------------------------------------
// Called when: DELETE /api/attendance/:id
// Who can call: Faculty or Admin
// What it does:
//   - Finds the record by its MongoDB _id
//   - Deletes it from the database
// -------------------------------------------------
const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const attendance = await Attendance.findByIdAndDelete(id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully',
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance record ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// -------------------------------------------------
// 5. GET ATTENDANCE PERCENTAGE
// -------------------------------------------------
// Called when: GET /api/attendance/percentage/:studentId
// Who can call:
//   - Student → only their own percentage
//   - Faculty/Admin → any student's percentage
// Formula: (Present days / Total recorded days) × 100
// -------------------------------------------------
const getAttendancePercentage = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Students can only check their own percentage
    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own attendance percentage',
      });
    }

    // Check if the student exists
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Count total attendance records for this student
    const totalRecords = await Attendance.countDocuments({ student: studentId });

    // If no records exist, we can't calculate percentage
    if (totalRecords === 0) {
      return res.status(200).json({
        success: true,
        data: {
          student: student.name,
          totalClasses: 0,
          presentClasses: 0,
          percentage: 0,
          message: 'No attendance records found for this student',
        },
      });
    }

    // Count how many times the student was "Present"
    const presentRecords = await Attendance.countDocuments({
      student: studentId,
      status: 'Present',
    });

    // Calculate percentage
    const percentage = ((presentRecords / totalRecords) * 100).toFixed(2);

    res.status(200).json({
      success: true,
      data: {
        student: student.name,
        totalClasses: totalRecords,
        presentClasses: presentRecords,
        absentClasses: totalRecords - presentRecords,
        percentage: parseFloat(percentage),
      },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// -------------------------------------------------
// 6. GET ATTENDANCE & CAMPUS STATS (for Dashboard)
// -------------------------------------------------
// Called when: GET /api/attendance/stats
// Who can call: Any logged-in user
// What it returns:
//   - totalStudents: count of User docs with role 'student'
//   - totalAttendanceRecords: count of records (scoped to user if student)
//   - presentRecords: count of Present records
//   - absentRecords: count of Absent records
//   - overallPercentage: attendance rate
// -------------------------------------------------
const getAttendanceStats = async (req, res) => {
  try {
    const isStudent = req.user.role === 'student';
    const filter = isStudent ? { student: req.user._id } : {};

    const [totalStudents, totalAttendanceRecords, presentRecords] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Attendance.countDocuments(filter),
      Attendance.countDocuments({ ...filter, status: 'Present' }),
    ]);

    const absentRecords = totalAttendanceRecords - presentRecords;
    const overallPercentage = totalAttendanceRecords > 0
      ? parseFloat(((presentRecords / totalAttendanceRecords) * 100).toFixed(2))
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalAttendanceRecords,
        presentRecords,
        absentRecords,
        overallPercentage,
        userRole: req.user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Export all functions so routes can use them
module.exports = {
  markAttendance,
  getAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendancePercentage,
  getAttendanceStats,
};
