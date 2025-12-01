// Simple WebSocket relay server for cross-browser communication
// Install dependencies: npm install ws
// Run: node relay-server.js

const WebSocket = require('ws');
const http = require('http');

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Health check endpoint
    if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            service: 'Apresiasi Relay Server',
            dashboards: dashboardClients.size,
            displays: displayClients.size,
            timestamp: new Date().toISOString()
        }));
        return;
    }
    
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Apresiasi Relay Server Running\nWebSocket: ws://localhost:8765\nHealth: http://localhost:8765/health\n');
});

const wss = new WebSocket.Server({ server });

let dashboardClients = new Set();
let displayClients = new Set();
let apiClients = new Set();

wss.on('connection', (ws) => {
    console.log('New client connected');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            // Identify client type
            if (data.clientType === 'dashboard') {
                dashboardClients.add(ws);
                console.log('Dashboard connected. Total dashboards:', dashboardClients.size);
                
                // Relay command to all displays
                if (data.command) {
                    displayClients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(data.command));
                        }
                    });
                }
            } else if (data.clientType === 'display') {
                displayClients.add(ws);
                console.log('Display connected. Total displays:', displayClients.size);
                
                // Relay status to all dashboards
                if (data.status) {
                    dashboardClients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(data.status));
                        }
                    });
                }
            } else if (data.clientType === 'api') {
                apiClients.add(ws);
                console.log('API Server connected. Total API servers:', apiClients.size);
            } else if (data.type === 'API_DONATION') {
                // Broadcast donation from API to all dashboards
                console.log('📬 Received donation from API, broadcasting to dashboards...');
                dashboardClients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(data));
                    }
                });
            }
        } catch (e) {
            console.error('Failed to parse message:', e);
        }
    });
    
    ws.on('close', () => {
        dashboardClients.delete(ws);
        displayClients.delete(ws);
        apiClients.delete(ws);
        console.log('Client disconnected. Dashboards:', dashboardClients.size, 'Displays:', displayClients.size, 'APIs:', apiClients.size);
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

const PORT = 8765;
server.listen(PORT, () => {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║   Apresiasi Relay Server                   ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log(`🚀 HTTP Server: http://localhost:${PORT}`);
    console.log(`🔌 WebSocket Server: ws://localhost:${PORT}`);
    console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
    console.log('');
    console.log('Waiting for connections...\n');
});
