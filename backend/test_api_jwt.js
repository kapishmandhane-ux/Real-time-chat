const http = require('http');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: '6a40fef5ab58a5b020911b6f' }, 'supersecretjwtkey_12345', { expiresIn: '7d' });

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/friends',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('FRIENDS API RESPONSE:', data);
  });
});
req.end();
