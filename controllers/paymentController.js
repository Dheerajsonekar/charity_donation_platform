// controllers/paymentController.js
const razorpay = require("../config/razorpay");
const Campaign = require("../models/Campaign");
const User = require("../models/User");
const Payment = require("../models/Payment");
const crypto = require("crypto");

const generateReceiptPdf = require("../utils/generateReceiptPdf");
const{ sendEmail }= require("../utils/sendEmail");

exports.createOrder = async (req, res) => {
  try {
    const { campaignId, amount } = req.body;

    const campaign = await Campaign.findByPk(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    const options = {
      amount: amount*100,
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
      Number(campaign.amountRaised || 0) + Number(amount) ;
    await campaign.save();

    const payment = await Payment.create({
      userId: req.user.userId,
      campaignId,
      amount: Number(amount) ,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });


    const html = `
      <h3>Thank you for your donation!</h3>
      <p>You donated ₹${amount} to <strong>${campaign.campaignTitle}</strong>.</p>
      <p>Payment order id: ${razorpay_order_id}</p>
      <p>Payment id: ${razorpay_payment_id}</p>
      <p>Date: ${new Date(payment.createdAt).toLocaleString()}</p>
    `;
     const user = await User.findByPk(req.user.userId);
     console.log("user.email", user.email);
    await sendEmail(user.email, 'Donation Confirmation', html);

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
      attributes: ['id', 'userId', 'campaignId', 'amount', 'createdAt', 'receiptUrl', 'impactReportUrl'] // ✅ include this!
    });

    res.status(200).json(payments);
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
