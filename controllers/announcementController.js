const Announcement = require('../models/Announcement');

// POST /api/announcements (Faculty/Admin)
const createAnnouncement = async (req, res) => {
  try {
    const { title, message, audience } = req.body;
    const announcement = await Announcement.create({ title, message, audience, postedBy: req.user._id });
    const populated = await announcement.populate('postedBy', 'name role');
    res.status(201).json({ success: true, message: 'Announcement posted successfully', data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error creating announcement', error: error.message });
  }
};

// GET /api/announcements (any logged-in user)
const getAnnouncements = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
    const filter = {};

    if (req.user.role !== 'admin') {
      filter.audience = { $in: ['all', req.user.role] };
    } else if (req.query.audience) {
      filter.audience = req.query.audience;
    }

    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { message: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const total = await Announcement.countDocuments(filter);
    const data = await Announcement.find(filter)
      .populate('postedBy', 'name role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalPages = Math.ceil(total / limit);
    res.json({
      success: true,
      count: data.length,
      pagination: { totalRecords: total, currentPage: page, pageSize: limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
      data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching announcements', error: error.message });
  }
};

// PUT /api/announcements/:id (poster or Admin)
const updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
    const isOwner = announcement.postedBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the poster or an admin can edit this announcement' });
    }
    ['title', 'message', 'audience'].forEach((f) => {
      if (req.body[f] !== undefined) announcement[f] = req.body[f];
    });
    await announcement.save();
    res.json({ success: true, message: 'Announcement updated', data: announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating announcement', error: error.message });
  }
};

// DELETE /api/announcements/:id (poster or Admin)
const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
    const isOwner = announcement.postedBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the poster or an admin can delete this announcement' });
    }
    await announcement.deleteOne();
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting announcement', error: error.message });
  }
};

module.exports = { createAnnouncement, getAnnouncements, updateAnnouncement, deleteAnnouncement };
