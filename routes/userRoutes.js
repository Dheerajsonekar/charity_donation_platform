const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const auth = require('../middlewares/auth');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/user/profile', auth,  userController.getUserProfile);
router.put('/user/update', auth, userController.updateProfile);

module.exports = router;