/* routes for room functions */

const express = require('express');
const router = express.Router();
const shortid = require('shortid');

const GameAPI = require('./game');

const Room = require('../../model/Room');
const Team = require('../../model/Team');
const User = require('../../model/User');
const Utils = require('../../utility.js');
const auth = require('../../auth.json'); 

async function getRoom(roomId) {
  return await Room.findOne({ short_id: roomId.toUpperCase() }).exec();
}

async function getRoomPopulated(roomId) {
  return await Room.findOne({ short_id: roomId.toUpperCase() }).populate('team1').populate('team2');
}

async function startRoom(roomId) {
  let room = await getRoomPopulated(roomId); 
  if (room == undefined) {
    return undefined; 
  }

  // Create a new game 
  let game = await GameAPI.createNewGame();
  room.activeGame = game._id; 
  room.games.push(game._id);
  return room.save();
}

router.post('/', async (req, res) => {
  // Generate a room id, will be different than the mongo id
  // Useful for sharing with friends
  shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@$');
  let short_id = shortid.generate();
  // Ensure the id is unique to the database 
  while ((await getRoom(short_id)) != undefined) {
    console.log("Generating another id...");
    short_id = shortid.generate();
  }

  // Create two new teams for the new room 
  let newTeams = [];
  for (let teamNum = 0; teamNum < 2; teamNum++) {
    newTeams.push(new Team({
      name: `Team ${teamNum+1}`, 
      score: 0,
      player1: null,
      player1DisplayName: '',
      player1Ready: false, 
      player2: null,
      player2DisplayName: '',
      player2Ready: false 
    }));
    newTeams[teamNum].save().catch(err => {
      console.log(err);
      res.json({
        "status": "error",
        "details": "There was an error saving a team to the database."
      });
    });
  }

  // Create the new room
  let newRoom = new Room({ 
    short_id: short_id.toUpperCase(),
    games: [],
    messages: [],
    team1: newTeams[0],
    team2: newTeams[1],
    isActive: false
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

router.get('/:roomId', async (req, res) => {
  const roomId = req.params['roomId'].toUpperCase();
  let room = await getRoomPopulated(roomId);
  if (room == undefined) {
    res.json({
      "status": "error",
      "details": "Unable to find requested room"
    });
  }
  else {
    res.json({
      "status": "success",
      "room": room 
    })
  }
});

module.exports = router;

module.exports.startRoom = startRoom;