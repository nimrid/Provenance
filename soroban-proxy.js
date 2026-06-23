const http = require('http');
const https = require('https');

// Ignore TLS errors for the proxy target
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const TARGET_URL = 'https://soroban-testnet.stellar.org';

const server = http.createServer((req, res) => {
    const targetUrl = new URL(req.url, TARGET_URL);
    
    const options = {
        hostname: targetUrl.hostname,
        port: targetUrl.port || 443,
        path: targetUrl.pathname + targetUrl.search,
        method: req.method,
        headers: {
            ...req.headers,
            host: targetUrl.host
        }
    };

    const proxyReq = https.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        console.error('Proxy error:', err);
        res.writeHead(500);
        res.end('Proxy error');
    });

    req.pipe(proxyReq);
});

const PORT = 8000;
server.listen(PORT, () => {
    console.log(`Proxy listening on http://127.0.0.1:${PORT}`);
});
