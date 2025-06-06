const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');

const auth = require('../middlewares/auth');
const {upload} = require('../middlewares/upload');

router.post('/start/campaigns', auth, upload.single('campaign-image'), campaignController.createCampaign);
router.get('/campaigns',auth, campaignController.getAllCampaigns);

module.exports = router;