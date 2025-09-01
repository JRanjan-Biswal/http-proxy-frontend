const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();

// Enable CORS for all routes
app.use(cors());

// Proxy setup for Himatsingka.com
app.use('/', createProxyMiddleware({
    target: 'https://www.himatsingka.com',  // Back to himatsingka.com
    changeOrigin: true,
    selfHandleResponse: true,
    onProxyRes: (proxyRes, req, res) => {
        // Remove all headers that block iframe embedding
        delete proxyRes.headers['x-frame-options'];
        delete proxyRes.headers['content-security-policy'];
        delete proxyRes.headers['content-security-policy-report-only'];
        delete proxyRes.headers['frame-options'];
        delete proxyRes.headers['frame-ancestors'];
        
        // Set headers to explicitly allow iframe embedding
        res.setHeader('X-Frame-Options', 'ALLOWALL');
        res.setHeader('Content-Security-Policy', 'frame-ancestors *;');
        
        // Handle the response body
        let body = '';
        proxyRes.setEncoding('utf8');
        
        proxyRes.on('data', (chunk) => {
            body += chunk;
        });
        
        proxyRes.on('end', () => {
            // Modify HTML content to remove any CSP restrictions
            if (proxyRes.headers['content-type'] && 
                proxyRes.headers['content-type'].includes('text/html')) {
                
                // Remove CSP meta tags that might block iframe
                body = body.replace(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi, '');
                body = body.replace(/<meta[^>]*content-security-policy[^>]*>/gi, '');
                body = body.replace(/frame-ancestors[^;]*;?/gi, '');
                
                // Remove any JavaScript that might detect iframe
                body = body.replace(/if\s*\(\s*window\s*!==\s*top\s*\)[^}]*}/gi, '');
                body = body.replace(/if\s*\(\s*top\s*!==\s*self\s*\)[^}]*}/gi, '');
            }
            
            // Copy other headers (except the blocked ones)
            Object.keys(proxyRes.headers).forEach(key => {
                if (!['x-frame-options', 'content-security-policy', 
                      'content-security-policy-report-only'].includes(key.toLowerCase())) {
                    res.setHeader(key, proxyRes.headers[key]);
                }
            });
            
            res.status(proxyRes.statusCode);
            res.end(body);
        });
    },
    onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).send('Proxy error occurred');
    }
}));

const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`Proxy server running on port ${port}`);
    console.log(`Access Google via: http://localhost:${port}`);
});