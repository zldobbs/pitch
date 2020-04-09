/* 
    User
    define the characteristics of a user's profile
*/

const mongoose = require('mongoose');
const auth = require('../auth.json'); 

const UserSchema = mongoose.Schema({
    username: { type: String, unique: true },
    passHash: String,
    salt: String,
    games: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }],
});

const User = module.exports = mongoose.model('User', UserSchema);

module.exports.getDefaultUser = async () => {
    // Get the default user account for anonymous actions
    let user = await User.findOne({ username: auth.defaultUser.username }).exec();
    // If user was not found the database has not created it yet
    if (user == undefined) {
      let salt = Utils.generateSalt();
      let defaultUser = new User({
        username: auth.defaultUser.username,
        passHash: Utils.hashPassword(auth.defaultUser.password, salt),
        salt: salt
      });
      defaultUser.save().then(item => {
        user = item; 
      }).catch(err => {
        console.log('\nDatabase ERROR - ' + new Date(Date.now()).toLocaleString())
        console.log(err)
        return undefined;
      });
    }
    return user; 
}