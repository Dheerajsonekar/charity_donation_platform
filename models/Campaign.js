const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Campaign = sequelize.define("Campaign", {
  campaignerName: {
    type: DataTypes.STRING,
    
  },
  campaignerEmail: {
    type: DataTypes.STRING,
   
    validate: {
      isEmail: true
    }
  },
  campaignerPhone: {
    type: DataTypes.STRING,
    validate: {
      is: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im
    }
  },

  beneficiaryType: {
    type: DataTypes.ENUM('individual', 'other-individual', 'ngo'),
   
  },
  beneficiaryName: DataTypes.STRING,
  beneficiaryEmail: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true
    }
  },
  beneficiaryPhone: DataTypes.STRING,
  ngoName: DataTypes.STRING,
  ngoState: DataTypes.STRING,
  ngoCity: DataTypes.STRING,

  campaignTitle: {
    type: DataTypes.STRING,
    
    validate: {
      len: [10, 100]
    }
  },
  campaignDescription: {
    type: DataTypes.TEXT,
   
    validate: {
      len: [50, 5000]
    }
  },
  goalAmount: {
    type: DataTypes.FLOAT,
    
    validate: {
      min: 1000
    }
  },
  amountRaised: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  campaignImageUrl: {
    type: DataTypes.STRING,
    validate: {
      isUrl: true
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  }
});

module.exports = Campaign;