const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// WebSocket client to relay server
let relayWs = null;
let relayReconnectTimer = null;

function connectToRelayServer() {
    try {
        // relayWs = new WebSocket('ws://localhost:8765');
        relayWs = new WebSocket('wss://apresiasi-special-live-tools-production-de43.up.railway.app');
        
        relayWs.on('open', () => {
            console.log('✅ Connected to Relay Server (port 8765)');
            // Identify as API server
            relayWs.send(JSON.stringify({ clientType: 'api' }));
        });
        
        relayWs.on('close', () => {
            console.log('❌ Disconnected from Relay Server');
            relayWs = null;
            // Try to reconnect after 5 seconds
            if (relayReconnectTimer) clearTimeout(relayReconnectTimer);
            relayReconnectTimer = setTimeout(connectToRelayServer, 5000);
        });
        
        relayWs.on('error', (error) => {
            console.warn('⚠️  Relay Server not available (will retry)');
        });
    } catch (e) {
        console.warn('Failed to connect to Relay Server:', e);
    }
}

// Connect to relay server on startup
connectToRelayServer();

// Function to send donation to relay server
function sendToRelayServer(donation) {
    if (relayWs && relayWs.readyState === WebSocket.OPEN) {
        relayWs.send(JSON.stringify({
            type: 'API_DONATION',
            donation: donation
        }));
        console.log('📤 Sent to relay server');
    } else {
        console.warn('⚠️  Relay server not connected, donation not broadcasted');
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Apresiasi API Server is running',
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
        
        // Send to relay server (will broadcast to all dashboards)
        sendToRelayServer(donation);
        
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
    console.log('');
    console.log('Available Endpoints:');
    console.log(`  GET  http://localhost:${PORT}/health`);
    console.log(`  POST http://localhost:${PORT}/api/donations`);
    console.log('');
    console.log('Note: WebSocket relay available at ws://localhost:8765');
    console.log('Waiting for donations...\n');
});
