const User = require("../models/User");
const bcrypt = require("bcryptjs");
const sequelize = require("../config/db");
const jwt = require('jsonwebtoken');
const { sendEmail, emailTemplates } = require("../utils/sendEmail");

exports.register = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { name, email, phone, password } = req.body;
    
    // Validate input
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ 
        success: false,
        message: "All fields are required" 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: "Password must be at least 6 characters long" 
      });
    }

    const alreadyEmail = await User.findOne({ where: { email } });
    if (alreadyEmail) {
      return res.status(409).json({ 
        success: false,
        message: "Email already exists" 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const response = await User.create(
      { name, email, phone, password: hashedPassword },
      { transaction: t }
    );

    await t.commit();

    // Send welcome email
    const welcomeEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #2c3e50; text-align: center; margin-bottom: 30px;">🎉 Welcome to DonateKart!</h2>
          
          <p style="font-size: 16px; color: #333;">Dear <strong>${name}</strong>,</p>
          
          <p style="font-size: 16px; color: #333;">Thank you for joining DonateKart! Your account has been created successfully.</p>
          
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #27ae60; margin-top: 0;">🚀 What you can do now:</h3>
            <p style="margin: 10px 0;">💰 Donate to meaningful causes</p>
            <p style="margin: 10px 0;">📋 Start your own fundraising campaign</p>
            <p style="margin: 10px 0;">📊 Track your donation impact</p>
            <p style="margin: 10px 0;">🏢 Register your charity organization</p>
          </div>
          
          <p style="font-size: 16px; color: #333;">Ready to make a difference? Log in and explore active campaigns!</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 14px; color: #7f8c8d;">Together, we can create positive change! 💝</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">
            This is an automated welcome message from DonateKart.
          </p>
        </div>
      </div>
    `;

    await sendEmail(email, 'Welcome to DonateKart - Start Making a Difference!', welcomeEmailContent);

    res.status(200).json({
      success: true,
      message: "Registration successful",
      user: {
        id: response.id,
        name: response.name,
        email: response.email
      }
    });
  } catch (err) {
    await t.rollback();
    console.error('Registration error:', err);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Email and password are required" 
      });
    }

    const response = await User.findOne({ where: { email } });

    if (!response) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Check if user is active
    if (!response.isActive) {
      return res.status(403).json({ 
        success: false,
        message: "Account is deactivated. Please contact support." 
      });
    }

    // Check if password is correct
    const isPasswordCorrect = await bcrypt.compare(password, response.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid password" 
      });
    }

    const token = jwt.sign(
      { userId: response.id, name: response.name },
      process.env.JWT_SECRET,
      { expiresIn: "24h" } // Extended for better UX
    );

    res.status(200).json({ 
      success: true,
      message: "Login successful",
      token, 
      name: response.name,
      user: {
        id: response.id,
        name: response.name,
        email: response.email,
        isAdmin: response.isAdmin
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.user.userId },
      attributes: ['id', 'name', 'email', 'phone', 'isAdmin', 'isActive', 'createdAt'],
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
        isActive: user.isActive,
        memberSince: user.createdAt
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get profile',
      error: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, phone } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ 
        success: false,
        message: "Name and phone are required" 
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Store old values for email
    const oldName = user.name;

    user.name = name;
    user.phone = phone;
    await user.save();

    // Send update confirmation email
    const updateEmailContent = emailTemplates.profileUpdated(name);
    await sendEmail(user.email, 'Profile Updated Successfully', updateEmailContent);

    res.status(200).json({ 
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ 
      success: false,
      message: "Error updating profile",
      error: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};