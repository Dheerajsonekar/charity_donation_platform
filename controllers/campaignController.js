const Campaign = require("../models/Campaign");
const User = require("../models/User");
const sequelize = require("../config/db");
const { uploadToS3 } = require("../middlewares/upload");

exports.createCampaign = async (req, res) => {
  const transaction = await sequelize.transaction(); // Start a transaction

  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({ message: "Campaign image is required" });
    }

    // Upload the file to S3 first
    const imageUrl = await uploadToS3(req.file);

    // Extract form fields
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

    // Validate goalAmount is a positive number
    if (isNaN(goalAmount)) {
      return res.status(400).json({ message: "Goal amount must be a number" });
    }

    // Prepare beneficiary data based on type
    let beneficiaryInfo = {};
    switch (beneficiaryType) {
      case "individual":
      case "other-individual":
        if (!beneficiaryName) {
          return res
            .status(400)
            .json({
              message: "Beneficiary name is required for individual campaigns",
            });
        }
        beneficiaryInfo = {
          beneficiaryName,
          beneficiaryEmail,
          beneficiaryPhone,
        };
        break;
      case "ngo":
        if (!ngoName || !ngoState) {
          return res
            .status(400)
            .json({
              message: "NGO name and state are required for NGO campaigns",
            });
        }
        beneficiaryInfo = { ngoName, ngoState, ngoCity };
        break;
      default:
        return res.status(400).json({ message: "Invalid beneficiary type" });
    }

    // Create campaign
    const newCampaign = await Campaign.create(
      {
        campaignerName,
        campaignerEmail,
        campaignerPhone,
        beneficiaryType,
        ...beneficiaryInfo,
        campaignTitle,
        goalAmount: parseFloat(goalAmount),
        campaignDescription,
        imageUrl: imageUrl,
        userId: req.user.userId,

        status: "pending", // Default status for new campaigns
      },
      { transaction }
    );

    await transaction.commit(); // Commit the transaction

    return res.status(201).json({
      message: "Campaign created successfully",
      campaign: newCampaign,
    });
  } catch (error) {
    await transaction.rollback(); // Rollback on error
    console.error("Create campaign error:", error);

    // Handle Sequelize validation errors
    if (error.name === "SequelizeValidationError") {
      const errors = error.errors.map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return res.status(400).json({ message: "Validation error", errors });
    }

    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

exports.getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.findAll({
      where: { status: "approved" },
      include: [
        {
          model: User,
          attributes: ["name", "email"],
        },
      ],
    });

    res.status(200).json(campaigns);
  } catch (err) {
    res.status(500).json({ message: "Error fetching campaigns", error: err });
  }
};
