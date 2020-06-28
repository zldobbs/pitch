# Pitch ![Pitch Image](https://github.com/zldobbs/pitch-client/blob/66ad47dd830841beb1d8812cb369307d46a02446/src/assets/img/cards/preview_image.png?raw=true)

A MERN stack impelmentation of the [Pitch card game.](https://en.wikipedia.org/wiki/Pitch_%28card_game%29) The version implemented here is a 2-team, 4-player, 5-10 bid game played to 31 (see Campbell Ten-Point Pitch on the above Wikipedia page). 

The game itself is hosted on Heroku. It is free-to-play [here.](https://dobbs-pitch.herokuapp.com/)

This application was developed using the MERN stack (MongoDB, Express, React, and Node). [Materialize](https://materializecss.com/) was used for the frontend CSS framework. [socket-io](https://socket.io/) was used to manage websockets and [axios](https://github.com/axios/axios) was used for the HTTP client. 

The React frontend of this application is a submodule of this repo. It can be viewed [here.](https://github.com/zldobbs/pitch-client)

This game was developed during the COVID-19 quarantine. If you have any feedback please email Zach at dobbszach@gmail.com.

## Features

* Play online with 4 players
* Custom name generators w/ option to customize
* Messaging with other players in-game 
* Mobile-responsive display 
* Full Pitch game experience, bid, play, win! 

## How to play 

The game itself features an embedded help button. You may find these instructions included there as well. 

### Background

Pitch is a trump, partner game. There are a few different variations that can be played, but the version that is offered in this game is 4-person, 10 point pitch. There are two teams of two competing to earn a total of 31 points.

### Bidding

Every round of a pitch game begins with bidding. In this game a team will need to set the bid at anywhere between 5-10 points. A team will set the bid at how many points they believe they can earn in a given round. If the team fails to get these points, they will be "set" and lose the amount they bid. However, the team that sets the bid gets the advantage of setting the trump suit. This scenario allows users to weigh the risk/reward of the hand they have at the start of the game.

### Gameplay

Every hand will begin with the player that won the previous hand. That player will start the round. If they play a card from the trump suit, all other players must also play a trump card. If they play off the trump suit, other players may play on or off suit. If a player is required to play on suit and does not have any trump cards, they are forced to "go out" for the rest of the round.

Every player will have a chance to play a card in the round. The player with the highest card will win the hand, giving their team as many points that were laid. The order of card strength is as follows: 2, 3, 4, 5, 6, 7, 8, 9, 10, Little Joker, Big Joker, Off Jack, On Jack, Queen, King, Ace.

### Point Cards

Only cards in the trump suit are worth points. The cards worth points are the 2, 3, 10, Little Joker, Big Joker, Off Jack, On Jack, and Ace.

The 2 is a special card in that it will automatically give the team that plays the card a point. It can not be won by the other team.

The 3 is another special card - it is worth 3 points (all other point cards are only worth 1). This card is very low though and easy to lose to the enemy team if not played carefully.

The Off Jack corresponds to the Jack of the same color suit of the trump suit that is not trump. (i.e. If Diamonds are trump, the Jack of Diamonds is the On Jack while the Jack of Hearts is the Off Jack).

It is worth noting that the Queen and King are NOT worth points. They are known as "catcher cards". Although they are not worth points, they are still the second and third highest cards in the game and will be very useful cards in winning other player points.
