const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middlewares/auth');

// List campaigns by status (pending/approved/rejected)
router.get('/admin/campaigns/:status', auth, adminController.getCampaignsByStatus);
router.get('/admin/charities/:status', auth, adminController.getCharitiesByStatus);

// Update campaign status
router.put('/admin/campaign/:status/:id', auth, adminController.updateCampaignStatus);
router.put('/admin/charity/:status/:id', auth, adminController.updateCharityStatus);

router.get('/admin/users', auth, adminController.getAllUsers);
router.put('/admin/user/:id/status', auth, adminController.updateUserStatus);
router.delete('/admin/user/:id', auth, adminController.deleteUser);




module.exports = router;
