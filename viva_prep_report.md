# KapChat - Backend Architecture & Viva Preparation Report

This report outlines the technical decisions, architecture, and security implementations of the KapChat backend. It is designed to prepare you for your Viva/Interview, directly addressing the requirements from your assignment.

---

## 1. Technology Stack Choices

> [!NOTE]
> **Viva Question**: *Why did you choose Node.js over FastAPI?*

**Node.js & Express:** I chose Node.js because of its asynchronous, event-driven architecture, which is inherently designed to handle massive amounts of concurrent I/O operations (like thousands of active WebSockets) without blocking the main thread. While FastAPI is excellent for heavy data processing, Node.js has a vastly more mature ecosystem for real-time web applications, and `Socket.io` is widely considered the industry standard for this use case.

> [!NOTE]
> **Viva Question**: *Why MongoDB over PostgreSQL?*

**MongoDB (NoSQL):** Chat applications require extremely high-velocity write operations and flexible schemas. 
1. **Flexibility:** Messages can be plain text, or they can include varied media types (images, videos, PDFs) with different metadata. A NoSQL document structure allows us to easily evolve this schema without complex database migrations.
2. **Speed & Scaling:** MongoDB scales horizontally out-of-the-box through sharding, making it ideal for the massive volume of data a chat app generates.

---

## 2. Schema Design & Optimization

> [!NOTE]
> **Viva Question**: *How efficiently do you relate users and messages?*

To ensure the database doesn't become a bottleneck, the schema is highly optimized:

1. **User Schema (`User.js`)**: Instead of a separate join table (which SQL would require), the `User` document contains a `friends` array of ObjectIds. This allows for `O(1)` retrieval of a user's friend list during connection.
2. **Message Schema (`Message.js`)**: 
   - Each message stores the `sender` and `receiver` ObjectIds. 
   - **Optimization (The Deep Dive):** I implemented a **Compound Index** on the `Message` collection: `{ sender: 1, receiver: 1, createdAt: -1 }`. When a user opens a chat, MongoDB doesn't scan the entire database; it instantly jumps to this index to fetch and sort the specific conversation in `O(log N)` time.
   - **Pagination**: The API uses `page` and `limit` queries so we only load 50 messages at a time, drastically reducing memory usage and payload size.

---

## 3. Real-Time WebSockets & Scaling

> [!NOTE]
> **Viva Question**: *How does your WebSocket implementation scale?*

1. **Why Socket.io?** It provides built-in fallback to HTTP long-polling if a corporate firewall blocks native WebSockets, ensuring the app works everywhere. It also handles automatic reconnections gracefully.
2. **State Management**: The backend maintains an in-memory `userSocketMap` mapping `userId` -> `socketId`. 
   - When User A sends a message to User B, the server doesn't broadcast it to everyone. It performs an `O(1)` lookup in the map to find User B's exact socket and routes the event directly to them.
3. **Scaling Strategy (Future-proofing):** If the app grows beyond one server, this architecture is ready for `Socket.io-Redis-Adapter`. By swapping the in-memory map for a Redis Pub/Sub instance, multiple Node.js servers can share socket connections, allowing horizontal scaling.

---

## 4. Security & Middleware

Security was a primary focus for Level 3 of the task. The application is fortified at multiple layers:

1. **Authentication (JWT & Hashing)**: 
   - Passwords are never stored in plain text. They are hashed using `bcrypt` with a generated salt before reaching the database.
   - Stateless `JSON Web Tokens (JWT)` are issued upon login, removing the need for server-side sessions and allowing the API to scale easily.
2. **Socket Security**: The WebSockets are not open to the public. During the socket handshake, the JWT token is passed and verified. Unauthenticated sockets are instantly disconnected.
3. **Rate Limiting**: I implemented `express-rate-limit` middleware. It restricts IPs to 100 requests per 15-minute window, effectively preventing brute-force login attacks and API spam.
4. **HTTP Header Protection**: The `helmet` package is used to set secure HTTP headers, protecting against cross-site scripting (XSS) and clickjacking.
5. **Input Validation**: Mongoose schemas enforce strict validation (e.g., email regex matching, length requirements) to prevent NoSQL injection and malformed data entry.

---

## 5. Advanced Architecture Features (Level 3)

- **Read/Unread Receipts**: The database tracks `status: ['sent', 'delivered', 'read']`. When a user opens a chat history, a background API call updates all unread messages from that sender to 'read', which then triggers a socket event to update the UI double-ticks in real-time.
- **Media Support**: Implemented `multer` for robust file uploading. The API validates MIME types (accepting only safe images, videos, and PDFs), saves the file locally to `/uploads`, and stores a lightweight pointer (URL) in the MongoDB message document.

---

## 💡 Quick Cheat Sheet for the Viva

If the examiner asks:

* **"What happens if the database goes down while a message is sent?"**
  * *Answer:* "The REST API encapsulates the save operation in a `try/catch` block. If the database fails, it returns a 500 error to the frontend, preventing the socket `receive_message` event from firing. This ensures the UI never falsely shows a message as sent if it wasn't persisted."
* **"How do you handle a user having multiple tabs open?"**
  * *Answer:* "Currently, the `userSocketMap` overwrites the socket ID if they connect from a new tab. To support multiple tabs perfectly, we would upgrade the map to store an array of `socketIds` per `userId`, and iterate through that array to emit the message to all active tabs."
