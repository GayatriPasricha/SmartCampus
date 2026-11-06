// models/Announcement.js
// --------------------------------------------------
// Announcement Model
// --------------------------------------------------
// Defines the Mongoose schema and model for campus
// announcements. Fields may include title, message,
// target audience (all/students/faculty), posted-by
// reference, and timestamps.
// --------------------------------------------------

const mongoose = require('mongoose');

// TODO: Define Announcement schema and export model

module.exports = mongoose.model('Announcement', new mongoose.Schema({}));
