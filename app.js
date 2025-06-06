if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}
const express = require("express");
const cors = require("cors");
const http = require("http");

// Import database models
const UserController = require("./controllers/userController");
const RoomController = require("./controllers/roomController");
const MessageController = require("./controllers/messageController");
const AIController = require("./controllers/aiController");
const authentication = require("./midllewares/authentication");
const errorHandler = require("./midllewares/errorHandler");
const multerErrorHandler = require("./midllewares/multerErrorHandler");
const upload = require("./config/multer");
const SocketServer = require("./socket/socketServer");

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

// Initialize Socket.io server
const socketServer = new SocketServer(server);

// Make socket server available to controllers
app.set("socketServer", socketServer);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.status(200).json({ message: "Chat-Cord Server is running!" });
});

// Auth routes
app.post("/register", UserController.register);
app.post("/login", UserController.login);

app.use(authentication);

// Room routes (protected)
app.get("/rooms", RoomController.getRooms);
app.post("/rooms", RoomController.createRoom);
app.delete("/rooms/:id", RoomController.deleteRoom);
app.post("/rooms/:id/join", RoomController.joinRoom);
app.delete("/rooms/:id/leave", RoomController.leaveRoom);

// Message routes (protected)
app.get("/rooms/:roomId/messages", MessageController.getMessages);
app.post("/rooms/:roomId/messages", MessageController.createMessage);
app.post(
    "/rooms/:roomId/messages/image",
    upload.single("image"),
    multerErrorHandler,
    MessageController.createImageMessage
);

// AI routes (protected)
app.get("/ai/status", AIController.getAIStatus);
app.post("/rooms/:roomId/ai/summary", AIController.generateSummary);
app.get("/rooms/:roomId/ai/summaries", AIController.getSummaryHistory);
app.post("/rooms/:roomId/ai/response", AIController.generateResponse);

// Error handling middleware
app.use(errorHandler);

server.listen(port, () => {
    console.log(`Chat-Cord app listening on http://localhost:${port}`);
    console.log("Socket.io server initialized and ready for connections");
});