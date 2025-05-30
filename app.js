const express = require('express');
const app = express();
const db = require('./config/db');
require('dotenv').config();
const path = require('path');
const cors = require('cors');

const User = require('./models/User');
const Campaign = require('./models/Campaign');

const campaignRoutes = require('./routes/campaignRoutes');
const userRoutes = require('./routes/userRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const adminRoutes = require('./routes/adminRoutes');



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

//Association 
User.hasMany(Campaign, { foreignKey: 'userId' });
Campaign.belongsTo(User, { foreignKey: 'userId' });

db.sync({alter:true}).then(()=>{
    console.log("connected to database successfully");
    app.listen(process.env.PORT, ()=>{
        console.log(`Server is running on ${process.env.PORT}`);
    })
}).catch((err)=>{
    console.error(err);
})
