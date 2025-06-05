const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { User, Room, Message } = require("../models");

class SocketServer {
    constructor(httpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: "*", // Configure this properly for production
                methods: ["GET", "POST"],
            },
        });

        this.connectedUsers = new Map(); // userId -> { socketId, user }
        this.roomUsers = new Map(); // roomId -> Set of userIds

        this.initializeHandlers();
    }

    initializeHandlers() {
        this.io.use(this.authenticateSocket.bind(this));
        this.io.on("connection", this.handleConnection.bind(this));
    }

    // Socket authentication middleware
    async authenticateSocket(socket, next) {
        try {
            const token =
                socket.handshake.auth.token ||
                socket.handshake.headers.authorization?.replace("Bearer ", "");

            if (!token) {
                return next(new Error("Authentication token required"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findByPk(decoded.id, {
                attributes: ["id", "username", "email", "avatar"],
            });

            if (!user) {
                return next(new Error("User not found"));
            }

            socket.userId = user.id;
            socket.user = user;
            next();
        } catch (error) {
            console.error("Socket authentication error:", error);
            next(new Error("Authentication failed"));
        }
    }

    // Handle new socket connection
    handleConnection(socket) {
        console.log(
            `User ${socket.user.username} connected with socket ${socket.id}`
        );

        // Store connected user
        this.connectedUsers.set(socket.userId, {
            socketId: socket.id,
            user: socket.user,
        });

        // Send welcome message
        socket.emit("connected", {
            message: "Successfully connected to Chat-Cord",
            user: socket.user,
        });

        // Handle joining rooms
        socket.on("join_room", this.handleJoinRoom.bind(this, socket));

        // Handle leaving rooms
        socket.on("leave_room", this.handleLeaveRoom.bind(this, socket));

        // Handle real-time message sending
        socket.on("send_message", this.handleSendMessage.bind(this, socket));

        // Handle real-time image message sending
        socket.on(
            "send_image_message",
            this.handleSendImageMessage.bind(this, socket)
        );

        // Handle typing indicators
        socket.on("typing_start", this.handleTypingStart.bind(this, socket));
        socket.on("typing_stop", this.handleTypingStop.bind(this, socket));

        // Handle user status
        socket.on("update_status", this.handleUpdateStatus.bind(this, socket));

        // Handle disconnection
        socket.on("disconnect", this.handleDisconnect.bind(this, socket));
    }

    // Handle joining a room
    async handleJoinRoom(socket, data) {
        try {
            const { roomId } = data;

            // Verify room exists and user has access
            const room = await Room.findByPk(roomId);
            if (!room) {
                socket.emit("error", { message: "Room not found" });
                return;
            }

            // Join socket room
            socket.join(`room_${roomId}`);

            // Track user in room
            if (!this.roomUsers.has(roomId)) {
                this.roomUsers.set(roomId, new Set());
            }
            this.roomUsers.get(roomId).add(socket.userId); // Notify others in room
            socket.to(`room_${roomId}`).emit("user_joined", {
                user: socket.user,
                roomId: roomId,
                timestamp: new Date(),
            });

            // Broadcast updated users list to all users in the room
            const roomUsers = this.getRoomUsers(roomId);
            this.io.to(`room_${roomId}`).emit("users_update", roomUsers);

            // Confirm join to user
            socket.emit("room_joined", {
                roomId: roomId,
                roomName: room.name,
                message: `Joined room: ${room.name}`,
            });

            console.log(`${socket.user.username} joined room ${room.name}`);
        } catch (error) {
            console.error("Join room error:", error);
            socket.emit("error", { message: "Failed to join room" });
        }
    }

    // Handle leaving a room
    async handleLeaveRoom(socket, data) {
        try {
            const { roomId } = data;

            // Leave socket room
            socket.leave(`room_${roomId}`);

            // Remove user from room tracking
            if (this.roomUsers.has(roomId)) {
                this.roomUsers.get(roomId).delete(socket.userId);
                if (this.roomUsers.get(roomId).size === 0) {
                    this.roomUsers.delete(roomId);
                }
            } // Notify others in room
            socket.to(`room_${roomId}`).emit("user_left", {
                user: socket.user,
                roomId: roomId,
                timestamp: new Date(),
            });

            // Broadcast updated users list to all users in the room
            const roomUsers = this.getRoomUsers(roomId);
            this.io.to(`room_${roomId}`).emit("users_update", roomUsers);

            // Confirm leave to user
            socket.emit("room_left", {
                roomId: roomId,
                message: `Left room`,
            });

            console.log(`${socket.user.username} left room ${roomId}`);
        } catch (error) {
            console.error("Leave room error:", error);
            socket.emit("error", { message: "Failed to leave room" });
        }
    }

    // Handle real-time message sending
    async handleSendMessage(socket, data) {
        try {
            const { roomId, content, type = "text" } = data;

            if (!content || !roomId) {
                socket.emit("error", { message: "Content and roomId are required" });
                return;
            }

            // Verify room exists
            const room = await Room.findByPk(roomId);
            if (!room) {
                socket.emit("error", { message: "Room not found" });
                return;
            }

            // Create message in database
            const message = await Message.create({
                content,
                userId: socket.userId,
                roomId,
                type,
                isAI: false,
            });

            // Get message with user data
            const messageWithUser = await Message.findByPk(message.id, {
                include: [
                    {
                        model: User,
                        as: "user",
                        attributes: ["id", "username", "avatar"],
                    },
                ],
            });

            // Broadcast to all users in the room
            this.io.to(`room_${roomId}`).emit("new_message", {
                message: messageWithUser,
                timestamp: new Date(),
            });

            console.log(`Message sent by ${socket.user.username} in room ${roomId}`);
        } catch (error) {
            console.error("Send message error:", error);
            socket.emit("error", { message: "Failed to send message" });
        }
    }

    // Handle real-time image message sending
    async handleSendImageMessage(socket, data) {
        try {
            const { roomId, imageUrl, filename } = data;

            if (!imageUrl || !roomId) {
                socket.emit("error", { message: "Image URL and roomId are required" });
                return;
            }

            // Verify room exists
            const room = await Room.findByPk(roomId);
            if (!room) {
                socket.emit("error", { message: "Room not found" });
                return;
            }

            // Create image message in database
            const message = await Message.create({
                content: imageUrl,
                userId: socket.userId,
                roomId,
                type: "image",
                isAI: false,
            });

            // Get message with user data
            const messageWithUser = await Message.findByPk(message.id, {
                include: [
                    {
                        model: User,
                        as: "user",
                        attributes: ["id", "username", "avatar"],
                    },
                ],
            });

            // Broadcast to all users in the room
            this.io.to(`room_${roomId}`).emit("new_message", {
                message: messageWithUser,
                timestamp: new Date(),
            });

            console.log(
                `Image message sent by ${socket.user.username} in room ${roomId}`
            );
        } catch (error) {
            console.error("Send image message error:", error);
            socket.emit("error", { message: "Failed to send image message" });
        }
    }

    // Handle typing indicators
    handleTypingStart(socket, data) {
        const { roomId } = data;
        socket.to(`room_${roomId}`).emit("user_typing", {
            user: socket.user,
            roomId: roomId,
            isTyping: true,
        });
    }

    handleTypingStop(socket, data) {
        const { roomId } = data;
        socket.to(`room_${roomId}`).emit("user_typing", {
            user: socket.user,
            roomId: roomId,
            isTyping: false,
        });
    }

    // Handle status updates
    handleUpdateStatus(socket, data) {
        const { status } = data; // online, away, busy, offline

        // Broadcast status to all rooms user is in
        socket.rooms.forEach((room) => {
            if (room.startsWith("room_")) {
                socket.to(room).emit("user_status_changed", {
                    user: socket.user,
                    status: status,
                    timestamp: new Date(),
                });
            }
        });
    }

    // Handle disconnect
    handleDisconnect(socket) {
        console.log(`User ${socket.user.username} disconnected`);

        // Remove from connected users
        this.connectedUsers.delete(socket.userId); // Remove from all room tracking
        this.roomUsers.forEach((users, roomId) => {
            if (users.has(socket.userId)) {
                users.delete(socket.userId);

                // Notify others in room
                socket.to(`room_${roomId}`).emit("user_disconnected", {
                    user: socket.user,
                    roomId: roomId,
                    timestamp: new Date(),
                });

                // Broadcast updated users list to remaining users in the room
                const roomUsers = this.getRoomUsers(roomId);
                socket.to(`room_${roomId}`).emit("users_update", roomUsers);

                // Clean up empty rooms
                if (users.size === 0) {
                    this.roomUsers.delete(roomId);
                }
            }
        });
    }

    // Utility method to broadcast AI messages
    broadcastAIMessage(roomId, messageData) {
        this.io.to(`room_${roomId}`).emit("new_message", {
            message: messageData,
            timestamp: new Date(),
            isAI: true,
        });
    }

    // Utility method to get online users in a room
    getRoomUsers(roomId) {
        const userIds = this.roomUsers.get(roomId) || new Set();
        return Array.from(userIds)
            .map((userId) => this.connectedUsers.get(userId)?.user)
            .filter(Boolean);
    }

    // Utility method to get total online users
    getOnlineUsersCount() {
        return this.connectedUsers.size;
    }

    // Utility method to broadcast room creation
    broadcastRoomCreated(roomData) {
        this.io.emit("room_created", {
            room: roomData,
            timestamp: new Date(),
        });
    }

    // Utility method to broadcast room deletion
    broadcastRoomDeleted(roomId, roomInfo) {
        // Notify all users in the room that it's being deleted
        this.io.to(`room_${roomId}`).emit("room_deleted", {
            room: roomInfo,
            timestamp: new Date(),
        });

        // Also broadcast to all users so they can update their room lists
        this.io.emit("room_removed", {
            roomId: roomId,
            timestamp: new Date(),
        });
    }
}

module.exports = SocketServer;