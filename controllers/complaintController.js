// controllers/complaintController.js
// --------------------------------------------------
// Complaint Controller
// --------------------------------------------------
// Students and faculty file complaints and track them.
// Admins view all complaints and update their status.
// --------------------------------------------------

const Complaint = require('../models/Complaint');

// POST /api/complaints  (Student / Faculty)
const createComplaint = async (req, res) => {
  try {
    const { title, description } = req.body;
    const complaint = await Complaint.create({
      title,
      description,
      raisedBy: req.user._id,
    });
    res.status(201).json({
      success: true,
      message: 'Complaint registered successfully',
      data: complaint,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error registering complaint',
      error: error.message,
    });
  }
};

// GET /api/complaints/me  (the logged-in user's own complaints)
const getMyComplaints = async (req, res) => {
  try {
    const data = await Complaint.find({ raisedBy: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, total: data.length, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching complaints',
      error: error.message,
    });
  }
};

// GET /api/complaints  (Admin) — filter by status, search, paginate
const getAllComplaints = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const total = await Complaint.countDocuments(filter);
    const data = await Complaint.find(filter)
      .populate('raisedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalPages = Math.ceil(total / limit);
    res.json({
      success: true,
      count: data.length,
      pagination: {
        totalRecords: total,
        currentPage: page,
        pageSize: limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching complaints',
      error: error.message,
    });
  }
};

// PATCH /api/complaints/:id/status  (Admin)
const updateComplaintStatus = async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, remarks: req.body.remarks || '' },
      { new: true, runValidators: true }
    );
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }
    res.json({ success: true, message: 'Complaint status updated', data: complaint });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error updating complaint',
      error: error.message,
    });
  }
};

module.exports = {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  updateComplaintStatus,
};
