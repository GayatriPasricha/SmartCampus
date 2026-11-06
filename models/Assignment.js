// models/Assignment.js
// --------------------------------------------------
// Assignment Model
// --------------------------------------------------
// Defines the Mongoose schema and model for
// assignments created by faculty. Fields may include
// title, description, course/subject, due date,
// created-by reference, and timestamps.
// --------------------------------------------------

const mongoose = require('mongoose');

// TODO: Define Assignment schema and export model

module.exports = mongoose.model('Assignment', new mongoose.Schema({}));
