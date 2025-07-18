const Charity = require('../models/Charity');
const User = require('../models/User');
const { sendEmail, emailTemplates } = require("../utils/sendEmail");

exports.addCharity = async (req, res) => {
    try {
        const { registrationNumber, name, description, website } = req.body;
        const userId = req.user.userId;

        // Validate required fields
        if (!registrationNumber || !name || !description) {
            return res.status(400).json({
                success: false,
                message: 'Registration number, name, and description are required'
            });
        }

        // Check if charity with same registration number exists
        const existingCharity = await Charity.findOne({
            where: { registrationNumber }
        });

        if (existingCharity) {
            return res.status(409).json({
                success: false,
                message: 'A charity with this registration number already exists'
            });
        }

        const charity = await Charity.create({
            registrationNumber,
            name,
            description,
            website,
            userId,
            status: 'pending'
        });

        // Send confirmation email
        const user = await User.findByPk(userId);
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #2c3e50; text-align: center; margin-bottom: 30px;">🏢 Charity Registration Submitted</h2>
                    
                    <p style="font-size: 16px; color: #333;">Dear <strong>${user.name}</strong>,</p>
                    
                    <p style="font-size: 16px; color: #333;">Your charity registration has been submitted successfully and is under review.</p>
                    
                    <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #27ae60; margin-top: 0;">📋 Charity Details:</h3>
                        <p style="margin: 10px 0;"><strong>Name:</strong> ${name}</p>
                        <p style="margin: 10px 0;"><strong>Registration Number:</strong> ${registrationNumber}</p>
                        <p style="margin: 10px 0;"><strong>Status:</strong> Under Review</p>
                        <p style="margin: 10px 0;"><strong>Review Time:</strong> 24-48 hours</p>
                    </div>
                    
                    <p style="font-size: 16px; color: #333;">Once approved, you'll be able to create campaigns under your charity name.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <p style="font-size: 14px; color: #7f8c8d;">Thank you for registering your charity with DonateKart! 🙏</p>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="font-size: 12px; color: #999; text-align: center;">
                        This is an automated message. Please don't reply to this email.
                    </p>
                </div>
            </div>
        `;

        await sendEmail(user.email, 'Charity Registration - Under Review', emailContent);

        res.status(200).json({
            success: true,
            message: 'Charity added successfully and is under review',
            charity: {
                id: charity.id,
                name: charity.name,
                status: charity.status
            }
        });

    } catch (err) {
        console.error('Add charity error:', err);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? err.message : null
        });
    }
};

exports.updateCharity = async (req, res) => {
    try {
        const { charityId } = req.params;
        const { registrationNumber, name, description, website } = req.body;
        const userId = req.user.userId;

        // Validate required fields
        if (!registrationNumber || !name || !description) {
            return res.status(400).json({
                success: false,
                message: 'Registration number, name, and description are required'
            });
        }

        const charity = await Charity.findOne({ 
            where: { id: charityId, userId } 
        });

        if (!charity) {
            return res.status(404).json({ 
                success: false,
                message: 'Charity not found or you do not have permission to update it' 
            });
        }

        // Check if registration number is being changed to an existing one
        if (registrationNumber !== charity.registrationNumber) {
            const existingCharity = await Charity.findOne({
                where: { 
                    registrationNumber,
                    id: { [require('sequelize').Op.ne]: charityId }
                }
            });

            if (existingCharity) {
                return res.status(409).json({
                    success: false,
                    message: 'A charity with this registration number already exists'
                });
            }
        }

        charity.registrationNumber = registrationNumber;
        charity.name = name;
        charity.description = description;
        charity.website = website;
        charity.status = 'pending'; // Reset to pending after update

        await charity.save();

        // Send update confirmation email
        const user = await User.findByPk(userId);
        const emailContent = emailTemplates.charityUpdated(charity.name);
        await sendEmail(user.email, 'Charity Information Updated', emailContent);

        res.status(200).json({ 
            success: true,
            message: 'Charity updated successfully',
            charity: {
                id: charity.id,
                name: charity.name,
                status: charity.status
            }
        });
    } catch (err) {
        console.error('Update charity error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? err.message : null
        });
    }
};

exports.getCharities = async (req, res) => {
    try {
        const userId = req.user.userId;
        const charities = await Charity.findAll({ 
            where: { userId },
            order: [['createdAt', 'DESC']]
        });

        if (charities.length === 0) {
            return res.status(200).json({ 
                success: true,
                message: 'No charities found for this user',
                charities: []
            });
        }

        res.status(200).json({ 
            success: true,
            charities: charities.map(charity => ({
                id: charity.id,
                registrationNumber: charity.registrationNumber,
                name: charity.name,
                description: charity.description,
                website: charity.website,
                status: charity.status,
                createdAt: charity.createdAt
            }))
        });
    } catch (err) {
        console.error('Get charities error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? err.message : null
        });
    }
};

exports.getApprovedNgo = async (req, res) => {
    try {
        const approvedNgos = await Charity.findAll({ 
            where: { status: 'approved' },
            attributes: ['id', 'name', 'description', 'website'],
            order: [['name', 'ASC']]
        });

        if (approvedNgos.length === 0) {
            return res.status(200).json({ 
                success: true,
                message: 'No approved NGOs found',
                approvedNgos: []
            });
        }

        res.status(200).json({ 
            success: true,
            approvedNgos: approvedNgos.map(ngo => ({
                id: ngo.id,
                name: ngo.name,
                description: ngo.description,
                website: ngo.website
            }))
        });
    } catch (err) {
        console.error('Get approved NGOs error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? err.message : null
        });
    }
};