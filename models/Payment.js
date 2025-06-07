const db = require('../config/db');
const {DataTypes} = require('sequelize');

const Payment = db.define("Payment", {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    campaignId: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.FLOAT, allowNull: false },
    razorpay_order_id: { type: DataTypes.STRING, allowNull: false },
    razorpay_payment_id: { type: DataTypes.STRING, allowNull: false },
    razorpay_signature: { type: DataTypes.STRING, allowNull: false },
  });

  module.exports= Payment;