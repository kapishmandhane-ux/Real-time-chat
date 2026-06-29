# KapChat - Real-Time Chat Application

KapChat is a robust, full-stack real-time chat application designed for seamless communication, media sharing, and instant connectivity.

## Features Built

This project fulfills all three levels of the assessment:

### Level 1: The Foundation
- **Authentication**: Secure JWT-based Login and Registration. Passwords are encrypted using `bcrypt`.
- **User Search**: Dedicated endpoint to search for users by their unique username.
- **Friendship Logic**: Complete Many-to-Many friend request flow (Send, Accept, Reject, Remove).
- **Persistence**: MongoDB stores all user profiles and friendship statuses securely.

### Level 2: The Real-Time Shift
- **One-to-One Messaging**: Lightning-fast real-time messaging powered by `Socket.io`.
- **Message Persistence**: All chats are permanently saved to MongoDB, persisting across refreshes.
- **Online/Offline Status**: Real-time presence indicators track whether friends are currently connected.
- **Error Handling**: Socket disconnections and reconnections are handled gracefully with state recovery.

### Level 3: Advanced Architecture
- **Read/Unread Receipts**: Messages track their exact state (`sent`, `delivered`, `read`) with real-time UI updates (double-ticks).
- **Media Support**: Full support for sending Images, Videos, and PDF/Document files via `multer` file uploads.
- **Middleware & Security**: `express-rate-limit` is implemented to prevent API abuse, and `helmet` secures HTTP headers.
- **Performance**: Pagination is implemented for fetching chat history (`?page=1&limit=50`), and MongoDB schemas are properly indexed for rapid queries.

---

## Instructions to Run Locally

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (Running locally or a MongoDB Atlas URI)

### 1. Setup the Backend
```bash
cd backend
npm install
```
Ensure you have a `.env` file in the `backend` directory with the following variables:
```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
```
Start the backend server:
```bash
npm run dev
```

### 2. Setup the Frontend
The frontend uses Vanilla HTML/CSS/JS (No bundler required).
```bash
cd frontend
npx http-server -p 5500 --cors
```
Open your browser and navigate to `http://localhost:5500`.

---

## API Documentation
The backend includes fully automated Swagger API documentation.
Once the backend is running, visit:
**`http://localhost:5001/api-docs`**

This interactive UI allows you to explore and test all RESTful endpoints (Auth, Users, Friends, Messages, Uploads).

---

## The Deep Dive

### Database Schema Choices
We chose **MongoDB** (NoSQL) alongside **Mongoose** due to its flexibility with unstructured data (like varying message types and media) and horizontal scalability for high-velocity write operations common in chat apps.

- **User Schema**: Stores authentication credentials, profile data, and an array of `friends` (References to other User ObjectIds). Storing the friends array directly on the user document ensures incredibly fast access to a user's friend list without requiring complex SQL joins.
- **FriendRequest Schema**: Tracks the `sender`, `receiver`, and `status` (`pending`, `accepted`, `rejected`). This decouples the request logic from the core User schema, keeping the User document lightweight.
- **Message Schema**: Relates heavily to the User schema via `sender` and `receiver` ObjectIds. 
  - **Indexing Strategy**: We added a compound index on `{ sender: 1, receiver: 1, createdAt: -1 }`. When fetching chat history between two users, this index allows MongoDB to instantly locate the exact conversation thread and sort it chronologically without scanning the entire collection, ensuring the query remains `O(log N)` even as the database grows to millions of messages.

### Handling Real-Time WebSockets
We selected **Socket.io** over raw WebSockets because of its robust feature set, including automatic reconnections, built-in multiplexing (namespaces/rooms), and fallback polling (useful for restrictive corporate firewalls).

- **Authentication at the Socket Level**: Sockets are authenticated via JWT during the initial handshake. If a token is invalid, the connection is immediately rejected, ensuring our real-time layer is just as secure as our REST API.
- **State Management**: We maintain an in-memory `userSocketMap` mapping `userId` to `socketId`. This `O(1)` lookup table allows us to instantly determine if a user is online and route direct messages to their exact active socket without broadcasting to the entire server.
- **Event-Driven Architecture**: When a user sends a message, it is first saved to MongoDB to ensure persistence. Upon successful save, the server emits a `receive_message` event directly to the recipient's socket. This guarantees that no messages are lost, even if a user momentarily disconnects during transit.
