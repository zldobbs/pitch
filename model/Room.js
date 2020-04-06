/* 
    Room
    define the characteristics of a game room 
*/

const mongoose = require('mongoose');

const RoomSchema = mongoose.Schema({
    games: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }],
    messages: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        message: String
    }]
});

const Room = module.exports = mongoose.model('Game', RoomSchema);