// models/Complaint.js
// --------------------------------------------------
// Complaint Model
// --------------------------------------------------
// A complaint is raised by a student or faculty member
// and moves through: Pending → In Progress → Resolved.
// Admins update the status and add remarks.
// --------------------------------------------------

const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Resolved'],
      default: 'Pending',
    },
    // Note added by the admin when the status changes
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
