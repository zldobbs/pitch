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

module.exports = router;

module.exports.createNewGame = createNewGame;
