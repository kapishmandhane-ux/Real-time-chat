const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const FriendRequest = require('../src/models/FriendRequest');
const Message = require('../src/models/Message');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

describe('Full System API Verification Flow', () => {
  let user1Token, user2Token;
  let user1Id, user2Id;
  let friendRequestId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    await User.deleteMany({});
    await FriendRequest.deleteMany({});
    await Message.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('1. User 1 Signup', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      username: 'alice',
      email: 'alice@example.com',
      password: 'password123'
    });
    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    user1Token = res.body.data.token;
    user1Id = res.body.data.user.id;
  });

  it('2. User 2 Signup', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      username: 'bob',
      email: 'bob@example.com',
      password: 'password123'
    });
    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    user2Token = res.body.data.token;
    user2Id = res.body.data.user.id;
  });

  it('3. Search User', async () => {
    const res = await request(app)
      .get('/api/users/search?query=bob')
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].username).toBe('bob');
  });

  it('4. Send Friend Request', async () => {
    const res = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ receiverId: user2Id });
    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    friendRequestId = res.body.data._id;
  });

  it('5. Accept Friend Request', async () => {
    const res = await request(app)
      .post('/api/friends/accept')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ requestId: friendRequestId });
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it('6. Verify Friends List', async () => {
    const res = await request(app)
      .get('/api/friends')
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0]._id).toBe(user2Id);
  });

  it('7. Get Message History (Empty)', async () => {
    const res = await request(app)
      .get(`/api/messages/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBe(0);
  });

  it('8. Upload File', async () => {
    // Create a dummy file for testing
    const filePath = path.join(__dirname, 'test.txt');
    fs.writeFileSync(filePath, 'Hello world');

    const res = await request(app)
      .post('/api/uploads')
      .set('Authorization', `Bearer ${user1Token}`)
      .attach('file', filePath);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.mediaUrl).toBeDefined();

    fs.unlinkSync(filePath); // Cleanup
  });
});
