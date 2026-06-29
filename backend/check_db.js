const mongoose = require('mongoose');

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/chatapp', { useNewUrlParser: true, useUnifiedTopology: true });
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const FriendRequest = mongoose.model('FriendRequest', new mongoose.Schema({}, { strict: false }));

  const users = await User.find({});
  console.log('USERS:');
  users.forEach(u => console.log(u.username, u._id, 'Friends:', u.friends));

  const reqs = await FriendRequest.find({});
  console.log('REQUESTS:');
  reqs.forEach(r => console.log('Sender:', r.sender, 'Receiver:', r.receiver, 'Status:', r.status));

  mongoose.disconnect();
}
check();
