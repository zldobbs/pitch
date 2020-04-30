/* routes for room functions */

const express = require('express');
const router = express.Router();
const shortid = require('shortid');

const GameAPI = require('./game');

const Room = require('../../model/Room');
const Team = require('../../model/Team');
const Player = require('../../model/Player');
const User = require('../../model/User');
const Utils = require('../../utility.js');
const auth = require('../../auth.json'); 

async function getRoom(roomId) {
  return await Room.findOne({ short_id: roomId.toUpperCase() }).exec();
}

async function getRoomPopulated(roomId) {
  return await Room.findOne({ short_id: roomId.toUpperCase() })
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
        populate: [
          { path: 'activePlayer', select: 'displayName isReady cardCount' },
          { path: 'biddingPlayer', select: 'displayName isReady cardCount' }
        ]});
}

async function startRoom(roomId) {
  let room = await getRoomPopulated(roomId); 
  if (room == undefined) {
    return undefined; 
  }

  // Create a new game 
  let game = await GameAPI.createNewGame(room);
  room.activeGame = game._id; 
  room.games.push(game._id);

  let activePlayer = await Player.getPlayerNoCards(game.activePlayer);
  room.roomStatus = `New game has begun! ${activePlayer.displayName} starts the bidding.`;
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
      player2: null,
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
    roomStatus: 'New room created',
    dealer: -1,
    games: [],
    messages: [],
    team1: newTeams[0],
    team2: newTeams[1],
    activeGame: null
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