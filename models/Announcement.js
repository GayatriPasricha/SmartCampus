const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: [150, 'Title cannot exceed 150 characters'] },
    message: { type: String, required: [true, 'Message is required'], trim: true },
    audience: { type: String, enum: ['all', 'student', 'faculty'], default: 'all' },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);
