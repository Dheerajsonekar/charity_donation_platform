const db = require('../config/db');
const {DataTypes } = require('sequelize');

const User = db.define('user', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
       
    },
    password: {
        type:DataTypes.STRING,
        allowNull: false 
    },
    isAdmin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
     isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true  
    }
    
})

module.exports = User;