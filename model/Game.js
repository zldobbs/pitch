/* 
    Game
    define the characteristics of a single game 
*/

const mongoose = require('mongoose');

const GameSchema = mongoose.Schema({
    deck: [Number],
    t1p1: [Number],
    t1p2: [Number],
    t2p1: [Number],
    t2p2: [Number], 
    team1Score: Number,
    team2Score: Number,
    isActive: Boolean
});

const Game = module.exports = mongoose.model('Game', GameSchema);