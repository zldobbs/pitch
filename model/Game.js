/* 
    Game
    define the characteristics of a single game 
*/

const mongoose = require('mongoose');

const GameSchema = mongoose.Schema({
    deck: [Number], 
    suit: String, 
    team1Score: Number,
    team2Score: Number,
    isActive: Boolean
});

const Game = module.exports = mongoose.model('Game', GameSchema);