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
  return await Room.findOne({ short_id: roomId.toUpperCase() })
    .populate({ path: 'team1', 
      populate: [
        { path: 'player1', select: 'displayName isReady cardCount playedCard' }, 
        { path: 'player2', select: 'displayName isReady cardCount playedCard' }
      ]})
    .populate({ path: 'team2', 
      populate: [
        { path: 'player1', select: 'displayName isReady cardCount playedCard' }, 
        { path: 'player2', select: 'displayName isReady cardCount playedCard' }
      ]})
    .populate({ path: 'messages', 
      populate: { path: 'player', select: 'displayName' }
    })
    .populate({ 
      path: 'activeGame', select: 'bid suit suitName biddingPlayer activePlayer activePlayerIndex team1Score team2Score team1PointsInRound team2PointsInRound', 
        populate: [
          { path: 'activePlayer', select: 'displayName isReady cardCount' },
          { path: 'biddingPlayer', select: 'displayName isReady cardCount' }
        ]});
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

    // Emit notification that the room is ready for gameplay
    req.app.io.to(room.short_id).emit('room-ready', room.short_id);
  }

  res.json({
    "status": "success",
    "player": player
  });
});

router.post('/changeName', async (req, res) => {
  let player = await getPlayer(req.body['player']);
  if (!player) {
    res.json({
      "status": "error",
      "details": "Error: Player does not exist"
    });
    return; 
  }

  player.displayName = req.body['name'];
  await player.save(); 

  const updatedRoom = await getRoomPopulated(req.body['room']);
  if (!updatedRoom) {
    res.json({
      "status": "Error",
      "details": "Player is not in a room"
    });
    return; 
  }

  req.app.io.to(updatedRoom.short_id).emit('room-update', updatedRoom);

  res.json({
    "status": "success",
    "details": "Updated player name"
  });
});

module.exports = router;
