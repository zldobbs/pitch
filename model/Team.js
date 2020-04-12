/* 
    Team
    define the characteristics of a team playing the game
*/

const mongoose = require('mongoose');

const TeamSchema = mongoose.Schema({
    name: String, 
    score: Number,
    player1: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    player1DisplayName: String,
    player1Ready: Boolean, 
    player2: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    player2DisplayName: String,
    player2Ready: Boolean
});

const User = module.exports = mongoose.model('Team', TeamSchema);