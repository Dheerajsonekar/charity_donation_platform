const jwt = require('jsonwebtoken');
const jwt_secret = process.env.JWT_SECRET ;

const authentication = (req, res, next)=>{
    
    const authHeaders = req.headers.authorization;
    if(!authHeaders || !authHeaders.startsWith('Bearer ')){
        return res.status(401).json({message:'Unauthorized'});
    }

    const token = authHeaders.split(' ')[1];
    
    if(!token){
        return res.status(401).json({message:'Unauthorized'});
    }
    
    try{
        const decoded = jwt.verify(token, jwt_secret);
        req.user = decoded;
        
        next();
    }catch(err){
        return res.status(403).json({message:'Invalid token'});
    }

}

module.exports = authentication;