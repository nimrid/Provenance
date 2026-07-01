const fetch = require('node-fetch');

async function testStolen() {
  const serialNumber = 'H-2024-TEST-999';
  const secret = '12345';
  
  console.log('Reporting stolen...');
  const res = await fetch('http://localhost:3000/api/prove/stolen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ serialNumber, secret })
  });

  const data = await res.json();
  console.log(data);
}

testStolen();
