const Campaign = require('../models/Campaign');
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
