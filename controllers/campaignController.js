const { Op } = require('sequelize');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const Payment = require('../models/Payment');

const Charity = require('../models/Charity');
const sequelize = require('../config/db');
const { uploadToS3, uploadPdfToS3 } = require('../middlewares/upload');
const{ sendEmail }= require("../utils/sendEmail");

exports.getAllCampaigns = async (req, res) => {
  try {
    const { search } = req.query;
    // const where = {status: 'pending'};  // Initialize where object
    const where = { status: 'approved'};

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
    
    const imageUrl = await uploadToS3(req.file);
    const userId = req.user.userId;// Assuming user ID is available in req.user after authentication
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

    const html = `
      <h3>New Campaign Created!</h3>`
  const user = await User.findByPk(userId);
      await sendEmail(user.email, 'campaign created', html);




    await transaction.commit();
    
    return res.status(201).json({ 
      success: true,
      message: "Campaign created successfully", 
      campaign: newCampaign 
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
            attributes: ['id', 'campaignTitle', 'goalAmount', 'amountRaised', 'status']
        });

        res.json({ campaigns });
    } catch (error) {
        console.error('Error in getMyCampaigns:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getCampaignDetails = async (req, res) => {
    try {
        const campaignId = req.params.campaignId;
       

        // Get payments
        const payments = await Payment.findAll({
            where: { campaignId },
            attributes: ['id', 'razorpay_payment_id', 'userId', 'amount', 'receiptUrl', 'impactReportUrl' ]
        });

        
        

        const userDetails = await User.findAll({
            where: { id: payments.map(p => p.userId) },
            attributes: ['id', 'name', 'email']
        });

        res.json({
            payments,
            userDetails
            

        });
    } catch (error) {
        console.error('Error in getCampaignDetails:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.submitImpactReport = async (req, res) => {
  try {
    const { campaignId, paymentId } = req.params;
    const { title } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "PDF file is required" });
    }

    const pdfUrl = await uploadPdfToS3(req.file.buffer, req.file.originalname);

    // Find the payment
    const payment = await Payment.findOne({ where: { id: paymentId, campaignId } });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Update impact report info in payment table
    payment.impactReportUrl = pdfUrl;
    await payment.save();

    res.json({
      message: "Impact report submitted successfully",
      report: {
        
        pdfUrl
      },
    });
  } catch (error) {
    console.error("Error in submitImpactReport:", error);
    res.status(500).json({ message: "Server error" });
  }
};