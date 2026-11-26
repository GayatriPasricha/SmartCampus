const express = require('express');
const router = express.Router();

const { createAnnouncement, getAnnouncements, updateAnnouncement, deleteAnnouncement } = require('../controllers/announcementController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateCreateAnnouncement, validateUpdateAnnouncement, validateAnnouncementId } = require('../middleware/announcementValidator');

router.post('/', protect, authorize('faculty', 'admin'), validateCreateAnnouncement, createAnnouncement);
router.get('/', protect, getAnnouncements);
router.put('/:id', protect, authorize('faculty', 'admin'), validateUpdateAnnouncement, updateAnnouncement);
router.delete('/:id', protect, authorize('faculty', 'admin'), validateAnnouncementId, deleteAnnouncement);

module.exports = router;
