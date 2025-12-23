const mongoose = require('mongoose');

const LobbySchema = new mongoose.Schema({
    host: { type: String, required: true }, // Ideally User ID later
    game: { type: String, required: true },
    map: { type: String, required: true },
    mode: { type: String, required: true },
    rank: { type: String },
    gender: { type: String, default: 'Any' },
    mic: { type: Boolean, default: false },
    status: { type: String, enum: ['Open', 'Full', 'In-Game'], default: 'Open' },
    discordLink: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lobby', LobbySchema);
