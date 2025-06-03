const { User } = require('../models')
const { comparePassword } = require('../helpers/bcrypt')
const { signToken } = require('../helpers/jwt')

class UserController {
    static async register(req, res, next) {
        try {
            const { username, email, password } = req.body

            // Create user (password will be hashed by the model hook)
            const user = await User.create({
                username,
                email,
                password
            })

            res.status(201).json({
                id: user.id,
                username: user.username,
                email: user.email
            })
        } catch (error) {
            console.log(error)
            next(error)
        }
    }

    static async login(req, res, next) {
        try {
            const { email, password } = req.body

            if (!email) {
                throw { name: "BadRequest", message: "Email is required" }
            }
            if (!password) {
                throw { name: "BadRequest", message: "Password is required" }
            }

            const user = await User.findOne({ where: { email } })
            if (!user) {
                throw { name: "Unauthorized", message: "Invalid email/password" }
            }

            const isValidPassword = comparePassword(password, user.password)
            if (!isValidPassword) {
                throw { name: "Unauthorized", message: "Invalid email/password" }
            }

            // Update last seen and status
            await user.update({ lastSeen: new Date(), status: 'online' })

            const access_token = signToken({
                id: user.id,
            })

            res.status(200).json({
                access_token,
                id: user.id,
                status: user.status
            })
        } catch (error) {
            console.log(error)
            next(error)
        }
    }
}

module.exports = UserController