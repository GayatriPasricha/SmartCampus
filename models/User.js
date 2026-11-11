// models/User.js
// --------------------------------------------------
// User Model
// --------------------------------------------------
// Defines the schema for all users in the system:
// students, faculty, and admins.
//
// This model is used by:
//   - Auth module (registration, login)
//   - Attendance module (referencing students/faculty)
//   - User search module (searching by name/email)
// --------------------------------------------------

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // Full name of the user
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    // Email address — used for login, must be unique
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },

    // Hashed password — never send this in API responses
    password: {
      type: String,
      required: [true, 'Password is required'],
    },

    // Role determines what a user can do in the system
    // "student" — can view own attendance, submit assignments
    // "faculty" — can mark attendance, create assignments
    // "admin"   — can manage everything
    role: {
      type: String,
      enum: ['student', 'faculty', 'admin'],
      default: 'student',
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
