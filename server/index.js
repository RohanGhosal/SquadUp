const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.get("/", (req, res) => {
    res.status(200).send("SquadUp backend is running 🚀");
});

// Explicit health check route
app.get("/health", (req, res) => {
    res.status(200).send("OK");
});

app.use(cors());
app.use(express.json());

const mongoose = require('mongoose');




// Routes (Basic)
const Lobby = require('./models/Lobby');

app.get('/lobbies', async (req, res) => {
    try {
        const lobbies = await Lobby.find().sort({ createdAt: -1 });
        res.json(lobbies);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/lobbies', async (req, res) => {
    try {
        const newLobby = new Lobby(req.body);
        await newLobby.save();

        // Real-time emit (V2 feature, adding early)
        io.emit('lobby_created', newLobby);

        res.status(201).json(newLobby);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_lobby', async ({ lobbyId, user }) => {
        socket.join(lobbyId); // Join socket room
        console.log(`User ${user.name} joined lobby ${lobbyId}`);

        try {
            // Add user to Lobby in DB if not already present
            const lobby = await Lobby.findById(lobbyId);
            if (lobby) {
                const isMember = lobby.members.some(m => m.userId === user.userId);
                if (!isMember) {
                    lobby.members.push(user);
                    await lobby.save();

                    // Notify everyone in the lobby (including sender) about the new member list
                    io.to(lobbyId).emit('lobby_updated', lobby);

                    // Notify everyone in the main menu that a lobby has changed (e.g. member count)
                    io.emit('lobby_list_updated', lobby);
                } else {
                    // Even if already member, send current state to the joining user
                    socket.emit('lobby_updated', lobby);
                }
            }
        } catch (err) {
            console.error("Error joining lobby:", err);
        }
    });

    socket.on('send_message', (data) => {
        // data: { lobbyId, user, message, time }
        io.to(data.lobbyId).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // TODO: Handle removing user from lobby on disconnect if desired (often tricky for quick reloads)
    });
});

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

// Debugging logs for deployment
console.log(`Starting server...`);
console.log(`PORT: ${PORT}`);
console.log(`MONGODB_URI defined: ${!!MONGODB_URI}`);

if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in environment variables");
    process.exit(1);
}

console.log(`Attempting to connect to MongoDB...`);

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');
        // Explicitly bind to 0.0.0.0 for Docker/Railway compatibility
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

