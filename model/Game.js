/* 
    Game
    define the characteristics of a single game 
*/

const mongoose = require('mongoose');

const GameSchema = mongoose.Schema({
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    isActive: Boolean,
    team1: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    team2: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }
});

const Game = module.exports = mongoose.model('Game', GameSchema);