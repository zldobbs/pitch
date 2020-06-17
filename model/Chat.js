/* 
    Chat
    define the characteristics of chat messages 
*/

const mongoose = require('mongoose');

const ChatSchema = mongoose.Schema({
  player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
  message: String, 
  timestamp: Date
});

const Chat = module.exports = mongoose.model('Chat', ChatSchema);