const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Store connected dashboard clients
let dashboardClients = new Set();

// WebSocket server for real-time updates to dashboard
const wss = new WebSocket.Server({ port: 8766 });

wss.on('connection', (ws) => {
    console.log('✅ Dashboard connected to API server');
    dashboardClients.add(ws);
    
    ws.on('close', () => {
        console.log('❌ Dashboard disconnected from API server');
        dashboardClients.delete(ws);
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        dashboardClients.delete(ws);
    });
});

// Broadcast donation to all connected dashboards
function broadcastToDashboards(donation) {
    const message = JSON.stringify({
        type: 'API_DONATION',
        donation: donation
    });
    
    dashboardClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
    
    console.log(`📢 Broadcast to ${dashboardClients.size} dashboard(s)`);
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Apresiasi API Server is running',
        connectedDashboards: dashboardClients.size,
        timestamp: new Date().toISOString()
    });
});

// POST donation endpoint
app.post('/api/donations', (req, res) => {
    try {
        const { name, amount, message, hideName } = req.body;
        
        // Validation
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Name is required'
            });
        }
        
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Valid amount is required (must be positive number)'
            });
        }
        
        // Create donation object
        const donation = {
            id: Date.now(),
            name: name.trim(),
            amount: parseInt(amount),
            message: message ? message.trim() : '',
            hideName: hideName === true || hideName === 'true',
            timestamp: new Date().toISOString(),
            source: 'api'
        };
        
        // Broadcast to connected dashboards
        broadcastToDashboards(donation);
        
        // Log
        console.log('💰 New donation received:', {
            name: donation.hideName ? 'Anonim' : donation.name,
            amount: `Rp ${donation.amount.toLocaleString('id-ID')}`,
            message: donation.message || '-'
        });
        
        // Response
        res.status(201).json({
            success: true,
            message: 'Donation received successfully',
            data: donation
        });
        
    } catch (error) {
        console.error('Error processing donation:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

// GET donations endpoint (for testing)
app.get('/api/donations', (req, res) => {
    res.json({
        success: true,
        message: 'Use POST method to submit donations',
        endpoints: {
            submit: 'POST /api/donations',
            health: 'GET /health'
        },
        example: {
            name: 'John Doe',
            amount: 50000,
            message: 'Semangat terus!',
            hideName: false
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        availableEndpoints: [
            'GET /health',
            'POST /api/donations',
            'GET /api/donations'
        ]
    });
});

// Start server
app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║   Apresiasi API Server                     ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log(`🚀 HTTP Server: http://localhost:${PORT}`);
    console.log(`🔌 WebSocket Server: ws://localhost:8766`);
    console.log('');
    console.log('Available Endpoints:');
    console.log(`  GET  http://localhost:${PORT}/health`);
    console.log(`  POST http://localhost:${PORT}/api/donations`);
    console.log('');
    console.log('Waiting for donations...\n');
});
