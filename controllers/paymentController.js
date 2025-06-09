// controllers/paymentController.js
const razorpay = require("../config/razorpay");
const Campaign = require("../models/Campaign");
const User = require("../models/User");
const Payment = require("../models/Payment");
const crypto = require("crypto");

const generateReceiptPdf = require("../utils/generateReceiptPdf");

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
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
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

    campaign.amountRaised =
      Number(campaign.amountRaised || 0) + Number(amount) / 100;
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

exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      where: { userId: req.user.userId },
      include: [{ model: Campaign, attributes: ["campaignTitle"] }],
    });

    res.json(payments);
  } catch (err) {
    console.error("Get payments error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.generateReceipt = async (req, res) => {
  try {
    const donationId = req.params.id;
    const donation = await Payment.findByPk(donationId, {
      include: [
        { model: User },
        { model: Campaign, attributes: ["campaignTitle"] },
      ],
    });

    console.log("Donation:", donation);
    if (!donation)
      return res.status(404).json({ message: "Donation not found" });

    if (!donation.user) {
      return res.status(500).json({
        message: "Donation User not found for this donation",
        donation,
      });
    }

    // If receipt URL already exists, return it
    if (donation.receiptUrl)
      return res.json({ receiptUrl: donation.receiptUrl });

    const pdfUrl = await generateReceiptPdf(donation, donation.user);

    // Save receipt URL to DB
    donation.receiptUrl = pdfUrl;
    await donation.save();

    res.json({ receiptUrl: pdfUrl });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to generate receipt", error: error.message });
  }
};
