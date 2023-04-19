const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, 	salt);
    return hashedPassword;
};

const checkPassword = async(password,storedpass) => {
    const isPass = await bcrypt.compare(password, storedpass);
    return isPass;
};

const createToken = async (uname) => {
    return await jwt.sign({username: uname}, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '3h' });
}

const verifyToken = async (accessToken) => {
    return await jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
}

const authenticateToken = async (req, res, next) => {
    const isOFF = process.env.AUTH_OFF //Turn off authentication, set to 1 to turn off
    if(isOFF=='1'){
        next()
    } else {
        //token = req.body.token
        // const authHeader = await req.headers['authorization']
        // const token = authHeader && authHeader.split('')[1]
        // if(token == null) return res.sendStatus(401)

        // await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err,decode)=>{
        //     if (err) return res.sendStatus(403)
        //     next()
        // })
        const authHeader = await req.headers.authorization;
        if (authHeader) {
          const token = authHeader && authHeader.split(" ")[1];
      
          await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) {
              return res.status(403).json("Token is not valid!");
            }
            // req.username = username;
            next();
          });
        } else {
            console.log('Authenication Failed')
          res.status(401).json("You are not authenticated!");
        }
    }
}

module.exports = { hashPassword, checkPassword, createToken, verifyToken, authenticateToken};