/* 
    User
    define the characteristics of a user's profile
*/

const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    username: {type: String, unique: true},
    passHash: String,
    salt: String,
    games: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }],
});

const User = module.exports = mongoose.model('User', UserSchema);