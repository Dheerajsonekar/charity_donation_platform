const express = require('express');
const app = express();
const db = require('./config/db');
require('dotenv').config();
const path = require('path');
const cors = require('cors');

const User = require('./models/User');
const Charity = require('./models/Charity');
const Campaign = require('./models/Campaign');
const Payment = require('./models/Payment');

const campaignRoutes = require('./routes/campaignRoutes');
const userRoutes = require('./routes/userRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const adminRoutes = require('./routes/adminRoutes');
const charityRoutes = require('./routes/charityRoutes');
const paymentsRoutes = require("./routes/paymentRoutes");
// const aiRoutes = require("./routes/aiRoutes");

// CORS configuration for free deployment
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL,
        /\.onrender\.com$/,
        /\.netlify\.app$/,
        /\.vercel\.app$/
      ].filter(Boolean)
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' })); // Optimized for free tier
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(express.static(path.join(__dirname, "public")));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'connected'
  });
});

// Keep-alive endpoint to prevent free tier sleeping
app.get('/ping', (req, res) => {
  res.status(200).json({ pong: true, time: Date.now() });
});

// Main route
app.get('/', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// API Routes
app.use('/api', adminAuthRoutes);
app.use('/api', adminRoutes);
app.use('/api', userRoutes);
app.use('/api', campaignRoutes);
app.use('/api', charityRoutes);
app.use("/api/payments", paymentsRoutes);
// app.use("/api/ai", aiRoutes);

// Model Associations
User.hasMany(Campaign, { foreignKey: 'userId', onDelete: 'CASCADE' });
Campaign.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Charity, { foreignKey: 'userId', onDelete: 'CASCADE' });
Charity.belongsTo(User, { foreignKey: 'userId' });

Charity.hasMany(Campaign, { foreignKey: 'charityId', onDelete: 'SET NULL' });
Campaign.belongsTo(Charity, { foreignKey: 'charityId' });

User.hasMany(Payment, { foreignKey: 'userId', onDelete: 'CASCADE' });
Payment.belongsTo(User, { foreignKey: 'userId' });

Campaign.hasMany(Payment, { foreignKey: 'campaignId', onDelete: 'CASCADE' });
Payment.belongsTo(Campaign, { foreignKey: 'campaignId' });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      error: err.message
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  try {
    await db.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Database sync and server start
const PORT = process.env.PORT || 3000;

db.sync({ 
  force: false, 
  alter: process.env.NODE_ENV === 'development' 
}).then(() => {
  console.log("✅ Database synced successfully");
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💚 Free tier deployment ready`);
    
    // Self-ping to prevent sleeping on free tier
    if (process.env.NODE_ENV === 'production') {
      setInterval(() => {
        const url = `http://localhost:${PORT}/ping`;
        fetch(url).catch(() => {
          console.log('Self-ping to prevent sleeping');
        });
      }, 14 * 60 * 1000); // Every 14 minutes
    }
  });
}).catch((err) => {
  console.error("❌ Database sync failed:", err);
  process.exit(1);
});