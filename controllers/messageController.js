const { Message, User, Room } = require('../models')
const cloudinary = require('../config/cloudinary')

class MessageController {
    // Get messages for a specific room
    static async getMessages(req, res, next) {
        try {
            const { roomId } = req.params;
            const { limit = 50, offset = 0 } = req.query;

            // Check if room exists
            const room = await Room.findByPk(roomId);
            if (!room) {
                throw { name: "NotFound", message: "Room not found" };
            }

            const messages = await Message.findAll({
                where: { roomId },
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'username', 'avatar']
                    }
                ],
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            // Reverse to get chronological order
            res.status(200).json(messages.reverse());
        } catch (error) {
            console.log(error);
            next(error);
        }
    }
    // Create a text message
    static async createMessage(req, res, next) {
        try {
            const { content, type = 'text' } = req.body;
            const { roomId } = req.params;
            const userId = req.user.id;

            // Check if room exists
            const room = await Room.findByPk(roomId);
            if (!room) {
                throw { name: "NotFound", message: "Room not found" };
            }

            const message = await Message.create({
                content,
                userId,
                roomId,
                type,
                isAI: false
            });

            const messageWithUser = await Message.findByPk(message.id, {
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'username', 'avatar']
                    }
                ]
            });

            res.status(201).json({
                message: "Message sent successfully",
                data: messageWithUser
            });
        } catch (error) {
            console.log(error);
            next(error);
        }
    }
    // Create an image message with upload
    static async createImageMessage(req, res, next) {
        try {
            const { roomId } = req.params;
            const userId = req.user.id;

            if (!req.file) {
                throw { name: "BadRequest", message: "Image file is required" };
            }

            // Check if room exists
            const room = await Room.findByPk(roomId);
            if (!room) {
                throw { name: "NotFound", message: "Room not found" };
            }

            // Upload image to cloudinary
            const uploadResult = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    {
                        resource_type: "image",
                        folder: "chat_images",
                        transformation: [
                            { width: 800, height: 600, crop: "limit" },
                            { quality: "auto" }
                        ]
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                ).end(req.file.buffer);
            });

            // Create message with image URL
            const message = await Message.create({
                content: uploadResult.secure_url,
                userId,
                roomId,
                type: 'image',
                isAI: false
            });

            const messageWithUser = await Message.findByPk(message.id, {
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'username', 'avatar']
                    }
                ]
            });

            res.status(201).json({
                message: "Image message sent successfully",
                data: messageWithUser
            });
        } catch (error) {
            console.log(error);
            next(error);
        }
    }
}

module.exports = MessageController