const { verifyToken } = require("../helpers/jwt");
const { User } = require('../models')

async function authentication(req, res, next) {
    try {
        const bearerToken = req.headers.authorization;
        if (!bearerToken) {
            throw { name: "Unauthorized", message: "Invalid token" }
        }
        const rawToken = bearerToken.split(" ")
        const tokenType = rawToken[0];
        const tokenValue = rawToken[1];
        if (tokenType !== "Bearer" || !tokenValue) {
            throw { name: "Unauthorized", message: "Invalid token" }
        }
        const data = verifyToken(tokenValue);
        const user = await User.findByPk(data.id)
        if (!user) {
            throw { name: "Unauthorized", message: "Invalid token" }
        }
        req.user = {
            id: user.id,
            role: user.role
        }
        next();
    } catch (error) {
        console.log(error);
        next(error);
    }
}

module.exports = authentication;