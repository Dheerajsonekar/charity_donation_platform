// controllers/paymentController.js
const razorpay = require("../config/razorpay");
const Campaign = require("../models/Campaign");
const User = require("../models/User");
const Payment = require("../models/Payment");
const crypto = require("crypto");

exports.createOrder = async (req, res) => {
  try {
    const { campaignId, amount } = req.body;

    const campaign = await Campaign.findByPk(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    const options = {
      amount: amount,
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    const user = await User.findByPk(req.user.userId);

    res.json({
      id: order.id,
      amount: order.amount,
      user: {
        name: user.name,
        email: user.email,
      },
       razorpayKeyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { paymentResponse, campaignId, amount } = req.body;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      paymentResponse;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    const campaign = await Campaign.findByPk(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    campaign.amountRaised = Number(campaign.amountRaised || 0) + Number(amount) / 100;
    await campaign.save();

    await Payment.create({
      userId: req.user.userId,
      campaignId,
      amount: Number(amount) / 100,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    

    res.json({ success: true });
  } catch (err) {
    console.error("Verify payment error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
