const Campaign = require('../models/Campaign');
const User = require('../models/User');
const sequelize = require('../config/db'); // Assuming you have a sequelize instance exported from your db config

exports.createCampaign = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { title, goal, description } = req.body;
    const userId = req.user.userId; // Assuming user ID is stored in req.user by auth middleware

    const campaign = await Campaign.create(
      { title, goal, description, userId },
      { transaction: t }
    );

    await t.commit();

    res.status(201).json(campaign);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: "Error creating campaign", error: err });
  }
}

exports.getAllCampaigns = async (req, res) => {
    try {
        const campaigns = await Campaign.findAll({
          where: {status: 'approved'},
        include: [{
            model: User,
            attributes: ['name', 'email'] // Include user details
        }]
        });
    
        res.status(200).json(campaigns);
    } catch (err) {
        res.status(500).json({ message: "Error fetching campaigns", error: err });
    }
}