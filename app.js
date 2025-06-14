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





app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.get('/', (req, res, next)=>{
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
    
})

app.use('/api', adminAuthRoutes);
app.use('/api', adminRoutes);
app.use('/api', userRoutes);
app.use('/api', campaignRoutes);
app.use('/api', charityRoutes);
app.use("/api/payments", paymentsRoutes);


//Association 
User.hasMany(Campaign, { foreignKey: 'userId' });
Campaign.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Charity, {foreignKey: 'userId'});
Charity.belongsTo(User, {foreignKey: 'userId'});

Charity.hasMany(Campaign, {foreignKey: 'charityId'});
Campaign.belongsTo(Charity, {foreignKey: 'charityId'});

User.hasMany(Payment, { foreignKey: 'userId' });
Payment.belongsTo(User, { foreignKey: 'userId' });

Campaign.hasMany(Payment, { foreignKey: 'campaignId' });
Payment.belongsTo(Campaign, { foreignKey: 'campaignId' });





db.sync({alter:true}).then(()=>{
    console.log("connected to database successfully");
    app.listen(process.env.PORT, ()=>{
        console.log(`Server is running on ${process.env.PORT}`);
    })
}).catch((err)=>{
    console.error(err);
})
