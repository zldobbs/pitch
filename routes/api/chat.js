/* routes for login functions */

const express = require('express');
const Chat = require('../../model/Chat');
const Room = require('../../model/Room');
const router = express.Router();

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

router.post('/', async (req, res) => {
  let room = await getRoomPopulated(req.body['roomId']);
  if (!room) {
    res.json({
      "status": "error", 
      "details": "Room ID did not match existing room"
    });
    return; 
  }

  let players = [room.team1.player1, room.team1.player2, room.team2.player1, room.team2.player2];
  let requestingPlayer = null; 
  for (let i = 0; i < players.length; i++) {
    if (players[i] !== null && players[i]._id.toString() === req.body['player'].toString()) {
      requestingPlayer = players[i];
      break; 
    }
  }

  if (requestingPlayer === null) {
    res.json({
      "status": "error",
      "details": "Player is not in room"
    });
    return; 
  }

  let newMessage = new Chat({
    player: requestingPlayer, 
    message: req.body['message'],
    timestamp: new Date()
  });

  await newMessage.save(); 

  room.messages.push(newMessage); 
  await room.save(); 

  let updatedRoom = await getRoomPopulated(req.body['roomId']);

  req.app.io.to(updatedRoom.short_id).emit('room-update', (updatedRoom));
  console.log('Sending new message');
  req.app.io.to(updatedRoom.short_id).emit('new-message', (newMessage));

  res.json({
    "status": "success"
  });
});

module.exports = router;
