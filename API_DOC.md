# Chat-Cord API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
This API uses JWT (JSON Web Token) for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Endpoints

### List of available endpoints:

**Public Routes:**
- `GET /` - Server health check
- `POST /register` - User registration
- `POST /login` - User login

**Routes below need authentication:**

**Room Management:**
- `GET /rooms` - Get all rooms
- `POST /rooms/:id/join` - Join a room
- `DELETE /rooms/:id/leave` - Leave a room

**Message Management:**
- `GET /rooms/:roomId/messages` - Get messages in a room
- `POST /rooms/:roomId/messages` - Send a text message
- `POST /rooms/:roomId/messages/image` - Send an image message

**AI Features:**
- `GET /ai/status` - Get AI service status
- `POST /rooms/:roomId/ai/summary` - Generate AI summary
- `GET /rooms/:roomId/ai/summaries` - Get AI summary history
- `POST /rooms/:roomId/ai/response` - Generate AI response

---

## API Endpoints

### 1. GET /
Server health check.

**Request:**
```
GET /
```

**Response (200 - OK):**
```json
{
    "message": "Chat-Cord Server is running!"
}
```

---

### 2. POST /register
Register a new user.

**Request:**
```json
{
    "username": "string",
    "email": "string",
    "password": "string"
}
```

**Response (201 - Created):**
```json
{
    "id": "integer",
    "username": "string",
    "email": "string"
}
```

**Response (400 - Bad Request):**
```json
{
    "message": "Username is required"
}
```
OR
```json
{
    "message": "Email is required"
}
```
OR
```json
{
    "message": "Password is required"
}
```
OR
```json
{
    "message": "Username already exists. Please choose a different username."
}
```
OR
```json
{
    "message": "Email address already exists. Please use a different email."
}
```

---

### 3. POST /login
Login user.

**Request:**
```json
{
    "email": "string",
    "password": "string"
}
```

**Response (200 - OK):**
```json
{
    "access_token": "string",
    "id": "integer",
    "username": "string",
    "status": "string"
}
```

**Response (400 - Bad Request):**
```json
{
    "message": "Email is required"
}
```
OR
```json
{
    "message": "Password is required"
}
```

**Response (401 - Unauthorized):**
```json
{
    "message": "Invalid email/password"
}
```

---

### 4. GET /rooms
Get all available rooms.

**Request:**
```
headers:
{
    "Authorization": "Bearer <access_token>"
}
```

**Response (200 - OK):**
```json
[
    {
        "id": "integer",
        "name": "string",
        "description": "string",
        "isPrivate": "boolean",
        "createdBy": "integer",
        "createdAt": "string",
        "updatedAt": "string",
        "creator": {
            "id": "integer",
            "username": "string"
        }
    }
]
```

**Response (401 - Unauthorized):**
```json
{
    "message": "Invalid token"
}
```

---

### 5. POST /rooms/:id/join
Join a room.

**Request:**
```
headers:
{
    "Authorization": "Bearer <access_token>"
}
params:
{
    "id": "integer"
}
```

**Response (200 - OK):**
```json
{
    "message": "Successfully joined room",
    "userRoom": {
        "id": "integer",
        "userId": "integer",
        "roomId": "integer",
        "joinedAt": "string"
    }
}
```
OR
```json
{
    "message": "Already a member of this room"
}
```

**Response (401 - Unauthorized):**
```json
{
    "message": "Invalid token"
}
```

**Response (404 - Not Found):**
```json
{
    "message": "Room not found"
}
```

---

### 6. DELETE /rooms/:id/leave
Leave a room.

**Request:**
```
headers:
{
    "Authorization": "Bearer <access_token>"
}
params:
{
    "id": "integer"
}
```

**Response (200 - OK):**
```json
{
    "message": "Successfully left room"
}
```

**Response (401 - Unauthorized):**
```json
{
    "message": "Invalid token"
}
```

**Response (404 - Not Found):**
```json
{
    "message": "Room not found"
}
```
OR
```json
{
    "message": "Not a member of this room"
}
```

---

### 7. GET /rooms/:roomId/messages
Get messages from a specific room.

**Request:**
```
headers:
{
    "Authorization": "Bearer <access_token>"
}
params:
{
    "roomId": "integer"
}
query:
{
    "limit": "integer", // optional, default: 50
    "offset": "integer" // optional, default: 0
}
```

**Response (200 - OK):**
```json
[
    {
        "id": "integer",
        "content": "string",
        "type": "string", // "text" or "image"
        "isAI": "boolean",
        "userId": "integer",
        "roomId": "integer",
        "createdAt": "string",
        "updatedAt": "string",
        "user": {
            "id": "integer",
            "username": "string",
            "avatar": "string"
        }
    }
]
```

**Response (401 - Unauthorized):**
```json
{
    "message": "Invalid token"
}
```

**Response (404 - Not Found):**
```json
{
    "message": "Room not found"
}
```

---

### 8. POST /rooms/:roomId/messages
Send a text message to a room.

**Request:**
```
headers:
{
    "Authorization": "Bearer <access_token>"
}
params:
{
    "roomId": "integer"
}
body:
{
    "content": "string",
    "type": "string" // optional, default: "text"
}
```

**Response (201 - Created):**
```json
{
    "message": "Message sent successfully",
    "data": {
        "id": "integer",
        "content": "string",
        "type": "string",
        "isAI": "boolean",
        "userId": "integer",
        "roomId": "integer",
        "createdAt": "string",
        "updatedAt": "string",
        "user": {
            "id": "integer",
            "username": "string",
            "avatar": "string"
        }
    }
}
```

**Response (400 - Bad Request):**
```json
{
    "message": "Message content is required"
}
```

**Response (401 - Unauthorized):**
```json
{
    "message": "Invalid token"
}
```

**Response (404 - Not Found):**
```json
{
    "message": "Room not found"
}
```

---

### 9. POST /rooms/:roomId/messages/image
Send an image message to a room.

**Request:**
```
headers:
{
    "Authorization": "Bearer <access_token>",
    "Content-Type": "multipart/form-data"
}
params:
{
    "roomId": "integer"
}
body:
{
    "image": "file" // Image file
}
```

**Response (201 - Created):**
```json
{
    "message": "Image message sent successfully",
    "data": {
        "id": "integer",
        "content": "string", // Cloudinary image URL
        "type": "image",
        "isAI": "boolean",
        "userId": "integer",
        "roomId": "integer",
        "createdAt": "string",
        "updatedAt": "string",
        "user": {
            "id": "integer",
            "username": "string",
            "avatar": "string"
        }
    }
}
```

**Response (400 - Bad Request):**
```json
{
    "message": "Image file is required"
}
```
OR
```json
{
    "message": "File too large. Maximum size is 5MB"
}
```
OR
```json
{
    "message": "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed"
}
```

**Response (401 - Unauthorized):**
```json
{
    "message": "Invalid token"
}
```

**Response (404 - Not Found):**
```json
{
    "message": "Room not found"
}
```

---

### 10. GET /ai/status
Get AI service status.

**Request:**
```
headers:
{
    "Authorization": "Bearer <access_token>"
}
```

**Response (200 - OK):**
```json
{
    "message": "AI service status retrieved successfully",
    "data": {
        "isConfigured": "boolean",
        "service": "string", // "OpenAI GPT-4.1-nano" or "Fallback summary generator"
        "features": {
            "summarization": "boolean",
            "chatCompletion": "boolean",
            "fallbackMode": "boolean"
        }
    }
}
```

**Response (401 - Unauthorized):**
```json
{
    "message": "Invalid token"
}
```

---

### 11. POST /rooms/:roomId/ai/summary
Generate AI summary of room messages.

**Request:**
```
headers:
{
    "Authorization": "Bearer <access_token>"
}
params:
{
    "roomId": "integer"
}
```

**Response (201 - Created):**
```json
{
    "message": "Summary generated successfully using AI method",
    "data": {
        "id": "integer",
        "content": "string", // AI-generated summary
        "type": "text",
        "isAI": true,
        "userId": "integer",
        "roomId": "integer",
        "createdAt": "string",
        "updatedAt": "string",
        "user": {
            "id": "integer",
            "username": "string",
            "avatar": "string"
        }
    },
    "method": "string" // "ai" or "fallback"
}
```

**Response (401 - Unauthorized):**
```json
{
    "message": "Invalid token"
}
```

**Response (404 - Not Found):**
```json
{
    "message": "Room not found"
}
```

---

### 12. GET /rooms/:roomId/ai/summaries
Get AI summary history for a room.

**Request:**
```
headers:
{
    "Authorization": "Bearer <access_token>"
}
params:
{
    "roomId": "integer"
}
query:
{
    "limit": "integer", // optional, default: 10
    "offset": "integer" // optional, default: 0
}
```

**Response (200 - OK):**
```json
{
    "message": "Summary history retrieved successfully",
    "data": [
        {
            "id": "integer",
            "content": "string",
            "type": "text",
            "isAI": true,
            "userId": "integer",
            "roomId": "integer",
            "createdAt": "string",
            "updatedAt": "string",
            "user": {
                "id": "integer",
                "username": "string",
                "avatar": "string"
            }
        }
    ],
    "total": "integer"
}
```

**Response (401 - Unauthorized):**
```json
{
    "message": "Invalid token"
}
```

**Response (404 - Not Found):**
```json
{
    "message": "Room not found"
}
```

---

### 13. POST /rooms/:roomId/ai/response
Generate AI response to a prompt.

**Request:**
```
headers:
{
    "Authorization": "Bearer <access_token>"
}
params:
{
    "roomId": "integer"
}
body:
{
    "prompt": "string",
    "context": "integer" // optional, default: 5, number of recent messages for context
}
```

**Response (201 - Created):**
```json
{
    "message": "AI response generated successfully",
    "data": {
        "id": "integer",
        "content": "string", // AI-generated response
        "type": "text",
        "isAI": true,
        "userId": "integer",
        "roomId": "integer",
        "createdAt": "string",
        "updatedAt": "string",
        "user": {
            "id": "integer",
            "username": "string",
            "avatar": "string"
        }
    },
    "prompt": "string"
}
```

**Response (400 - Bad Request):**
```json
{
    "message": "Prompt is required"
}
```

**Response (401 - Unauthorized):**
```json
{
    "message": "Invalid token"
}
```

**Response (404 - Not Found):**
```json
{
    "message": "Room not found"
}
```

**Response (503 - Service Unavailable):**
```json
{
    "message": "AI service is not configured. Please set up OpenAI API key."
}
```

---

## Socket.io Events

### Authentication
Socket connections require JWT authentication:
```javascript
const socket = io('http://localhost:3000', {
    auth: {
        token: 'your-jwt-token'
    }
});
```

### Client Events (Emit)
- `join_room` - Join a room
- `leave_room` - Leave a room
- `send_message` - Send a text message
- `send_image_message` - Send an image message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `update_status` - Update user status

### Server Events (Listen)
- `connected` - Connection confirmation
- `room_joined` - Room join confirmation
- `room_left` - Room leave confirmation
- `new_message` - New message received
- `user_joined` - User joined room
- `user_left` - User left room
- `user_typing` - User typing status
- `user_status_changed` - User status update
- `user_disconnected` - User disconnected
- `error` - Error message

### Example Socket Usage:
```javascript
// Join a room
socket.emit('join_room', { roomId: 1 });

// Send a message
socket.emit('send_message', {
    roomId: 1,
    content: 'Hello everyone!',
    type: 'text'
});

// Listen for new messages
socket.on('new_message', (data) => {
    console.log('New message:', data.message);
});

// Typing indicators
socket.emit('typing_start', { roomId: 1 });
socket.emit('typing_stop', { roomId: 1 });
```

---

## Global Error Responses

**Response (500 - Internal Server Error):**
```json
{
    "message": "Internal server error"
}
```

**Response (401 - Unauthorized):**
```json
{
    "message": "Invalid token"
}
```
OR
```json
{
    "message": "Authentication token required"
}
```

**Response (403 - Forbidden):**
```json
{
    "message": "Access denied"
}
```

---

## Data Models

### User
```json
{
    "id": "integer",
    "username": "string",
    "email": "string",
    "avatar": "string",
    "status": "online|offline",
    "lastSeen": "string",
    "createdAt": "string",
    "updatedAt": "string"
}
```

### Room
```json
{
    "id": "integer",
    "name": "string",
    "description": "string",
    "isPrivate": "boolean",
    "createdBy": "integer",
    "createdAt": "string",
    "updatedAt": "string"
}
```

### Message
```json
{
    "id": "integer",
    "content": "string",
    "type": "text|image",
    "isAI": "boolean",
    "userId": "integer",
    "roomId": "integer",
    "createdAt": "string",
    "updatedAt": "string"
}
```

### UserRoom (Junction Table)
```json
{
    "userId": "integer",
    "roomId": "integer",
    "joinedAt": "string"
}
```
