/* 
    Player
    player model for the game 
*/

const mongoose = require('mongoose');

const User = require('./User');
const Utils = require('../utility.js');

const PlayerSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    displayName: String,
    isReady: Boolean,
    hand: [Number],
    cardCount: Number,
    playedCard: Number
});

const Player = module.exports = mongoose.model('Player', PlayerSchema);

module.exports.getPlayerWithCards = async (playerId) => {
  return Player.findOne({ _id: playerId }).populate('user');
}

module.exports.getPlayerNoCards = async (playerId) => {
  return Player.findOne({ _id: playerId }).select('displayName cardCount isReady');
}

module.exports.createPlayer = async (user) => {
  let displayName; 
  if (!user) {
    user = await User.getDefaultUser();
    displayName = Utils.randomName();
  }
  else {
    displayName = user.username; 
  }

  let newPlayer = new Player({
    user: user,
    displayName: displayName,
    isReady: false, 
    hand: [], 
    cardCount: 0,
    playedCard: -1
  });

  return newPlayer.save();
}