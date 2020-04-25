/* routes for team functions */

const express = require('express');
const router = express.Router();

const Room = require('../../model/Room');
const Team = require('../../model/Team');
const Player = require('../../model/Player');
const User = require('../../model/User');

async function getTeam(teamId) {
  return await Team.findOne({ _id: teamId }).exec();
}

async function getTeamPopulated(teamId) {
  return await Team.findOne({ _id: teamId }).populate({ path: 'player1', select: 'displayName isReady cardCount'}).populate({ path: 'player2', select: 'displayName isReady cardCount'});
}

async function removePlayerFromTeam(playerId) {
  let team = await Team.findOne({ $or: [{player1: playerId}, {player2: playerId}] });
  let query; 
  if (team) {
    // delete player
    await Player.deleteOne({ _id: playerId });
    if (team.player1 && team.player1.toString() === playerId) {
      query = { player1: null };
    }
    if (team.player2 && team.player2.toString() === playerId) {
      query = { player2: null };
    }
    await Team.updateOne(
      { _id: team._id }, 
      query,
      (err, updatedTeamDoc) => {
        console.log(updatedTeamDoc);
        if (err) {
          console.log(err); 
          return null; 
        }
      }
    );
    // return updated team, then allow route to update the room using socket 
    return team; 
  }

  return null; 
}

router.get('/:teamId', async (req, res) => {
  const teamId = req.params['teamId'];
  let team = await getTeamPopulated(teamId);
  if (team === undefined) {
    res.json({
      "status": "error",
      "details": "Unable to find requested team"
    });
  }
  else {
    res.json({
      "status": "success",
      "team": team 
    });
  }
});

router.post('/join', async (req, res) => {
  let team = await getTeam(req.body['teamId']);
  if (team == undefined) {
    res.json({
      "status": "error",
      "details": "Unable to find requested team"
    });
    return; 
  }
  // Check if team is full 
  if (team.player1 !== null && team.player2 !== null) {
    res.json({
      "status": "error",
      "details": "This team is full"
    });
    return; 
  }

  // If a playerId was provided, need to leave the team the player is on 
  if (req.body['playerId'] && req.body['playerId'] !== '') {
    let updatedTeam = await removePlayerFromTeam(req.body['playerId']);
    if (updatedTeam !== null) {
        // Get the updatedTeam
        const updatedRoom = await Room.findOne({ $or: [{ team1: updatedTeam._id}, { team2: updatedTeam._id}] }).populate({ path: 'team1', populate: [{ path: 'player1', select: 'displayName isReady cardCount' }, { path: 'player2', select: 'displayName isReady cardCount' }]})
        .populate({ path: 'team2', populate: [{ path: 'player1' }, { path: 'player2' }]});
        // Need to emit the updated team information to the room 
        req.app.io.to(updatedRoom.short_id).emit('room-update', (updatedRoom));
    }
  }

  // Get the user
  let user; 
  if (req.body['user'] != undefined) {
    user = await User.findOne({ username: req.body['user'] }).exec();
  }
  let player = await Player.createPlayer(user);

  // Assign user to the open player slot
  let playerTaken;
  if (team.player1 == null) {
    playerTaken = 'player1'; 
    query = {$set: { 
      player1: player
    }};
  }
  else {
    playerTaken = 'player2';
    query = {$set: { 
      player2: player
    }};
  }
  await Team.updateOne(
    { _id: team._id }, 
    query,
    (err, updatedTeamDoc) => {
      if (err) {
        console.log(err); 
        res.json({
          "status": "error",
          "details": "Could not update player"
        });
        return; 
      }
    }
  );

  // Get the updatedTeam
  const updatedRoom = await Room.findOne({ $or: [{ team1: team._id}, { team2: team._id}] }).populate({ path: 'team1', populate: [{ path: 'player1', select: 'displayName isReady cardCount' }, { path: 'player2', select: 'displayName isReady cardCount' }]})
  .populate({ path: 'team2', populate: [{ path: 'player1' }, { path: 'player2' }]});
  // Need to emit the updated team information to the room 
  req.app.io.to(updatedRoom.short_id).emit('room-update', (updatedRoom));

  res.json({
    "status": "success",
    "player": player
  });
});

router.post('/leave', async (req, res) => {
  if (req.body['playerId'] && req.body['playerId'] !== '') {
    let updatedTeam = await removePlayerFromTeam(req.body['playerId']);
    if (updatedTeam !== null) {
        // Get the updatedTeam
        const updatedRoom = await Room.findOne({ $or: [{ team1: updatedTeam._id}, { team2: updatedTeam._id}] }).populate({ path: 'team1', populate: [{ path: 'player1', select: 'displayName isReady cardCount' }, { path: 'player2', select: 'displayName isReady cardCount' }]})
        .populate({ path: 'team2', populate: [{ path: 'player1' }, { path: 'player2' }]});
        // Need to emit the updated team information to the room 
        req.app.io.to(updatedRoom.short_id).emit('room-update', (updatedRoom));
    }
    else {
      res.json({
        "status": "error",
        "details": "Invalid player ID provided"
      });
      return; 
    }
  }
  else {
    res.json({
      "status": "error",
      "details": "Invalid player ID provided"
    });
    return; 
  }

  res.json({
    "status": "success",
    "details": "Removed player" 
  });
});

module.exports = router;