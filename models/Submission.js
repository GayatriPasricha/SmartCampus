// models/Submission.js
// --------------------------------------------------
// Submission Model
// --------------------------------------------------
// Stores one submission per student per assignment.
//
// Key fields:
//   - assignment: Reference to the Assignment document
//   - student: Reference to the User (student) document
//   - content: Submission text or solution answer
//   - submittedAt: Exact server-side submission timestamp
//   - isLate: Boolean flag computed on server based on dueDate
//   - grade: Optional grade assigned by faculty
//   - feedback: Optional feedback comments from faculty
//
// A compound unique index on (assignment + student) prevents
// duplicate submissions by the same student for the same assignment.
// --------------------------------------------------

const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: [true, 'Assignment reference is required'],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
    },
    content: {
      type: String,
      required: [true, 'Submission content is required'],
      trim: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    isLate: {
      type: Boolean,
      default: false,
      required: true,
    },
    grade: {
      type: String,
      trim: true,
      default: '',
    },
    feedback: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: A student can only have one submission per assignment
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

// Secondary index for fast lookup of a student's submission history
submissionSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model('Submission', submissionSchema);
