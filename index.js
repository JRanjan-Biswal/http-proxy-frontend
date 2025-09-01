const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const app = express();

app.use(cors());

// Proxy setup
app.use('/', createProxyMiddleware({
    target: 'https://www.himatsingka.com',  // Replace with your target URL
    changeOrigin: true,
    selfHandleResponse: false,
    onProxyRes: (proxyRes) => {
        // Remove headers that block iframe embedding
        delete proxyRes.headers['x-frame-options'];
        delete proxyRes.headers['content-security-policy'];
        delete proxyRes.headers['frame-options'];
    }
}));

const port = 3000;
app.listen(port, () => {
    console.log(`Proxy server running at http://localhost:${port}/proxy`);
});
