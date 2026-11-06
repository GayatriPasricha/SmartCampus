// models/Attendance.js
// --------------------------------------------------
// Attendance Model
// --------------------------------------------------
// Defines the Mongoose schema and model for tracking
// student attendance. Fields may include student
// reference, course/subject, date, status (present/
// absent/late), and marked-by reference.
// --------------------------------------------------

const mongoose = require('mongoose');

// TODO: Define Attendance schema and export model

module.exports = mongoose.model('Attendance', new mongoose.Schema({}));
