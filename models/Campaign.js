const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Campaign = sequelize.define("Campaign", {
  campaignerName: DataTypes.STRING,
  campaignerEmail: DataTypes.STRING,
  campaignerPhone: DataTypes.STRING,

  beneficiaryType: DataTypes.STRING,
  beneficiaryName: DataTypes.STRING,
  beneficiaryEmail: DataTypes.STRING,
  beneficiaryPhone: DataTypes.STRING,
  ngoName: DataTypes.STRING,
  ngoState: DataTypes.STRING,
  ngoCity: DataTypes.STRING,

  campaignTitle: DataTypes.STRING,
  campaignDescription: DataTypes.TEXT,
  goalAmount: DataTypes.FLOAT,
  imageUrl: DataTypes.STRING,
});

module.exports = Campaign;
