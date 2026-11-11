// models/Attendance.js
// --------------------------------------------------
// Attendance Model
// --------------------------------------------------
// Stores one attendance record per student per date.
//
// Each record says:
//   "Student X was Present/Absent on Date Y,
//    marked by Faculty Z"
//
// A compound unique index on (student + date)
// prevents duplicate records for the same student
// on the same day.
// --------------------------------------------------

const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    // Reference to the student (links to User collection)
    // mongoose.Schema.Types.ObjectId tells MongoDB this field
    // stores the _id of a document from the "User" collection
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
    },

    // The date of attendance (stored as a Date object)
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },

    // Attendance status — only "Present" or "Absent" allowed
    status: {
      type: String,
      enum: ['Present', 'Absent'],
      required: [true, 'Attendance status is required'],
    },

    // Reference to the faculty member who marked this attendance
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty ID (markedBy) is required'],
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,
  }
);

// --------------------------------------------------
// Compound Unique Index
// --------------------------------------------------
// This prevents duplicate attendance for the same
// student on the same date. If faculty tries to mark
// attendance for Student A on 2026-11-24 twice,
// MongoDB will reject the second one.
// --------------------------------------------------
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
