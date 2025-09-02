const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const path = require('path');
const https = require('https');
const http = require('http');
const app = express();

// CORS will be handled manually in each route

// Handle favicon.ico request
app.get('/favicon.ico', (req, res) => {
    res.status(204).end(); // Send "No Content" status
});

// Serve the index.html file for the root path
app.get('/', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

// Serve static files from src directory
app.use('/static', express.static(path.join(__dirname, 'src')));

// Simple test endpoint
app.get('/test', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`
        <html>
        <head><title>Proxy Test</title></head>
        <body style="background: lightblue; padding: 20px; font-family: Arial;">
            <h1>✅ Proxy Server is Working!</h1>
            <p>This is a test page to verify the proxy server is running correctly.</p>
            <p>If you can see this, the server is working fine.</p>
            <p><a href="/proxy">Click here to test the Himatsingka proxy</a></p>
        </body>
        </html>
    `);
});

// Custom proxy endpoint that fetches content directly
app.get('/proxy', (req, res) => {
    const targetUrl = 'https://www.himatsingka.com/';
    console.log('Fetching:', targetUrl);
    
    const options = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Upgrade-Insecure-Requests': '1'
        }
    };
    
    https.get(targetUrl, options, (proxyRes) => {
        console.log('Response status:', proxyRes.statusCode);
        
        // Set status code
        res.statusCode = proxyRes.statusCode;
        
        // Clear all headers first
        res.getHeaderNames().forEach(name => {
            res.removeHeader(name);
        });
        
        // Set only the headers we want
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.setHeader('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; frame-ancestors *");
        
        // Handle redirects
        if (proxyRes.headers.location) {
            console.log('Redirecting to:', proxyRes.headers.location);
            const redirectUrl = proxyRes.headers.location.replace('https://www.himatsingka.com', 'http://localhost:3000/proxy');
            res.redirect(redirectUrl);
            return;
        }
        
        // Collect the response data
        let data = '';
        proxyRes.on('data', (chunk) => {
            data += chunk;
        });
        
        proxyRes.on('end', () => {
            // Modify the HTML to remove any frame-busting scripts and add iframe-friendly content
            if (data.includes('<script')) {
                data = data.replace(/<script[^>]*>[\s\S]*?window\.top[\s\S]*?<\/script>/gi, '');
                data = data.replace(/<script[^>]*>[\s\S]*?parent\.location[\s\S]*?<\/script>/gi, '');
                data = data.replace(/<script[^>]*>[\s\S]*?top\.location[\s\S]*?<\/script>/gi, '');
            }
            
            // Add a simple test message at the top
            const testMessage = '<div style="background: yellow; padding: 10px; text-align: center; font-weight: bold;">✅ PROXY WORKING - This is the Himatsingka website loaded through our proxy!</div>';
            data = data.replace('<body', testMessage + '<body');
            
            res.end(data);
        });
        
    }).on('error', (err) => {
        console.error('Proxy error:', err);
        res.status(500).send('Proxy error: ' + err.message);
    });
});

// Handle all other proxy paths
app.get('/proxy/*', (req, res) => {
    const targetUrl = 'https://www.himatsingka.com' + req.path.replace('/proxy', '');
    console.log('Fetching:', targetUrl);
    
    const options = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Upgrade-Insecure-Requests': '1'
        }
    };
    
    https.get(targetUrl, options, (proxyRes) => {
        console.log('Response status:', proxyRes.statusCode);
        
        // Set status code
        res.statusCode = proxyRes.statusCode;
        
        // Clear all headers first
        res.getHeaderNames().forEach(name => {
            res.removeHeader(name);
        });
        
        // Set only the headers we want
        res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'text/html');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.setHeader('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; frame-ancestors *");
        
        // Handle redirects
        if (proxyRes.headers.location) {
            console.log('Redirecting to:', proxyRes.headers.location);
            const redirectUrl = proxyRes.headers.location.replace('https://www.himatsingka.com', 'http://localhost:3000/proxy');
            res.redirect(redirectUrl);
            return;
        }
        
        // Collect the response data
        let data = '';
        proxyRes.on('data', (chunk) => {
            data += chunk;
        });
        
        proxyRes.on('end', () => {
            // Modify the HTML to remove any frame-busting scripts
            if (data.includes('<script')) {
                data = data.replace(/<script[^>]*>[\s\S]*?window\.top[\s\S]*?<\/script>/gi, '');
                data = data.replace(/<script[^>]*>[\s\S]*?parent\.location[\s\S]*?<\/script>/gi, '');
                data = data.replace(/<script[^>]*>[\s\S]*?top\.location[\s\S]*?<\/script>/gi, '');
            }
            res.end(data);
        });
        
    }).on('error', (err) => {
        console.error('Proxy error:', err);
        res.status(500).send('Proxy error: ' + err.message);
    });
});

const port = 3000;
app.listen(port, () => {
    console.log(`Proxy server running at http://localhost:${port}`);
});
