/* 
    Room
    define the characteristics of a game room 
*/

const mongoose = require('mongoose');

const RoomSchema = mongoose.Schema({
    short_id: { type: String, unique: true },
    roomStatus: String, 
    lastDealer: Number,
    activeGame: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
    games: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }],
    messages: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        message: String
    }],
    team1: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    team2: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
});

const Room = module.exports = mongoose.model('Room', RoomSchema);