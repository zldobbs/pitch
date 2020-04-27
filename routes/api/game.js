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

  if (room.lastDealer < 1 || room.lastDealer > 4) {
    room.lastDealer = Math.floor(Math.random() * 4) + 1; 
  }

  let newDealer;
  switch(room.lastDealer) {
    case 1: {
      newDealer = room.team1.player1._id; 
      break; 
    }
    case 2: {
      newDealer = room.team2.player1._id;
      break;
    }
    case 3: {
      newDealer = room.team1.player2._id; 
      break; 
    }
    case 4: {
      newDealer = room.team2.player2._id; 
      break;
    }
    default: {
      console.log("Error: Room's last dealer is invalid: " + room.lastDealer); 
      return null; 
    }
  }

  let newGame = new Game({
    deck: deck,
    bid: 0,
    biddingTeam: 0,
    suit: -1,
    activePlayer: newDealer,
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
