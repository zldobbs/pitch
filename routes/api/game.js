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
        { path: 'player1', select: 'displayName isReady cardCount playedCard' }, 
        { path: 'player2', select: 'displayName isReady cardCount playedCard' }
      ]})
    .populate({ path: 'team2', 
      populate: [
        { path: 'player1', select: 'displayName isReady cardCount playedCard' }, 
        { path: 'player2', select: 'displayName isReady cardCount playedCard' }
      ]})
    .populate({ 
      path: 'activeGame', select: 'bid suit ledSuit suitName biddingPlayer activePlayer activePlayerIndex team1Score team2Score', 
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
  if (room.team1.player1._id.toString() === player._id.toString()) {
    return 0; 
  }
  if (room.team2.player1._id.toString() === player._id.toString()) {
    return 1; 
  }
  if (room.team1.player2._id.toString() === player._id.toString()) {
    return 2; 
  }
  if (room.team2.player2._id.toString() === player._id.toString()) {
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

// Gets the card number of the jack on the off suit 
function getOffJack(suit) {
  switch (suit) {
    case 0: {
      return 49;
    }
    case 1: {
      return 36;
    }
    case 2: {
      return 23;
    }
    case 3: {
      return 10; 
    }
    default: {
      console.log("Invalid suit provided: " + suit);
      return -1; 
    }
  }
}

async function updateHandForSuit(playerId, roomId) {
  let room = await Room.findOne({ _id: roomId }).populate('activeGame');
  if (playerId.toString() != room.activeGame.activePlayer.toString()) {
    let player = await Player.getPlayerWithCards(playerId); 

    // Remove any cards that do not fit in the given suit
    let suitLowerBound = (13 * room.activeGame.suit) + 1;
    let suitUpperBound = 13 * (room.activeGame.suit + 1);
    let newHand = [];
    for (let i = 0; i < player.cardCount; i++) {
      let card = player.hand[i];
      if (card > 52 || card == getOffJack(room.activeGame.suit) || (card >= suitLowerBound && card <= suitUpperBound)) {
        newHand.push(card); 
      }
    }
    
    // Now draw from the deck until newHand is exactly 6 cards
    let newDeck = room.activeGame.deck.slice();
    let newCards = newDeck.splice(0, (6 - newHand.length));
    newHand = newHand.concat(newCards);
    newHand = newHand.sort((a, b) => a - b);
    player.hand = newHand.slice();
    player.cardCount = newHand.length;
    room.activeGame.deck = newDeck; 

    await player.save(); 
    await room.activeGame.save(); 
  }
}

async function updateHandWithDeck(playerId, roomId) {
  let room = await Room.findOne({ _id: roomId }).populate('activeGame');
  if (playerId.toString() == room.activeGame.activePlayer.toString()) {
    let player = await Player.getPlayerWithCards(playerId); 

    // Give the active player the deck
    let newHand = player.hand.concat(room.activeGame.deck);
    newHand = newHand.sort((a, b) => a - b);
    player.hand = newHand.slice();
    player.cardCount = newHand.length;

    await player.save(); 
  }
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
    table: [],
    bid: 0,
    biddingPlayer: null,
    suit: -1,
    ledSuit: -1,
    suitName: '',
    activePlayer: firstPlayer,
    activePlayerIndex: firstPlayerIndex, 
    team1Score: 0, 
    team2Score: 0,
    isActive: true,
    handsSet: false
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
    room.activeGame.activePlayerIndex = getPlayerIndex(room, room.activeGame.biddingPlayer); 
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

router.post('/setSuit', async (req, res) => {
  let room = await getRoomByActivePlayer(req.body['player']);
  if (!room) {
    res.json({
      "status": "error",
      "details": "Error: User is not active in any known game"
    });
    return;
  }

  switch (req.body['suit']) {
    case 0: {
      room.activeGame.suitName = 'Clubs';
      break; 
    }
    case 1: {
      room.activeGame.suitName = 'Diamonds';
      break; 
    }
    case 2: {
      room.activeGame.suitName = 'Hearts';
      break;
    }
    case 3: {
      room.activeGame.suitName = 'Spades';
      break;
    }
    default: {
      res.json({
        "status": "error",
        "details": "Invalid suit selected"
      });
      return; 
    }
  }

  room.activeGame.suit = req.body['suit'];
  await room.activeGame.save(); 

  // Update all players hands to reflect new suit..
  await updateHandForSuit(room.team1.player1._id, room._id); 
  await updateHandForSuit(room.team1.player2._id, room._id); 
  await updateHandForSuit(room.team2.player1._id, room._id); 
  await updateHandForSuit(room.team2.player2._id, room._id); 

  await updateHandWithDeck(room.activeGame.activePlayer._id, room._id); 

  room.roomStatus = `${room.activeGame.activePlayer.displayName} set the suit to ${room.activeGame.suitName}! Hands have been updated. Wait for players to discard extra cards.`;

  await room.activeGame.activePlayer.save();
  await room.save();

  const updatedRoom = await getRoomByActivePlayer(req.body['player']);
  req.app.io.to(room.short_id).emit('room-update', (updatedRoom));

  res.json({
    "status": "success"
  });
});

router.post('/pickCards', async (req, res) => {
  let room = await getRoomByActivePlayer(req.body['activePlayer']);
  if (!room) {
    res.json({
      "status": "error",
      "details": "Error: User is not active in any known game"
    });
    return;
  }

  await setPlayerHand(req.body['player'], req.body['hand']);

  const updatedRoom = await getRoomByActivePlayer(req.body['activePlayer']);

  // Check if all players now have correct hands 
  if (
    updatedRoom.team1.player1.cardCount === 6 &&
    updatedRoom.team1.player2.cardCount === 6 &&
    updatedRoom.team2.player1.cardCount === 6 &&
    updatedRoom.team2.player2.cardCount === 6
  ) {
    updatedRoom.roomStatus = `Hands are ready! ${updatedRoom.activeGame.activePlayer.displayName} starts.`;
    updatedRoom.activeGame.handsSet = true; 
    await updatedRoom.activeGame.save();
    await updatedRoom.save();
  }

  req.app.io.to(room.short_id).emit('room-update', (updatedRoom));

  res.json({
    "status": "success"
  });
});

router.post('/goOut', async (req, res) => {
  let room = await getRoomByActivePlayer(req.body['activePlayer']);
  if (!room) {
    res.json({
      "status": "error",
      "details": "Error: Active player is not in a known game"
    });
    return; 
  }

  let player = await Player.getPlayerWithCards(req.body['player']);
  if (getPlayerIndex(room, player) === -1) {
    res.json({
      "status": "error",
      "details": "Error: Player attempting to play is not in same game as active player"
    });
    return; 
  }

  player.hand = []; 
  player.cardCount = 0;
  await player.save(); 

  let updatedRoom = await getRoomByActivePlayer(req.body['player']);

  if (req.body['activePlayer'] === req.body['player']) {
    // Check if all players have played (that aren't out)
    if (
      (updatedRoom.team1.player1.playedCard !== -1 || updatedRoom.team1.player1.cardCount === 0) &&
      (updatedRoom.team1.player2.playedCard !== -1 || updatedRoom.team1.player2.cardCount === 0) &&
      (updatedRoom.team2.player1.playedCard !== -1 || updatedRoom.team2.player1.cardCount === 0) &&
      (updatedRoom.team2.player2.playedCard !== -1 || updatedRoom.team2.player2.cardCount === 0)
    ) {
      // TODO Score hands
      // Set scores for each team
      // Set team down if they bid and lost 
      // Set active player to player with highest card 
      // Set led suit to -1 
    }
    else {
      updatedRoom.activeGame.activePlayerIndex = (++updatedRoom.activeGame.activePlayerIndex % 4); 
      updatedRoom.activeGame.activePlayer = getNextPlayer(updatedRoom); 
      while (updatedRoom.activeGame.activePlayer.cardCount <= 0) {
        updatedRoom.activeGame.activePlayerIndex = (++updatedRoom.activeGame.activePlayerIndex % 4); 
        updatedRoom.activeGame.activePlayer = getNextPlayer(updatedRoom);  
      }
  
      updatedRoom.roomStatus = `${player.displayName} has gone out. ${updatedRoom.activeGame.activePlayer.displayName} is now up.`;
    }

    await updatedRoom.activeGame.save();
  }

  updatedRoom.roomStatus = `${player.displayName} has gone out. ${updatedRoom.activeGame.activePlayer.displayName} is still up.`;
  
  await updatedRoom.save(); 

  req.app.io.to(room.short_id).emit('room-update', (updatedRoom));

  res.json({
    "status": "success"
  });
});

router.post('/playCard', async (req, res) => {
  let room = await getRoomByActivePlayer(req.body['player']);
  if (!room) {
    res.json({
      "status": "error",
      "details": "Error: User is not active in any known game"
    });
    return;
  }

  let player = await Player.getPlayerWithCards(req.body['player']);
  if (player.hand.length > 6) {
    res.json({
      "status": "error",
      "details": "Error: User has more than 6 cards"
    });
    return;
  }

  let cardIndex = player.hand.indexOf(req.body['card']);
  if (cardIndex < 0) {
    res.json({
      "status": "error",
      "details": "Error: User does not have the card played"
    });
    return;
  }

  // Check if the ledSuit has been set yet
  let requestedSuit = Math.floor((req.body['card'] - 1)/ 13);
  if (room.activeGame.ledSuit === -1) {
    // Set ledSuit to the suit of the card played
    room.activeGame.ledSuit = requestedSuit;
    await room.activeGame.save();
  }
  else if (
      room.activeGame.ledSuit === room.activeGame.suit && 
      requestedSuit < 4 &&
      requestedSuit !== room.activeGame.suit && 
      getOffJack(room.activeGame.ledSuit) !== req.body['card']) {
    res.json({
      "status": "invalidSuit",
      "details": `The on suit was led. You must bet in ${room.activeGame.suitName}`
    });
    return; 
  }

  player.hand.splice(cardIndex, 1); 
  player.cardCount = player.hand.length;
  player.playedCard = req.body['card'];
  await player.save(); 

  let updatedRoom = await getRoomByActivePlayer(req.body['player']);

  // Check if all players have played (that aren't out)
  if (
    (updatedRoom.team1.player1.playedCard !== -1 || updatedRoom.team1.player1.cardCount === 0) &&
    (updatedRoom.team1.player2.playedCard !== -1 || updatedRoom.team1.player2.cardCount === 0) &&
    (updatedRoom.team2.player1.playedCard !== -1 || updatedRoom.team2.player1.cardCount === 0) &&
    (updatedRoom.team2.player2.playedCard !== -1 || updatedRoom.team2.player2.cardCount === 0)
  ) {
    // TODO Score hands
    // Set scores for each team
    // Set team down if they bid and lost 
    // Set active player to player with highest card 
    // Set led suit to -1 
  }
  else {
    updatedRoom.activeGame.activePlayerIndex = (++updatedRoom.activeGame.activePlayerIndex % 4); 
    updatedRoom.activeGame.activePlayer = getNextPlayer(updatedRoom); 
    while (updatedRoom.activeGame.activePlayer.cardCount <= 0) {
      updatedRoom.activeGame.activePlayerIndex = (++updatedRoom.activeGame.activePlayerIndex % 4); 
      updatedRoom.activeGame.activePlayer = getNextPlayer(updatedRoom);  
    }

    updatedRoom.roomStatus = `${updatedRoom.activeGame.activePlayer.displayName} is up.`;
  }

  await updatedRoom.activeGame.save();
  await updatedRoom.save(); 

  req.app.io.to(room.short_id).emit('room-update', (updatedRoom));

  res.json({
    "status": "success"
  });
});

module.exports = router;

module.exports.createNewGame = createNewGame;
