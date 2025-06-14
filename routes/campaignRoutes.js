const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');


const auth = require('../middlewares/auth');
const {upload} = require('../middlewares/upload');

router.post('/start/campaigns', auth, upload.single('campaign-image'), campaignController.createCampaign);
router.get('/campaigns', campaignController.getAllCampaigns);
router.get('/my-campaigns', auth, campaignController.getMyCampaigns);
router.get('/campaigns/:campaignId/details', auth, campaignController.getCampaignDetails);
router.put('/campaigns/:campaignId/payments/:paymentId/impact-report', auth, upload.single('impactReportPdf'), campaignController.submitImpactReport);


module.exports = router;