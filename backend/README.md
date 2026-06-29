# Real-Time Chat Backend

A production-quality Real-Time Chat Backend built with Node.js, Express, MongoDB, and Socket.IO.

## Project Overview
This project provides a robust backend for a real-time chat application. It includes user authentication (JWT), real-time messaging with Socket.IO, media uploads via Multer, friend request management, pagination, security best practices (Helmet, Rate Limiting, CORS), and Joi validation.

## Architecture
The project follows a modular, scalable architecture with separation of concerns:
- **Routes**: Define API endpoints and apply middleware.
- **Controllers**: Handle HTTP requests/responses and extract parameters.
- **Services**: Contain all core business logic and interact with the database.
- **Models**: Define MongoDB schemas using Mongoose.
- **Sockets**: Manage real-time event handlers and online user state.
- **Middleware**: Guard routes (JWT auth), validate requests, upload files, and centrally handle errors.

## Folder Structure
```
backend/
├── src/
│   ├── config/          # DB connection
│   ├── controllers/     # HTTP handlers
│   ├── services/        # Business logic
│   ├── models/          # DB schemas
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth, Error Handler, Uploads, Validators
│   ├── validators/      # Joi schemas
│   ├── sockets/         # Socket.IO handlers & Online user map
│   ├── utils/           # Error classes, helpers
│   ├── docs/            # Swagger setup
│   └── app.js           # Express app setup
├── uploads/             # Media uploads
├── tests/               # Test suites
├── server.js            # Entry point
└── package.json
```

## Installation & Running Locally

1. Clone the repository and navigate to the `backend` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables by copying `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Start a MongoDB instance (locally or via MongoDB Atlas).
5. Run the application:
   - Development mode: `npm run dev`
   - Production mode: `npm start`

## Environment Variables
- `PORT`: Server port (default 5000)
- `NODE_ENV`: 'development' or 'production'
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT signing
- `JWT_EXPIRE`: Expiration time for JWT (e.g., '7d')

## API Documentation
The API is documented using Swagger OpenAPI.
Once the server is running, navigate to:
`http://localhost:5000/api-docs`

## Socket.IO Events
- **connection**: Emitted upon connecting. Expects JWT token in handshake auth.
- **sendMessage**: Sends a message to a friend. Payload: `{ receiverId, text, mediaUrl, mediaType }`.
- **receiveMessage**: Listened by client to receive incoming messages.
- **messageDelivered**: Sent back when a receiver receives the message.
- **messageRead**: Marks messages as read.
- **typing / stopTyping**: Emits typing status to receiver.
- **userOnline / userOffline**: Broadcast to friends when a user connects/disconnects.

## Testing
Run the test suite using Jest:
```bash
npm test
```

## Future Improvements
- Implement Redis for Socket.IO adapter to support scaling across multiple Node.js processes.
- Add AWS S3 for media uploads instead of local storage.
- Add group chats functionality.
