const http = require('http');
const https = require('https');

const PORT = 8000;

const agent = new https.Agent({
  rejectUnauthorized: false,
});

const server = http.createServer((req, res) => {
  const options = {
    hostname: 'soroban-testnet.stellar.org',
    port: 443,
    path: req.url,
    method: req.method,
    headers: req.headers,
    agent: agent,
  };
  
  options.headers.host = 'soroban-testnet.stellar.org';

  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy request error:', err);
    res.writeHead(500);
    res.end('Proxy error');
  });

  req.pipe(proxyReq, { end: true });
});

server.listen(PORT, () => {
  console.log(`Proxy server listening on port ${PORT}`);
});
