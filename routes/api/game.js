/* routes for game functions */

/*
  Virtual model of the card deck
  Structure of cards based on integers: 
  - order: 2,3,4,...,Ace => 1,2,3,...,13
  - suits: 1-13 => Clubs
          14-26 => Diamonds
          27-39 => Hearts
          40-52 => Spades
          53    => Little Joker
          54    => Big Joker 
*/

const express = require('express');
const router = express.Router();

const Game = require('../../model/Game');
const Room = require('../../model/Room');
const Player = require('../../model/Player'); 

async function getRoomByActivePlayer(playerId) {
  // Given a player Id, find the game that player is the active player of (if one exists)
  let game = await Game.findOne({ activePlayer: playerId }).populate('activePlayer');
  if (!game) {
    return null;
  }

  return await Room.findOne({ activeGame: game._id })
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

function getNextPlayer(room) {
  let nextPlayer;
  switch(room.activeGame.activePlayerIndex) {
    case 0: {
      nextPlayer = room.team1.player1; 
      break; 
    }
    case 1: {
      nextPlayer = room.team2.player1;
      break;
    }
    case 2: {
      nextPlayer = room.team1.player2; 
      break; 
    }
    case 3: {
      nextPlayer = room.team2.player2; 
      break;
    }
    default: {
      return null; 
    }
  }
  return nextPlayer;
}

function getPlayerIndex(room, player) { 
  if (room.team1.player1._id === player._id) {
    return 0; 
  }
  if (room.team2.player1._id === player._id) {
    return 1; 
  }
  if (room.team1.player2._id === player._id) {
    return 2; 
  }
  if (room.team2.player2._id === player._id) {
    return 3; 
  }
  return -1; 
}

function shuffleDeck() {
  // Initializes an array of 54 integers [1,2,..54]
  let deck = [...Array(54+1).keys()].slice(1); 
  // Random swap with different element in the array to simulate a shuffle 
  for (let i = 0; i < deck.length; i++) {
    let swapSpot = Math.floor(Math.random() * 54);
    let temp = deck[swapSpot];
    deck[swapSpot] = deck[i];
    deck[i] = temp; 
  }

  return deck; 
}

async function setPlayerHand(playerId, hand) {
  let player = await Player.getPlayerWithCards(playerId); 

  player.hand = hand.sort((a, b) => a - b); 
  player.cardCount = hand.length; 
  await player.save();
  return; 
}

async function createNewGame(room) {
  let deck = shuffleDeck(); 
  
  // Give 9 cards to each player, denotes their hands 
  setPlayerHand(room.team1.player1._id, deck.splice(0,9));
  setPlayerHand(room.team1.player2._id, deck.splice(0,9));
  setPlayerHand(room.team2.player1._id, deck.splice(0,9));
  setPlayerHand(room.team2.player2._id, deck.splice(0,9));

  if (room.dealer < 0 || room.dealer > 3) {
    room.dealer = Math.floor(Math.random() * 4); 
  }
  else {
    room.dealer = (++room.dealer % 4); 
  }

  let firstPlayer;
  let firstPlayerIndex = ((room.dealer + 1) % 4);
  switch(firstPlayerIndex) {
    case 0: {
      firstPlayer = room.team1.player1._id; 
      break; 
    }
    case 1: {
      firstPlayer = room.team2.player1._id;
      break;
    }
    case 2: {
      firstPlayer = room.team1.player2._id; 
      break; 
    }
    case 3: {
      firstPlayer = room.team2.player2._id; 
      break;
    }
    default: {
      console.log("Error: Room's last dealer is invalid: " + room.dealer); 
      return null; 
    }
  }

  let newGame = new Game({
    deck: deck,
    bid: 0,
    biddingPlayer: null,
    suit: -1,
    activePlayer: firstPlayer,
    activePlayerIndex: firstPlayerIndex, 
    team1Score: 0, 
    team2Score: 0,
    isActive: true
  });

  await room.save(); 
  return newGame.save();
}

router.post('/hand', async (req, res) => {
  // Get the room
  const room = await Room.findOne({ $or: [{ team1: req.body['teamId'] }, { team2: req.body['teamId']}] }).populate('activeGame');

  if (!room) {
    res.json({
      "status": "error",
      "details": "Failed to find the room"
    });
    return; 
  }
  let hand; 
  if (req.body['teamId'] == room.team1) {
    // user is on team 1 
    hand = (req.body['playerNum'] == 'player1' ? room.activeGame.t1p1 : room.activeGame.t1p2); 
  }
  else {
    // user is on team 2
    hand = (req.body['playerNum'] == 'player1' ? room.activeGame.t2p1 : room.activeGame.t2p2); 
  }

  if (!hand) {
    res.json({
      "status": "error",
      "details": "Failed to find the room"
    });
    return; 
  }

  res.json({
    "status": "success", 
    "hand": hand 
  });
});

router.post('/setBid', async (req, res) => {
  // TODO Need to check if this user is the dealer -- if they are they are required to bid
  let room = await getRoomByActivePlayer(req.body['player']);
  if (!room) {
    res.json({
      "status": "error",
      "details": "Error: User is not active in any known game"
    });
    return;
  }

  let bid = req.body['bid'];
  if (bid > room.activeGame.bid) {
    room.activeGame.bid = bid;
  }
  else {
    res.json({
      "status": "error",
      "details": "Error: Bid set is lower than current bid"
    });
    return;
  }

  room.activeGame.biddingPlayer = room.activeGame.activePlayer;

  if (room.dealer === room.activeGame.activePlayerIndex) {
    room.roomStatus = `${room.activeGame.activePlayer.displayName} has won the bid with ${room.activeGame.bid}! They will now set the suit...`;
    room.activeGame.activePlayerIndex
  }
  else {
    room.roomStatus = `${room.activeGame.activePlayer.displayName} has set the bid to ${room.activeGame.bid}!`;
    room.activeGame.activePlayerIndex = (++room.activeGame.activePlayerIndex % 4); 
    room.activeGame.activePlayer = getNextPlayer(room); 
  }

  await room.activeGame.save(); 
  await room.save();

  req.app.io.to(room.short_id).emit('room-update', (room));

  res.json({
    "status": "success"
  });
});

router.post('/passBid', async (req, res) => {
  // TODO Need to check if this user is the dealer -- if they are they are required to bid
  // This should be reflected on the frontend
  let room = await getRoomByActivePlayer(req.body['player']);
  if (!room) {
    res.json({
      "status": "error",
      "details": "Error: User is not active in any known game"
    });
    return;
  }

  if (room.dealer === room.activeGame.activePlayerIndex) {
    if (room.activeGame.bid === 0) {
      res.json({
        "status": "error",
        "details": "Error: You must set the bid!"
      });
      return; 
    }

    room.activeGame.activePlayer = room.activeGame.biddingPlayer; 
    room.activeGame.activePlayerIndex = getPlayerIndex(room, room.activeGame.activePlayer); 
    room.roomStatus = `${room.activeGame.activePlayer.displayName} has won the bid with ${room.activeGame.bid}! They will now set the suit...`;
  }
  else {
    room.roomStatus = `${room.activeGame.activePlayer.displayName} has passed the bid.`;
    room.activeGame.activePlayerIndex = (++room.activeGame.activePlayerIndex % 4); 
    room.activeGame.activePlayer = getNextPlayer(room); 
  }
  
  await room.activeGame.save(); 
  await room.save();

  req.app.io.to(room.short_id).emit('room-update', (room));
  
  res.json({
    "status": "success"
  });
});

module.exports = router;

module.exports.createNewGame = createNewGame;
