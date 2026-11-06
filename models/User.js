// models/User.js
// --------------------------------------------------
// User Model
// --------------------------------------------------
// Defines the Mongoose schema and model for users
// (students, faculty, and admins). Fields may include
// name, email, password (hashed), role, department,
// enrollment number, and timestamps.
// --------------------------------------------------

const mongoose = require('mongoose');

// TODO: Define User schema and export model

module.exports = mongoose.model('User', new mongoose.Schema({}));
