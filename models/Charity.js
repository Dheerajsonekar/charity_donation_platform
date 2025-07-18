const db = require('../config/db');
const { DataTypes} = require('sequelize');


const Charity = db.define('charity', {
       
    registrationNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    website: {
        type: DataTypes.STRING,
        allowNull: true
    },

    status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending'
  }


})


module.exports = Charity;