const { Room, User, UserRoom } = require("../models");

class RoomController {
    // Get all rooms
    static async getRooms(req, res, next) {
        try {
            const userId = req.user.id;
            const rooms = await Room.findAll({
                include: [
                    {
                        model: User,
                        as: "creator",
                        attributes: ["id", "username"],
                    },
                    {
                        model: UserRoom,
                        as: "userRooms",
                        where: { userId },
                        required: false,
                        attributes: ["userId", "joinedAt"],
                    },
                ],
            });

            // Add isJoined flag to each room
            const roomsWithJoinStatus = rooms.map((room) => {
                const roomData = room.toJSON();
                roomData.isJoined = roomData.userRooms && roomData.userRooms.length > 0;
                delete roomData.userRooms; // Remove userRooms array, we only needed it for the join status
                return roomData;
            });

            res.status(200).json(roomsWithJoinStatus);
        } catch (error) {
            console.log(error);
            next(error);
        }
    }

    // Create a new room
    static async createRoom(req, res, next) {
        try {
            const { name, description, isPrivate = false } = req.body;
            const userId = req.user.id;

            if (!name || name.trim().length === 0) {
                throw { name: "BadRequest", message: "Room name is required" };
            }

            if (name.trim().length > 50) {
                throw {
                    name: "BadRequest",
                    message: "Room name must be less than 50 characters",
                };
            }

            const room = await Room.create({
                name: name.trim(),
                description: description || null,
                isPrivate,
                createdBy: userId,
            });

            // Get room with creator info
            const roomWithCreator = await Room.findByPk(room.id, {
                include: [
                    {
                        model: User,
                        as: "creator",
                        attributes: ["id", "username"],
                    },
                ],
            });

            // Automatically join the creator to the room
            await UserRoom.create({
                userId,
                roomId: room.id,
                joinedAt: new Date(),
            });

            // Emit real-time room creation to all connected users
            const socketServer = req.app.get("socketServer");
            if (socketServer) {
                console.log(
                    `Broadcasting room_created event for room: ${roomWithCreator.name}`
                );
                socketServer.io.emit("room_created", {
                    room: roomWithCreator,
                    timestamp: new Date(),
                });
                console.log(`Room creation event broadcasted successfully`);
            } else {
                console.warn("Socket server not found, real-time updates disabled");
            }

            res.status(201).json({
                message: "Room created successfully",
                data: roomWithCreator,
            });
        } catch (error) {
            console.log(error);
            next(error);
        }
    }

    // Delete a room
    static async deleteRoom(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Check if room exists
            const room = await Room.findByPk(id);
            if (!room) {
                throw { name: "NotFound", message: "Room not found" };
            }

            // Check if user is the creator of the room
            if (room.createdBy !== userId) {
                throw {
                    name: "Forbidden",
                    message: "Only the room creator can delete this room",
                };
            }

            // Get room info before deletion for broadcast
            const roomInfo = {
                id: room.id,
                name: room.name,
                createdBy: room.createdBy,
            };

            // Delete the room (cascade will handle UserRoom and Message deletions)
            await room.destroy();

            // Emit real-time room deletion to all connected users
            const socketServer = req.app.get("socketServer");
            if (socketServer) {
                console.log(`Broadcasting room deletion: room_${id}`);

                // Notify all users in the room that it's being deleted
                socketServer.io.to(`room_${id}`).emit("room_deleted", {
                    room: roomInfo,
                    timestamp: new Date(),
                });

                // Also broadcast to all users so they can update their room lists
                console.log(`Broadcasting room_removed event for room ${id}`);
                socketServer.io.emit("room_removed", {
                    roomId: parseInt(id),
                    timestamp: new Date(),
                });
                console.log(`Room deletion events broadcasted successfully`);
            } else {
                console.warn("Socket server not found, real-time updates disabled");
            }

            res.status(200).json({
                message: "Room deleted successfully",
            });
        } catch (error) {
            console.log(error);
            next(error);
        }
    }

    // Join a room
    static async joinRoom(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const room = await Room.findByPk(id);
            if (!room) {
                throw { name: "NotFound", message: "Room not found" };
            }
            const [userRoom, created] = await UserRoom.findOrCreate({
                where: {
                    userId,
                    roomId: id,
                },
            });

            if (created) {
                res.status(200).json({
                    message: "Successfully joined room",
                    userRoom: {
                        id: userRoom.id,
                        userId: userRoom.userId,
                        roomId: userRoom.roomId,
                        joinedAt: userRoom.joinedAt,
                    },
                });
            } else {
                res.status(200).json({ message: "Already a member of this room" });
            }
        } catch (error) {
            console.log(error);
            next(error);
        }
    }
    // Leave a room
    static async leaveRoom(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Check if room exists
            const room = await Room.findByPk(id);
            if (!room) {
                throw { name: "NotFound", message: "Room not found" };
            }

            const deleted = await UserRoom.destroy({
                where: {
                    userId,
                    roomId: id,
                },
            });

            if (deleted) {
                res.status(200).json({ message: "Successfully left room" });
            } else {
                throw { name: "NotFound", message: "Not a member of this room" };
            }
        } catch (error) {
            console.log(error);
            next(error);
        }
    }
}

module.exports = RoomController;