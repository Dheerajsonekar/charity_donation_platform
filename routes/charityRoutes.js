const express = require('express');
const router = express.Router();

const charityController  = require('../controllers/charityController');
const auth = require('../middlewares/auth');

router.post('/addcharity',auth, charityController.addCharity);
router.put('/updatecharity/:charityId', auth, charityController.updateCharity);
router.get('/getcharities', auth, charityController.getCharities);

module.exports = router;