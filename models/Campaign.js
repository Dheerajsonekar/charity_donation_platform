const db = require('../config/db');
const { DataTypes } = require('sequelize');

const Campaign = db.define('campaign', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  goal: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending'
  }
});

module.exports = Campaign;
