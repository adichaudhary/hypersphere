#!/usr/bin/env node
/**
 * Local dev server: starts backend + serves frontend
 * Single command to run everything locally
 */

import { spawn } from 'child_process';
import http from 'http';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BACKEND_PORT = 3001;
const FRONTEND_PORT = 8080;

console.log('🚀 Tap-to-Pay Local Dev Server');
console.log('===============================\n');

// Start backend
console.log(`Starting backend on http://localhost:${BACKEND_PORT}...`);
const backend = spawn('node', ['backend/src/index.js'], { cwd: __dirname, stdio: 'inherit' });

// Start frontend server
setTimeout(() => {
  console.log(`\nStarting frontend on http://localhost:${FRONTEND_PORT}...`);
  
  const frontendServer = http.createServer((req, res) => {
    let filePath = join(__dirname, 'web', req.url === '/' ? 'index.html' : req.url);

    // Inject BACKEND_URL into app.js at runtime (legacy)
    if (filePath.endsWith('app.js')) {
      try {
        let content = readFileSync(filePath, 'utf-8');
        // This will override the BACKEND_URL constant (place it at top of app.js)
        content = `window.BACKEND_URL = 'http://localhost:${BACKEND_PORT}';\n${content}`;
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(content);
        return;
      } catch (e) {
        // ignore
      }
    }

    // Inject BACKEND_URL into index.html for built frontends (Vite/React)
    if (filePath.endsWith('index.html')) {
      try {
        let content = readFileSync(filePath, 'utf-8');
        const inject = `<script>window.BACKEND_URL = 'http://localhost:${BACKEND_PORT}';</script>`;
        // Insert the injected script before </head>
        if (content.includes('</head>')) {
          content = content.replace('</head>', `${inject}</head>`);
        } else {
          content = `${inject}\n${content}`;
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
        return;
      } catch (e) {
        // ignore
      }
    }

    // Serve static files
    try {
      if (existsSync(filePath)) {
        const ext = filePath.split('.').pop();
        const contentTypes = {
          html: 'text/html',
          js: 'application/javascript',
          css: 'text/css',
          json: 'application/json',
          png: 'image/png',
          jpg: 'image/jpeg',
          gif: 'image/gif',
          svg: 'image/svg+xml',
        };
        const contentType = contentTypes[ext] || 'text/plain';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(readFileSync(filePath));
      } else {
        res.writeHead(404);
        res.end('404 Not Found');
      }
    } catch (e) {
      res.writeHead(500);
      res.end(`Error: ${e.message}`);
    }
  });

  frontendServer.listen(FRONTEND_PORT, () => {
    console.log(`\n✅ Local dev server ready!\n`);
    console.log(`Frontend:  http://localhost:${FRONTEND_PORT}`);
    console.log(`Backend:   http://localhost:${BACKEND_PORT}`);
    console.log(`\nTo create a test payment, run:`);
    console.log(`  curl -X POST http://localhost:${BACKEND_PORT}/payment_intents \\`);
    console.log(`    -H "Content-Type: application/json" \\`);
    console.log(`    -d '{"amount": 1000000, "merchant_id": "test"}'`);
    console.log(`\nThen open the payment_url in your browser.\n`);
    console.log(`Press Ctrl+C to stop.\n`);
  });
}, 2000); // Wait 2s for backend to start

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down...');
  backend.kill();
  process.exit(0);
});
