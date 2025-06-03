const { Room, User, UserRoom } = require('../models')

class RoomController {
    // Get all rooms
    static async getRooms(req, res, next) {
        try {
            const rooms = await Room.findAll({
                include: [
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'username']
                    }
                ]
            });
            res.status(200).json(rooms);
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
                    roomId: id
                }
            });

            if (created) {
                res.status(200).json({
                    message: "Successfully joined room",
                    userRoom: {
                        id: userRoom.id,
                        userId: userRoom.userId,
                        roomId: userRoom.roomId,
                        joinedAt: userRoom.joinedAt
                    }
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
                    roomId: id
                }
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

module.exports = RoomController