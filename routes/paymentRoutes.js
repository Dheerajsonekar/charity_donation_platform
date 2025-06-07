// routes/payments.js
const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const auth = require("../middlewares/auth");

router.post("/create-order", auth, paymentController.createOrder);
router.post("/verify", auth, paymentController.verifyPayment);

module.exports = router;
