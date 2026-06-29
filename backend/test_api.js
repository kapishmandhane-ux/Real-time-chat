const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const token = json.token;
    
    const options2 = {
      hostname: 'localhost',
      port: 5001,
      path: '/api/friends',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    };
    const req2 = http.request(options2, (res2) => {
      let data2 = '';
      res2.on('data', chunk => data2 += chunk);
      res2.on('end', () => {
        console.log('FRIENDS RESPONSE:', data2);
      });
    });
    req2.end();
  });
});

req.write(JSON.stringify({ email: 'johndoe@example.com', password: 'password123' }));
req.end();
