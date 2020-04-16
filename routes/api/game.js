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

async function createNewGame() {
  let deck = shuffleDeck(); 
  // Give 9 cards to each player, denotes their hands 
  let t1p1 = deck.splice(0, 9); 
  let t1p2 = deck.splice(0, 9); 
  let t2p1 = deck.splice(0, 9);
  let t2p2 = deck.splice(0, 9); 

  let newGame = new Game({
    deck: deck,
    t1p1: t1p1, 
    t1p2: t1p2,
    t2p1: t2p1, 
    t2p2: t2p2, 
    team1Score: 0, 
    team2Score: 0,
    isActive: true
  });

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
  console.log('room retrieved to get active game');
  console.log(room); 
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

module.exports = router;

module.exports.createNewGame = createNewGame;
