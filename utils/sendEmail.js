const nodemailer = require('nodemailer');
require('dotenv').config();

// Create Gmail SMTP transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Fallback logging for development/debugging
const logEmail = (to, subject, content) => {
  console.log('📧 EMAIL NOTIFICATION:');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Content Preview: ${content.substring(0, 100)}...`);
};

// Rate limiting for free tier
let emailCount = 0;
const EMAIL_DAILY_LIMIT = 95; // Stay under Gmail's 100/day limit

// Main email function
exports.sendEmail = async (to, subject, htmlContent) => {
  try {
    // Check daily limit
    if (emailCount >= EMAIL_DAILY_LIMIT) {
      console.warn('⚠️ Daily email limit reached, logging instead');
      logEmail(to, subject, htmlContent);
      return false;
    }

    // Check if credentials are available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      console.warn('⚠️ Email credentials not configured, logging email');
      logEmail(to, subject, htmlContent);
      return false;
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"DonateKart Platform" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent,
      text: htmlContent.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    const result = await transporter.sendMail(mailOptions);
    emailCount++;
    console.log(`✅ Email sent successfully to ${to}`);
    return result;
    
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    
    // Fallback to logging
    logEmail(to, subject, htmlContent);
    
    // Don't throw error to prevent app crashes
    return false;
  }
};

// Email templates
exports.emailTemplates = {
  campaignCreated: (campaignerName, campaignTitle, goalAmount) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; text-align: center; margin-bottom: 30px;">🎉 Campaign Created Successfully!</h2>
        
        <p style="font-size: 16px; color: #333;">Dear <strong>${campaignerName}</strong>,</p>
        
        <p style="font-size: 16px; color: #333;">Your campaign has been submitted for review and will be live soon!</p>
        
        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #27ae60; margin-top: 0;">📋 Campaign Details:</h3>
          <p style="margin: 10px 0;"><strong>Title:</strong> ${campaignTitle}</p>
          <p style="margin: 10px 0;"><strong>Goal Amount:</strong> ₹${goalAmount}</p>
          <p style="margin: 10px 0;"><strong>Status:</strong> Under Review</p>
          <p style="margin: 10px 0;"><strong>Review Time:</strong> 24-48 hours</p>
        </div>
        
        <p style="font-size: 16px; color: #333;">Our team will review your campaign and notify you once it's approved. You'll then be able to start receiving donations!</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="font-size: 14px; color: #7f8c8d;">Thank you for using DonateKart to make a difference! 💝</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">
          This is an automated message. Please don't reply to this email.
        </p>
      </div>
    </div>
  `,

  donationReceived: (donorName, campaignTitle, amount, paymentId) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #27ae60; text-align: center; margin-bottom: 30px;">💝 Thank You for Your Generous Donation!</h2>
        
        <p style="font-size: 16px; color: #333;">Dear <strong>${donorName}</strong>,</p>
        
        <p style="font-size: 16px; color: #333;">Your donation has been received successfully and will make a real difference!</p>
        
        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #27ae60; margin-top: 0;">🧾 Donation Details:</h3>
          <p style="margin: 10px 0;"><strong>Amount:</strong> ₹${amount}</p>
          <p style="margin: 10px 0;"><strong>Campaign:</strong> ${campaignTitle}</p>
          <p style="margin: 10px 0;"><strong>Payment ID:</strong> ${paymentId}</p>
          <p style="margin: 10px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <p style="font-size: 16px; color: #333;">You can view your donation history and download receipts from your dashboard. We'll also notify you when impact reports are available.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="font-size: 14px; color: #7f8c8d;">Your kindness creates lasting change! 🙏</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">
          Keep this email for your records. Visit your dashboard for detailed receipts.
        </p>
      </div>
    </div>
  `,

  profileUpdated: (userName) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #3498db;">✅ Profile Updated Successfully</h2>
      <p>Dear ${userName},</p>
      <p>Your profile has been updated successfully.</p>
      <p>If you didn't make this change, please contact support immediately.</p>
      <hr>
      <p style="color: #7f8c8d; font-size: 12px;">This is an automated email from DonateKart.</p>
    </div>
  `,

  charityUpdated: (charityName) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #27ae60;">🏢 Charity Information Updated</h2>
      <p>Your charity "${charityName}" information has been updated successfully.</p>
      <p>Changes may take some time to reflect on the platform.</p>
      <hr>
      <p style="color: #7f8c8d; font-size: 12px;">This is an automated email from DonateKart.</p>
    </div>
  `
};

// Test email function
exports.testEmail = async () => {
  const testContent = exports.emailTemplates.campaignCreated(
    'Test User',
    'Test Campaign',
    '50000'
  );
  
  try {
    const result = await exports.sendEmail(
      process.env.EMAIL_USER,
      'DonateKart - Email Configuration Test',
      testContent
    );
    console.log('✅ Test email sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Test email failed:', error);
    return false;
  }
};

// Reset daily counter (call this daily via cron or restart)
exports.resetDailyEmailCount = () => {
  emailCount = 0;
  console.log('🔄 Daily email counter reset');
};