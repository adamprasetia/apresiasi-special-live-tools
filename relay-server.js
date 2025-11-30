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
    
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Apresiasi Relay Server Running\n');
});

const wss = new WebSocket.Server({ server });

let dashboardClients = new Set();
let displayClients = new Set();

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
            }
        } catch (e) {
            console.error('Failed to parse message:', e);
        }
    });
    
    ws.on('close', () => {
        dashboardClients.delete(ws);
        displayClients.delete(ws);
        console.log('Client disconnected. Dashboards:', dashboardClients.size, 'Displays:', displayClients.size);
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

const PORT = 8765;
server.listen(PORT, () => {
    console.log(`Apresiasi Relay Server running on http://localhost:${PORT}`);
    console.log('WebSocket server running on ws://localhost:${PORT}');
});
