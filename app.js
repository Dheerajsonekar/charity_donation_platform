const express = require('express');
const app = express();
const db = require('./config/db');
const User = require('./models/User');
require('dotenv').config();
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const path = require('path');
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.get('/', (req, res, next)=>{
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
    
})


app.use('/api', userRoutes);


db.sync().then(()=>{
    console.log("connected to database successfully");
    app.listen(process.env.PORT, ()=>{
        console.log(`Server is running on ${process.env.PORT}`);
    })
}).catch((err)=>{
    console.error(err);
})
