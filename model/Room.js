/* 
    Room
    define the characteristics of a game room 
*/

const mongoose = require('mongoose');

const RoomSchema = mongoose.Schema({
    short_id: { type: String, unique: true },
    roomStatus: String, 
    dealer: Number,
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

module.exports.getRoomWithTeams = async (roomId) => {
    return await Room.findOne({ _id: roomId })
    .populate({ path: 'team1', 
        populate: [
            { path: 'player1', select: 'displayName isReady cardCount' }, 
            { path: 'player2', select: 'displayName isReady cardCount' }
        ]})
    .populate({ path: 'team2', 
        populate: [
            { path: 'player1' }, 
            { path: 'player2' }
        ]});
}

module.exports.getRoomWithTeamsAndGame = async (roomId) => {
    return await Room.findOne({ activeGame: game._id })
    .populate({ path: 'team1', 
      populate: [
        { path: 'player1', select: 'displayName isReady cardCount' }, 
        { path: 'player2', select: 'displayName isReady cardCount' }
      ]})
    .populate({ path: 'team2', 
      populate: [
        { path: 'player1' }, 
        { path: 'player2' }
      ]})
    .populate({ 
      path: 'activeGame', select: 'bid suit biddingPlayer activePlayer activePlayerIndex team1Score team2Score', 
        populate: { path: 'activePlayer', select: 'displayName isReady cardCount' }});
}