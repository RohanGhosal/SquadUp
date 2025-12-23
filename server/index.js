const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
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
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_lobby', (lobbyId) => {
        socket.join(lobbyId);
        console.log(`User ${socket.id} joined lobby ${lobbyId}`);
    });

    socket.on('send_message', (data) => {
        // data: { lobbyId, user, message, time }
        io.to(data.lobbyId).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 4000;

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        server.listen(PORT, () => {
            console.log(`SERVER RUNNING ON PORT ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });

