const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middlewares/auth');

// List campaigns by status (pending/approved/rejected)
router.get('/admin/campaigns/:status', auth, adminController.getCampaignsByStatus);

// Update campaign status
router.put('/admin/campaign/:status/:id', auth, adminController.updateCampaignStatus);

module.exports = router;
