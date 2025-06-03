require('dotenv').config()
const express = require('express')
const cors = require('cors')

// Import database models
const UserController = require('./controllers/userController')
const RoomController = require('./controllers/roomController')
const authentication = require('./midllewares/authentication')
const errorHandler = require('./midllewares/errorHandler')

const app = express()
const port = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Chat-Cord Server is running!' })
})

// Auth routes
app.post("/register", UserController.register)
app.post("/login", UserController.login)

app.use(authentication)

// Room routes (protected)
app.get("/rooms", RoomController.getRooms)
app.post("/rooms/:id/join", RoomController.joinRoom)
app.delete("/rooms/:id/leave", RoomController.leaveRoom)

// Error handling middleware
app.use(errorHandler)

app.listen(port, () => {
    console.log(`Chat-Cord app listening on http://localhost:${port}`)
})
