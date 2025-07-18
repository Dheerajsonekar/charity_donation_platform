const { Op } = require('sequelize');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Charity = require('../models/Charity');
const sequelize = require('../config/db');
const { uploadToS3, uploadPdfToS3 } = require('../middlewares/upload');
const { sendEmail, emailTemplates } = require("../utils/sendEmail");

exports.getAllCampaigns = async (req, res) => {
  try {
    const { search } = req.query;
    const where = { status: 'approved' };

    if (search) {
      where[Op.or] = [
        { campaignTitle: { [Op.like]: `%${search}%` } },
        { campaignDescription: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: campaigns } = await Campaign.findAndCountAll({
      where,
      include: [{
        model: User,
        attributes: ['name', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      campaigns: campaigns.map(campaign => ({
        ...campaign.get({ plain: true }),
        progress: Math.min(Math.round((campaign.amountRaised / campaign.goalAmount) * 100), 100)
      }))
    });

  } catch (err) {
    console.error('Error in getAllCampaigns:', err);
    res.status(500).json({ 
      success: false,
      message: "Error fetching campaigns",
      error: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};

exports.createCampaign = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: "Campaign image is required" 
      });
    }
    
    // Upload to Cloudinary
    const imageUrl = await uploadToS3(req.file);
    const userId = req.user.userId;
    
    const {
      campaignerName,
      campaignerEmail,
      campaignerPhone,
      beneficiaryType,
      beneficiaryName,
      beneficiaryEmail,
      beneficiaryPhone,
      ngoName,
      ngoState,
      ngoCity,
      campaignTitle,
      goalAmount,
      campaignDescription,
    } = req.body;

    // Validate required fields
    const requiredFields = {
      campaignerName: 'Campaigner name is required',
      campaignerEmail: 'Campaigner email is required',
      campaignTitle: 'Campaign title is required',
      goalAmount: 'Goal amount is required',
      beneficiaryType: 'Beneficiary type is required',
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([field]) => !req.body[field])
      .map(([_, message]) => message);

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: "Validation failed",
        errors: missingFields 
      });
    }

    // Validate beneficiary type specific fields
    let beneficiaryInfo = {};
    switch (beneficiaryType) {
      case 'individual':
      case 'other-individual':
        if (!beneficiaryName) {
          return res.status(400).json({ 
            success: false,
            message: "Beneficiary name is required for individual campaigns" 
          });
        }
        beneficiaryInfo = { beneficiaryName, beneficiaryEmail, beneficiaryPhone };
        break;
      case 'ngo':
        if (!ngoName || !ngoState) {
          return res.status(400).json({ 
            success: false,
            message: "NGO name and state are required for NGO campaigns" 
          });
        }
        beneficiaryInfo = { ngoName, ngoState, ngoCity };
        break;
      default:
        return res.status(400).json({ 
          success: false,
          message: "Invalid beneficiary type" 
        });
    }

    // Create campaign
    const newCampaign = await Campaign.create({
      campaignerName,
      campaignerEmail,
      campaignerPhone,
      beneficiaryType,
      ...beneficiaryInfo,
      campaignTitle,
      goalAmount: parseFloat(goalAmount),
      campaignDescription,
      campaignImageUrl: imageUrl,
      userId,
      status: 'pending'
    }, { transaction });

    // Send email notification
    const user = await User.findByPk(userId);
    const emailContent = emailTemplates.campaignCreated(
      campaignerName,
      campaignTitle,
      goalAmount
    );
    
    await sendEmail(user.email, 'Campaign Created - Under Review', emailContent);

    await transaction.commit();
    
    return res.status(201).json({ 
      success: true,
      message: "Campaign created successfully and is under review", 
      campaign: {
        id: newCampaign.id,
        title: newCampaign.campaignTitle,
        status: newCampaign.status,
        imageUrl: newCampaign.campaignImageUrl
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Create campaign error:", error);
    
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({ 
        success: false,
        message: "Validation error", 
        errors 
      });
    }
    
    return res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
};

exports.getMyCampaigns = async (req, res) => {
    try {
        const myUserId = req.user.userId;

        // Find charities owned by this user
        const myCharities = await Charity.findAll({
            where: { userId: myUserId }
        });
        const myCharityIds = myCharities.map(c => c.id);

        // Find campaigns created by me or my charities
        const campaigns = await Campaign.findAll({
            where: {
                [Op.or]: [
                    { userId: myUserId },
                    { charityId: myCharityIds }
                ]
            },
            attributes: ['id', 'campaignTitle', 'goalAmount', 'amountRaised', 'status', 'campaignImageUrl', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });

        res.json({ 
          success: true,
          campaigns: campaigns.map(campaign => ({
            ...campaign.get({ plain: true }),
            progress: Math.min(Math.round((campaign.amountRaised / campaign.goalAmount) * 100), 100)
          }))
        });
    } catch (error) {
        console.error('Error in getMyCampaigns:', error);
        res.status(500).json({ 
          success: false,
          message: 'Server error',
          error: process.env.NODE_ENV === 'development' ? error.message : null
        });
    }
};

exports.getCampaignDetails = async (req, res) => {
    try {
        const campaignId = req.params.campaignId;
        const userId = req.user.userId;

        // Verify ownership
        const campaign = await Campaign.findOne({
            where: { 
              id: campaignId,
              userId: userId 
            }
        });

        if (!campaign) {
            return res.status(404).json({ 
              success: false,
              message: 'Campaign not found or you do not have permission to view it' 
            });
        }

        // Get payments for this campaign
        const payments = await Payment.findAll({
            where: { campaignId },
            attributes: ['id', 'razorpay_payment_id', 'userId', 'amount', 'receiptUrl', 'impactReportUrl', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });

        const userDetails = await User.findAll({
            where: { id: payments.map(p => p.userId) },
            attributes: ['id', 'name', 'email']
        });

        res.json({
            success: true,
            campaign: {
              id: campaign.id,
              title: campaign.campaignTitle,
              description: campaign.campaignDescription,
              goalAmount: campaign.goalAmount,
              amountRaised: campaign.amountRaised,
              status: campaign.status
            },
            payments,
            userDetails
        });
    } catch (error) {
        console.error('Error in getCampaignDetails:', error);
        res.status(500).json({ 
          success: false,
          message: 'Server error',
          error: process.env.NODE_ENV === 'development' ? error.message : null
        });
    }
};

exports.submitImpactReport = async (req, res) => {
  try {
    const { campaignId, paymentId } = req.params;
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: "PDF file is required" 
      });
    }

    // Verify campaign ownership
    const campaign = await Campaign.findOne({
      where: { 
        id: campaignId,
        userId: userId 
      }
    });

    if (!campaign) {
      return res.status(403).json({ 
        success: false,
        message: "You do not have permission to submit reports for this campaign" 
      });
    }

    // Upload PDF to Cloudinary
    const pdfUrl = await uploadPdfToS3(req.file.buffer, req.file.originalname);

    // Find the payment
    const payment = await Payment.findOne({ 
      where: { 
        id: paymentId, 
        campaignId 
      },
      include: [{
        model: User,
        attributes: ['name', 'email']
      }]
    });
    
    if (!payment) {
      return res.status(404).json({ 
        success: false,
        message: "Payment not found" 
      });
    }

    // Update impact report info in payment table
    payment.impactReportUrl = pdfUrl;
    await payment.save();

    // Send notification email to donor
    const donorEmail = payment.User.email;
    const donorName = payment.User.name;
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #27ae60; text-align: center; margin-bottom: 30px;">📄 Impact Report Available!</h2>
          
          <p style="font-size: 16px; color: #333;">Dear <strong>${donorName}</strong>,</p>
          
          <p style="font-size: 16px; color: #333;">Great news! An impact report is now available for your donation.</p>
          
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #27ae60; margin-top: 0;">💰 Your Impact:</h3>
            <p style="margin: 10px 0;"><strong>Campaign:</strong> ${campaign.campaignTitle}</p>
            <p style="margin: 10px 0;"><strong>Donation Amount:</strong> ₹${payment.amount}</p>
            <p style="margin: 10px 0;"><strong>Report Status:</strong> Available Now</p>
          </div>
          
          <p style="font-size: 16px; color: #333;">You can view the impact report by logging into your account and visiting your donation history.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 14px; color: #7f8c8d;">Thank you for making a difference! 🙏</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">
            This is an automated message. Please don't reply to this email.
          </p>
        </div>
      </div>
    `;
    
    await sendEmail(donorEmail, 'Impact Report Available - Your Donation Made a Difference!', emailContent);

    res.json({
      success: true,
      message: "Impact report submitted successfully",
      report: {
        pdfUrl,
        submittedAt: new Date(),
        paymentId: payment.id
      },
    });
  } catch (error) {
    console.error("Error in submitImpactReport:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
};