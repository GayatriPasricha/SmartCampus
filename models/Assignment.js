// models/Assignment.js
// --------------------------------------------------
// Assignment Model
// --------------------------------------------------
// Defines the schema for coursework assignments
// created by faculty or administrator users.
//
// Key fields:
//   - title: Brief descriptive title of the assignment
//   - description: Full instructions / questions
//   - subject: Course or subject name (e.g. CS101, Data Structures)
//   - dueDate: Deadline timestamp for submission
//   - createdBy: Reference to the User (faculty) who posted it
// --------------------------------------------------

const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Assignment description is required'],
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
      default: 'General',
      maxlength: [100, 'Subject name cannot exceed 100 characters'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty creator reference is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Index to quickly sort/query assignments by due date and creation
assignmentSchema.index({ dueDate: 1 });
assignmentSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
