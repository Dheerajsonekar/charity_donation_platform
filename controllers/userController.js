const User = require("../models/User");
const bcrypt = require("bcryptjs");
const sequelize = require("../config/db");
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { name, email, phone, password } = req.body;
    const alreadyEmail = await User.findOne({ where: { email } });
    if (alreadyEmail) {
      return res.status(409).json({ message: "email already exits" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const response = await User.create(
      { name, email, phone, password: hashedPassword },
      { transaction: t }
    );

    await t.commit();

    res.status(200).json(response);
  } catch (err) {
    await t.rollback();
    res.status(500).json(err);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const response = await User.findOne({ where: { email } });

    if (!response) return res.status(404).json({ message: "user not found" });

    // check if password is correct
    const isPasswordCorrect = await bcrypt.compare(password, response.password);
    if (!isPasswordCorrect)
      return res.status(401).json({ message: "incorrect password" });

    const token = jwt.sign(
      { userId: response.id, name: response.name },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res
      .status(200)
      .json({ token, name: response.name});
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};


exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({
      where: {id: req.user.userId},
      attributes: ['id', 'name', 'email', 'phone', 'isAdmin'],
    })
    
    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get profile' });
  }
};

// controllers/userController.js
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, phone } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = name;
    user.phone = phone;
    await user.save();

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating profile" });
  }
};


