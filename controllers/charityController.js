const Charity = require('../models/Charity');
const User = require('../models/User');
const{ sendEmail }= require("../utils/sendEmail");

exports.addCharity = async (req, res)=>{
    try{
         const { registrationNumber, name, description, website } = req.body;
         const userId = req.user.userId;
            const charity = await Charity.create({
                registrationNumber,
                name,
                description,
                website,
                userId
            });

        res.status(200).json({message: 'Charity added successfully', charity});

    }catch(err){
        console.error('Error:', err);
        res.status(500).json({message: 'Internal server error'});
    }
}

exports.updateCharity = async (req, res)=>{
    try {
        const { charityId } = req.params;
        const { registrationNumber, name, description, website } = req.body;
        const userId = req.user.userId;

        const charity = await Charity.findOne({ where: { id: charityId, userId } });

        if (!charity) {
            return res.status(404).json({ message: 'Charity not found' });
        }

        charity.registrationNumber = registrationNumber;
        charity.name = name;
        charity.description = description;
        charity.website = website;

        await charity.save();

        const html = `
            <h3>Your charity has been updated!</h3>
            <p>Charity Name: ${charity.name}</p>
            <p>Description: ${charity.description}</p>
            <p>Website: <a href="${charity.website}">${charity.website}</a></p>
        `;
        const user = await User.findByPk(userId);
        await sendEmail(user.email, 'Charity Updated', html);

        res.status(200).json({ message: 'Charity updated successfully', charity });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

exports.getCharities = async (req, res) =>{
    try {
        const userId = req.user.userId;
        const charities = await Charity.findAll({ where: { userId } });

        if (charities.length === 0) {
            return res.status(404).json({ message: 'No charities found for this user' });
        }

        res.status(200).json({ charities });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}


exports.getApprovedNgo = async (req, res) =>{

    try {
        const approvedNgos = await Charity.findAll({ where: { status: 'approved' } });

        if (approvedNgos.length === 0) {
            return res.status(404).json({ message: 'No approved NGOs found' });
        }

        res.status(200).json({ approvedNgos });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}