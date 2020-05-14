/* 
    Game
    define the characteristics of a single game 
*/

const mongoose = require('mongoose');

const GameSchema = mongoose.Schema({
    deck: [Number], 
    table: [Number],
    bid: Number,
    biddingPlayer: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' }, 
    suit: Number, 
    suitName: String,
    activePlayer: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    activePlayerIndex: Number,
    team1Score: Number,
    team2Score: Number,
    isActive: Boolean,
    handsSet: Boolean
});

const Game = module.exports = mongoose.model('Game', GameSchema);