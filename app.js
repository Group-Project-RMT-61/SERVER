require('dotenv').config()
const express = require('express')
const cors = require('cors')

// Import database models
const UserController = require('./controllers/userController')
const errorHandler = require('./midllewares/errorHandler')

const app = express()
const port = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Auth routes
app.post("/register", UserController.register)
app.post("/login", UserController.login)

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Chat-Cord Server is running!' })
})

// Error handling middleware
app.use(errorHandler)

app.listen(port, () => {
    console.log(`Chat-Cord app listening on http://localhost:${port}`)
})
