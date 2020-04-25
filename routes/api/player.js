/* routes for player functions */

const express = require('express');
const router = express.Router();

const Player = require('../../model/Player');
const Room = require('../../model/Room');

const RoomAPI = require('./room'); 

async function getPlayer(playerId) {
  return await Player.findOne({ _id: playerId }).exec();
}

async function getRoomPopulated(roomId) {
  return await Room.findOne({ _id: roomId })
    .populate({ path: 'team1', populate: [{ path: 'player1', select: 'displayName isReady cardCount' }, { path: 'player2', select: 'displayName isReady cardCount' }]})
    .populate({ path: 'team2', populate: [{ path: 'player1' }, { path: 'player2' }]});
}

router.get('/:playerId', async (req, res) => {
  const playerId = req.params['playerId'];
  let player = await Player.getPlayerWithCards(playerId);
  res.json({
    player: player
  });
});

router.post('/ready', async (req, res) => {
  const playerId = req.body['playerId'];
  const roomId = req.body['roomId'];

  if (!playerId || !roomId) {
    res.json({
      "status": "error",
      "details": "Invalid identifiers provided"
    });
    return; 
  }

  let player = await getPlayer(playerId); 
  player.isReady = !player.isReady; 
  await player.save(); 

  const updatedRoom = await getRoomPopulated(roomId);
  req.app.io.to(updatedRoom.short_id).emit('room-update', (updatedRoom));

  // Check if all players are ready
  if ((updatedRoom.team1.player1 && updatedRoom.team1.player2 && updatedRoom.team2.player1 && updatedRoom.team2.player2) && (updatedRoom.team1.player1.isReady && updatedRoom.team1.player2.isReady 
    && updatedRoom.team2.player1.isReady && updatedRoom.team2.player2.isReady)) {
    // Start the room 
    let room = await RoomAPI.startRoom(updatedRoom.short_id);
    req.app.io.to(room.short_id).emit('room-ready', room.short_id);
  }

  res.json({
    "status": "success",
    "player": player
  });
});

module.exports = router;
