@echo off
title Busan Convenience Store Map Server
echo ========================================================
echo   Busan Convenience Store Map Web Server
echo ========================================================
echo   Starting web server on http://localhost:8080 ...
echo ========================================================

node -e "const http = require('http'); const fs = require('fs'); const path = require('path'); const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' }; http.createServer((req, res) => { let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url.split('?')[0]); if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) { res.writeHead(404); res.end('Not Found'); return; } const ext = path.extname(filePath).toLowerCase(); res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' }); fs.createReadStream(filePath).pipe(res); }).listen(8080, () => { console.log('Server running on http://localhost:8080'); require('child_process').exec('start http://localhost:8080'); });"
pause
