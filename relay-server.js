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
        // Count campaigns
        const campaignStats = {};
        dashboardClients.forEach((info) => {
            campaignStats[info.campaign] = campaignStats[info.campaign] || { dashboards: 0, displays: 0 };
            campaignStats[info.campaign].dashboards++;
        });
        displayClients.forEach((info) => {
            campaignStats[info.campaign] = campaignStats[info.campaign] || { dashboards: 0, displays: 0 };
            campaignStats[info.campaign].displays++;
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            service: 'Apresiasi Relay Server',
            totalDashboards: dashboardClients.size,
            totalDisplays: displayClients.size,
            totalApis: apiClients.size,
            campaigns: campaignStats,
            timestamp: new Date().toISOString()
        }));
        return;
    }
    
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Apresiasi Relay Server Running\nWebSocket: ws://localhost:8765\nHealth: http://localhost:8765/health\n');
});

const wss = new WebSocket.Server({ server });

// Store clients with their campaign information
let dashboardClients = new Map(); // ws -> { campaign: string }
let displayClients = new Map();   // ws -> { campaign: string }
let apiClients = new Set();
// Track a primary dashboard per campaign (first one connected becomes primary)
let primaryByCampaign = new Map(); // campaign -> ws

function sendJson(ws, obj) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(obj));
    }
}

function notifyPrimaryStatus(campaign) {
    const primary = primaryByCampaign.get(campaign) || null;
    dashboardClients.forEach((info, client) => {
        if (info.campaign === campaign) {
            sendJson(client, { type: 'PRIMARY_STATUS', campaign, primary: client === primary });
        }
    });
}

function promoteNewPrimary(campaign) {
    let newPrimary = null;
    for (const [client, info] of dashboardClients.entries()) {
        if (info.campaign === campaign && client.readyState === WebSocket.OPEN) {
            newPrimary = client;
            break;
        }
    }
    if (newPrimary) {
        primaryByCampaign.set(campaign, newPrimary);
    } else {
        primaryByCampaign.delete(campaign);
    }
    notifyPrimaryStatus(campaign);
}

wss.on('connection', (ws) => {
    console.log('New client connected');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            // Identify client type
            if (data.clientType === 'dashboard') {
                const campaign = data.campaign || 'default';
                dashboardClients.set(ws, { campaign });
                if (!primaryByCampaign.has(campaign)) {
                    primaryByCampaign.set(campaign, ws);
                }
                notifyPrimaryStatus(campaign);
                console.log(`Dashboard connected to campaign: ${campaign}. Total dashboards:`, dashboardClients.size);
                
                // Relay command to displays in the same campaign
                if (data.command) {
                    displayClients.forEach((clientInfo, client) => {
                        if (clientInfo.campaign === campaign && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(data.command));
                        }
                    });
                }

                // Relay dashboard sync to other dashboards in the same campaign
                if (data.dashboardSync) {
                    dashboardClients.forEach((clientInfo, client) => {
                        if (client !== ws && clientInfo.campaign === campaign && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({ type: 'DASHBOARD_SYNC', payload: data.dashboardSync }));
                        }
                    });
                }
            } else if (data.clientType === 'display') {
                const campaign = data.campaign || 'default';
                displayClients.set(ws, { campaign });
                console.log(`Display connected to campaign: ${campaign}. Total displays:`, displayClients.size);
                
                // Relay status to dashboards in the same campaign
                if (data.status) {
                    dashboardClients.forEach((clientInfo, client) => {
                        if (clientInfo.campaign === campaign && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(data.status));
                        }
                    });
                }
            } else if (data.clientType === 'api') {
                apiClients.add(ws);
                console.log('API Server connected. Total API servers:', apiClients.size);
            } else if (data.type === 'API_DONATION') {
                // Forward donation from API only to the primary dashboard for the campaign
                const campaign = data.campaign || 'default';
                const primary = primaryByCampaign.get(campaign);
                if (primary && primary.readyState === WebSocket.OPEN) {
                    console.log(`📬 API donation for ${campaign} -> primary only`);
                    sendJson(primary, data);
                } else {
                    console.log(`📬 API donation for ${campaign} but no primary; attempting to promote and deliver`);
                    promoteNewPrimary(campaign);
                    const retryPrimary = primaryByCampaign.get(campaign);
                    if (retryPrimary && retryPrimary.readyState === WebSocket.OPEN) {
                        sendJson(retryPrimary, data);
                    } else {
                        // Fallback: broadcast to all dashboards if still no primary
                        dashboardClients.forEach((clientInfo, client) => {
                            if (clientInfo.campaign === campaign && client.readyState === WebSocket.OPEN) {
                                sendJson(client, data);
                            }
                        });
                    }
                }
            }
        } catch (e) {
            console.error('Failed to parse message:', e);
        }
    });
    
    ws.on('close', () => {
        const info = dashboardClients.get(ws);
        if (info) {
            const campaign = info.campaign;
            dashboardClients.delete(ws);
            if (primaryByCampaign.get(campaign) === ws) {
                promoteNewPrimary(campaign);
            } else {
                // Still notify others in campaign of status (not strictly necessary)
                notifyPrimaryStatus(campaign);
            }
        } else {
            dashboardClients.delete(ws);
        }
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
