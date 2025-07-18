
const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const auth = require("../middlewares/auth");

router.post("/create-order", auth, paymentController.createOrder);
router.post("/verify", auth, paymentController.verifyPayment);
router.get("/user/donations", auth, paymentController.getPayments);
router.get('/user/donations/:id/receipt', auth, paymentController.generateReceipt);

module.exports = router;
