const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');

const auth = require('../middlewares/auth');

router.post('/start/campaigns', auth, campaignController.createCampaign);
router.get('/campaigns',auth, campaignController.getAllCampaigns);

module.exports = router;