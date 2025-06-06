const Charity = require('../models/Charity');
const User = require('../models/User');

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