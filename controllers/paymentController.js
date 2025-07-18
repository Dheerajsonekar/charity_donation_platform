const razorpay = require("../config/razorpay");
const Campaign = require("../models/Campaign");
const User = require("../models/User");
const Payment = require("../models/Payment");
const crypto = require("crypto");

const generateReceiptPdf = require("../utils/generateReceiptPdf");
const { sendEmail, emailTemplates } = require("../utils/sendEmail");

exports.createOrder = async (req, res) => {
  try {
    const { campaignId, amount } = req.body;

    // Validate input
    if (!campaignId || !amount) {
      return res.status(400).json({ 
        success: false,
        error: "Campaign ID and amount are required" 
      });
    }

    if (amount < 1) {
      return res.status(400).json({ 
        success: false,
        error: "Amount must be at least ₹1" 
      });
    }

    const campaign = await Campaign.findByPk(campaignId);
    if (!campaign) {
      return res.status(404).json({ 
        success: false,
        error: "Campaign not found" 
      });
    }

    if (campaign.status !== 'approved') {
      return res.status(400).json({ 
        success: false,
        error: "Campaign is not approved for donations" 
      });
    }

    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: "INR",
      receipt: `receipt_${campaignId}_${Date.now()}`,
      notes: {
        campaignId: campaignId,
        userId: req.user.userId
      }
    };

    const order = await razorpay.orders.create(options);
    const user = await User.findByPk(req.user.userId);

    res.json({
      success: true,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      user: {
        name: user.name,
        email: user.email,
      },
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { paymentResponse, campaignId, amount } = req.body;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentResponse;

    // Validate input
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid payment response" 
      });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid payment signature" 
      });
    }

    const campaign = await Campaign.findByPk(campaignId);
    if (!campaign) {
      return res.status(404).json({ 
        success: false,
        error: "Campaign not found" 
      });
    }

    // Update campaign amount
    const donationAmount = Number(amount);
    campaign.amountRaised = Number(campaign.amountRaised || 0) + donationAmount;
    await campaign.save();

    // Create payment record
    const payment = await Payment.create({
      userId: req.user.userId,
      campaignId,
      amount: donationAmount,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    // Send confirmation email
    const user = await User.findByPk(req.user.userId);
    const emailContent = emailTemplates.donationReceived(
      user.name,
      campaign.campaignTitle,
      donationAmount,
      razorpay_payment_id
    );
    
    await sendEmail(user.email, 'Donation Confirmation - Thank You!', emailContent);

    res.json({ 
      success: true,
      message: "Payment verified successfully",
      payment: {
        id: payment.id,
        amount: payment.amount,
        paymentId: razorpay_payment_id
      }
    });
  } catch (err) {
    console.error("Verify payment error:", err);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      where: { userId: req.user.userId },
      include: [{ 
        model: Campaign, 
        attributes: ["id", "campaignTitle"] 
      }],
      attributes: ['id', 'userId', 'campaignId', 'amount', 'createdAt', 'receiptUrl', 'impactReportUrl'],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      payments: payments.map(payment => ({
        id: payment.id,
        campaignId: payment.campaignId,
        amount: payment.amount,
        createdAt: payment.createdAt,
        receiptUrl: payment.receiptUrl,
        impactReportUrl: payment.impactReportUrl,
        Campaign: payment.Campaign
      }))
    });
  } catch (err) {
    console.error("Get payments error:", err);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};

exports.generateReceipt = async (req, res) => {
  try {
    const donationId = req.params.id;
    const userId = req.user.userId;

    const donation = await Payment.findOne({
      where: { 
        id: donationId,
        userId: userId 
      },
      include: [
        { 
          model: User,
          attributes: ['id', 'name', 'email']
        },
        { 
          model: Campaign, 
          attributes: ["id", "campaignTitle"] 
        },
      ],
    });

    if (!donation) {
      return res.status(404).json({ 
        success: false,
        message: "Donation not found or you don't have permission to view it" 
      });
    }

    if (!donation.User) {
      return res.status(500).json({
        success: false,
        message: "User information not found for this donation"
      });
    }

    // If receipt URL already exists, return it
    if (donation.receiptUrl) {
      return res.json({ 
        success: true,
        receiptUrl: donation.receiptUrl 
      });
    }

    // Generate new receipt
    const pdfUrl = await generateReceiptPdf(donation, donation.User);

    // Save receipt URL to database
    donation.receiptUrl = pdfUrl;
    await donation.save();

    res.json({ 
      success: true,
      receiptUrl: pdfUrl,
      message: "Receipt generated successfully"
    });
  } catch (error) {
    console.error("Generate receipt error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to generate receipt", 
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
};