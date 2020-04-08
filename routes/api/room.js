/* routes for login functions */

const express = require('express');
const router = express.Router();
const shortid = require('shortid');

const User = require('../../model/User');
const Room = require('../../model/Room');
const Utils = require('../../utility.js');
const auth = require('../../auth.json'); 

async function getRoom(roomId) {
  return await Room.findOne({ short_id: roomId.toUpperCase() }).exec();
}

router.post('/', async (req, res) => {
  // TODO We actually don't care about a user until the game itself has been started...
  // let user; 
  // if (req.body['username'] != undefined) {
  //   user = await (await User.findOne({ username: req.body['username'].toLowerCase() })).execPopulate();
  //   if (user == undefined) {
  //     console.log(`Unable to find user: ${req.body['username']}`);
  //     res.json({
  //       "status": "error",
  //       "details": `Unable to find user: ${req.body['username']}`
  //     });
  //   }
  // }
  // else {
  //   // No user provided, assign to default user
  //   user = await (await User.findOne({ username: auth.defaultUser.username })).execPopulate();
  //   // If user was not found the database has not created it yet
  //   if (user == undefined) {
  //     let salt = Utils.generateSalt();
  //     let defaultUser = new User({
  //       username: auth.defaultUser.username,
  //       passHash: Utils.hashPassword(auth.defaultUser.password, salt),
  //       salt: salt
  //     });
  //     defaultUser.save().then(item => {
  //       user = item; 
  //     }).catch(err => {
  //       console.log('\nDatabase ERROR - ' + new Date(Date.now()).toLocaleString())
  //       console.log(err)
  //       res.json({
  //         "status": "error",
  //         "details": "There was an error saving the default user to the database."
  //       });
  //     });
  //   }
  // }
  // At this point we have a user (may be default) and may begin creating a room 
  // Keep in mind that if the req.body['username'] is undefined we know it was requested by anon

  // Generate a room id, will be different than the mongo id
  // Useful for sharing with friends
  shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@$');
  let short_id = shortid.generate();
  // Ensure the id is unique to the database 
  while ((await getRoom(short_id)) != undefined) {
    console.log("Generating another id...");
    short_id = shortid.generate();
  }
  let newRoom = new Room({ 
    short_id: short_id.toUpperCase(),
    games: [],
    messages: []
  });
  newRoom.save().then(item => {
    res.json({
      "status": "success",
      "room": item
    });
  }).catch(err => {
    console.log(err);
    res.json({
      "status": "error",
      "details": "There was an error saving the room to the database."
    });
  });
});

router.get('/staging/:roomId', async (req, res) => {
  roomId = req.params['roomId'].toUpperCase();
  console.log(roomId);
  let room = await getRoom(roomId);
  if (room == undefined) {
    console.log('room undefined');
    res.json({
      "status": "error",
      "details": "Unable to find requested room"
    });
  }
  else {
    console.log(room);
    res.json({
      "status": "success",
      "room": room 
    })
  }
});

module.exports = router;