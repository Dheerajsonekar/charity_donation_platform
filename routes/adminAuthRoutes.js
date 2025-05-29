const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/adminAuthController');

router.post('/admin/register', adminAuthController.register);
router.post('/admin/login', adminAuthController.login);

module.exports = router;
