/* 
    Game
    define the characteristics of a single game 
*/

const mongoose = require('mongoose');

const GameSchema = mongoose.Schema({
    deck: [Number], 
    bid: Number,
    biddingTeam: Number, 
    suit: Number, 
    activePlayer: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    team1Score: Number,
    team2Score: Number,
    isActive: Boolean
});

const Game = module.exports = mongoose.model('Game', GameSchema);