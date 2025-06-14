const Campaign = require('../models/Campaign');
const Charity = require('../models/Charity');
const User = require('../models/User');
// const sendMail = require('../utils/sendMail'); // Uncomment if SendGrid is enabled

// Unified route: /admin/campaigns/:status
exports.getCampaignsByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const campaigns = await Campaign.findAll({
      where: { status },
      include: [{ model: User, attributes: ['name', 'email'] }]
    });

    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch campaigns" });
  }
};

// Unified status updater: /admin/campaign/:status/:id
exports.updateCampaignStatus = async (req, res) => {
  try {
    const { id, status } = req.params;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status update" });
    }

    const campaign = await Campaign.findByPk(id, { include: User });

    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    campaign.status = status;
    await campaign.save();

    // Optional email notification
    // await sendMail({
    //   to: campaign.user.email,
    //   subject: `Your campaign was ${status}`,
    //   text: `Hi ${campaign.user.name},\n\nYour campaign "${campaign.title}" has been ${status}.\n\nThanks,\nCharity Team`,
    // });

    res.json({ message: `Campaign ${status}` });
  } catch (err) {
    res.status(500).json({ message: `Error updating status to ${status}` });
  }
};



// Unified route: /admin/campaigns/:status
exports.getCharitiesByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const charities = await Charity.findAll({
      where: { status },
      include: [{ model: User, attributes: ['name', 'email'] }]
    });

    res.status(200).json(charities);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch campaigns" });
  }
};

// Unified status updater: /admin/campaign/:status/:id
exports.updateCharityStatus = async (req, res) => {
  try {
    const { id, status } = req.params;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status update" });
    }

    const charity = await Charity.findByPk(id, { include: User });

    if (!charity) return res.status(404).json({ message: "Charity not found" });

    charity.status = status;
    await charity.save();

    // Optional email notification
    // await sendMail({
    //   to: campaign.user.email,
    //   subject: `Your campaign was ${status}`,
    //   text: `Hi ${campaign.user.name},\n\nYour campaign "${campaign.title}" has been ${status}.\n\nThanks,\nCharity Team`,
    // });

    res.json({ message: `Charity ${status}` });
  } catch (err) {
    res.status(500).json({ message: `Error updating status to ${status}` });
  }
};



exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'isActive', 'createdAt']
    });
    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const { isActive } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.isActive = isActive;
    await user.save();

    res.json({ success: true, message: "User status updated." });
  } catch (err) {
    console.error("Error updating user status", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    await user.destroy();

    res.json({ success: true, message: "User deleted." });
  } catch (err) {
    console.error("Error deleting user", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
