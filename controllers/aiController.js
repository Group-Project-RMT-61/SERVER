const { Message, User, Room } = require('../models')
const AIService = require('../services/aiService')

class AIController {
    // Generate AI summary of messages in a room
    static async generateSummary(req, res, next) {
        try {
            const { roomId } = req.params;
            const userId = req.user.id;

            // Check if room exists
            const room = await Room.findByPk(roomId);
            if (!room) {
                throw { name: "NotFound", message: "Room not found" };
            }

            // Get recent messages from the room (last 50 messages)
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
                limit: 50
            });

            let summaryContent;
            let summaryMethod = 'fallback';

            // Try AI summarization first
            if (AIService.isConfigured()) {
                try {
                    const aiService = new AIService();
                    summaryContent = await aiService.summarizeMessages(messages.reverse(), room.name);
                    summaryMethod = 'ai';
                } catch (aiError) {
                    console.error('AI summarization failed, using fallback:', aiError);
                    summaryContent = AIService.generateFallbackSummary(messages.reverse(), room.name);
                }
            } else {
                summaryContent = AIService.generateFallbackSummary(messages.reverse(), room.name);
            }

            // Create an AI message with the summary
            const summaryMessage = await Message.create({
                content: summaryContent,
                userId, // The user who requested the summary
                roomId,
                type: 'text',
                isAI: true
            });

            const summaryWithUser = await Message.findByPk(summaryMessage.id, {
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'username', 'avatar']
                    }
                ]
            });

            // Emit real-time AI summary to all users in the room
            const socketServer = req.app.get('socketServer');
            if (socketServer) {
                socketServer.io.to(`room_${roomId}`).emit('new_message', {
                    message: summaryWithUser,
                    timestamp: new Date(),
                    isAI: true
                });
            }

            res.status(201).json({
                message: `Summary generated successfully using ${summaryMethod === 'ai' ? 'AI' : 'fallback'} method`,
                data: summaryWithUser,
                method: summaryMethod
            });
        } catch (error) {
            console.log(error);
            next(error);
        }
    }

    // Get summary history for a room (AI messages only)
    static async getSummaryHistory(req, res, next) {
        try {
            const { roomId } = req.params;
            const { limit = 10, offset = 0 } = req.query;

            // Check if room exists
            const room = await Room.findByPk(roomId);
            if (!room) {
                throw { name: "NotFound", message: "Room not found" };
            }

            const summaries = await Message.findAll({
                where: {
                    roomId,
                    isAI: true
                },
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

            res.status(200).json({
                message: "Summary history retrieved successfully",
                data: summaries,
                total: summaries.length
            });
        } catch (error) {
            console.log(error);
            next(error);
        }
    }

    // Get AI service status
    static async getAIStatus(req, res, next) {
        try {
            const isConfigured = AIService.isConfigured();

            res.status(200).json({
                message: "AI service status retrieved successfully",
                data: {
                    isConfigured,
                    service: isConfigured ? 'OpenAI GPT-4.1-nano' : 'Fallback summary generator',
                    features: {
                        summarization: true,
                        chatCompletion: isConfigured,
                        fallbackMode: !isConfigured
                    }
                }
            });
        } catch (error) {
            console.log(error);
            next(error);
        }
    }

    // Generate AI response to a message (future feature)
    static async generateResponse(req, res, next) {
        try {
            const { roomId } = req.params;
            const { prompt, context = 5 } = req.body;
            const userId = req.user.id;

            if (!prompt) {
                throw { name: "BadRequest", message: "Prompt is required" };
            }

            // Check if room exists
            const room = await Room.findByPk(roomId);
            if (!room) {
                throw { name: "NotFound", message: "Room not found" };
            }

            if (!AIService.isConfigured()) {
                throw { name: "ServiceUnavailable", message: "AI service is not configured. Please set up OpenAI API key." };
            }

            // Get recent messages for context
            const recentMessages = await Message.findAll({
                where: { roomId },
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'username', 'avatar']
                    }
                ],
                order: [['createdAt', 'DESC']],
                limit: parseInt(context)
            });

            const aiService = new AIService();

            // Create a more conversational prompt
            const conversationContext = recentMessages.reverse()
                .filter(msg => msg.type === 'text')
                .map(msg => `${msg.user?.username || 'User'}: ${msg.content}`)
                .join('\n');

            const fullPrompt = `Based on the recent conversation in room "${room.name}":\n\n${conversationContext}\n\nUser question: ${prompt}\n\nPlease provide a helpful response:`;

            // For now, we'll use the summarization method as a base
            // You can extend this to use chat completions specifically
            const response = await aiService.openai.chat.completions.create({
                model: "gpt-4.1-nano",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful AI assistant in a chat room. Be friendly, concise, and helpful."
                    },
                    {
                        role: "user",
                        content: fullPrompt
                    }
                ],
                max_tokens: 200,
                temperature: 0.8
            });

            const aiResponse = response.choices[0].message.content.trim();

            // Create an AI message with the response
            const responseMessage = await Message.create({
                content: aiResponse,
                userId, // The user who asked the question
                roomId,
                type: 'text',
                isAI: true
            });

            const responseWithUser = await Message.findByPk(responseMessage.id, {
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'username', 'avatar']
                    }
                ]
            });

            // Emit real-time AI response to all users in the room
            const socketServer = req.app.get('socketServer');
            if (socketServer) {
                socketServer.io.to(`room_${roomId}`).emit('new_message', {
                    message: responseWithUser,
                    timestamp: new Date(),
                    isAI: true
                });
            }

            res.status(201).json({
                message: "AI response generated successfully",
                data: responseWithUser,
                prompt: prompt
            });
        } catch (error) {
            console.log(error);
            next(error);
        }
    }
}

module.exports = AIController;
