const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const port = 3000;

// Middleware to parse JSON payloads
app.use(bodyParser.json());

// test endpoint
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// In-memory storage for player positions
const playerPositions = {};

// Create a new player with a random position
function createPlayer(ws) {
    const x = Math.floor(Math.random() * 800 - 400);
    const y = Math.floor(Math.random() * 600 - 300);
    playerPositions[ws.id] = { x, y };
    console.log('Player created at', x, y);
}

// Create HTTP server and WebSocket server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Broadcast player positions to all connected clients every second
setInterval(() => {
    const data = JSON.stringify({ type: 'positions', positions: playerPositions });
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}, 10);

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.id = wss.getUniqueID();
    createPlayer(ws);
    const data = JSON.stringify({ type: 'identification', id: ws.id, position: playerPositions[ws.id]});
    ws.send(data);

    
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'position-update') {
            playerPositions[ws.id] = data.position;
        }
    });

    ws.on('close', () => {
        delete playerPositions[ws.id];
        console.log('Client disconnected');
    });
});



wss.getUniqueID = function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4();
};

// Start the server
server.listen(port, () => {
    console.log(`Server running`);
});
