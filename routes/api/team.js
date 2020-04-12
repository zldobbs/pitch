/* routes for team functions */

const express = require('express');
const router = express.Router();
const auth = require('../../auth.json');

const Room = require('../../model/Room');
const Team = require('../../model/Team');
const User = require('../../model/User');

async function getTeam(teamId) {
  return await Team.findOne({ _id: teamId }).exec();
}

async function getTeamPopulated(teamId) {
  return await Team.findOne({ _id: teamId }).populate('player1').populate('player2');
}

router.get('/:teamId', async (req, res) => {
  const teamId = req.params['teamId'];
  let team = await getTeam(teamId);
  if (team == undefined) {
    res.json({
      "status": "error",
      "details": "Unable to find requested team"
    });
  }
  else {
    res.json({
      "status": "success",
      "team": team 
    })
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
  if (team.player1 != null && team.player2 != null) {
    res.json({
      "status": "error",
      "details": "This team is full"
    });
    return; 
  }

  // Get the user
  let user; 
  if (req.body['user'] != undefined) {
    user = await User.findOne({ username: req.body['user'] }).exec();
    if (user == undefined) {
      res.json({
        "status": "error",
        "details": "Username does not exist"
      });
      return; 
    }
  }
  else {
    // No user provided, set to default user 
    user = await User.getDefaultUser();
  }

  // Assign user to the open player slot
  let playerTaken;
  if (team.player1 == null) {
    playerTaken = 'player1'; 
    query = {$set: { 
      player1: user,
      player1DisplayName: user.username 
    }};
  }
  else {
    playerTaken = 'player2';
    query = {$set: { 
      player2: user,
      player2DisplayName: user.username 
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
  const updatedRoom = await Room.findOne({ $or: [{ team1: req.body['teamId']}, { team2: req.body['teamId']}] }).populate('team1').populate('team2');
  // Need to emit the updated team information to the room 
  req.app.io.to(updatedRoom.short_id).emit('team-change', updatedRoom.team1, updatedRoom.team2);

  res.json({
    "status": "success",
    "playerTaken": playerTaken 
  });
});

router.post('/leave', async (req, res) => {
  // verify team
  // verify user is the player specified (or if undefined == defaultuser)
  let team = await getTeamPopulated(req.body['teamId']);
  if (team == undefined) {
    res.json({
      "status": "error",
      "details": "Unable to find requested team"
    });
    return; 
  }

  // Get the user
  let user; 
  if (req.body['user'] != undefined) {
    user = await User.findOne({ username: req.body['user'] }).exec();
    if (user == undefined) {
      res.json({
        "status": "error",
        "details": "Username does not exist"
      });
      return; 
    }
  }
  else {
    // No user provided, set to default user 
    user = await User.getDefaultUser();
  }

  let playerName = (req.body['playerNum'] == 'player1' ? team.player1.username : team.player2.username);
  if (playerName != user.username) {
    res.json({
      "status": "error",
      "details": "Invalid player number"
    });
    return; 
  }

  let query;
  if (req.body['playerNum'] == 'player1') {
    query = {$set: { 
      player1: null,
      player1DisplayName: '',
      player1Ready: false 
    }};
  }
  else {
    query = {$set: { 
      player2: null,
      player2DisplayName: '',
      player2Ready: false  
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
          "details": "Could not remove player"
        });
        return; 
      }
    }
  );

  // Get the updatedTeam
  const updatedRoom = await Room.findOne({ $or: [{ team1: req.body['teamId']}, { team2: req.body['teamId']}] }).populate('team1').populate('team2');
  // Need to emit the updated team information to the room 
  req.app.io.to(updatedRoom.short_id).emit('team-change', updatedRoom.team1, updatedRoom.team2);

  res.json({
    "status": "success",
    "details": "Removed player" 
  });
});

router.post('/ready', async (req, res) => {
  const teamId = req.body['teamId']; 
  let team = await getTeamPopulated(teamId);
  if (team == undefined) {
    res.json({
      "status": "error",
      "details": "Unable to find requested team"
    });
    return; 
  }

  const player = req.body['playerNum'];
  let readyStatus; 
  if (player == 'player1' && team.player1 != null) {
    readyStatus = (team.player1Ready ? false : true);
    
  }
  else if (player == 'player2' && team.player2 != null) {
    readyStatus = (team.player2Ready ? false : true);
  }
  else {
    res.json({
      "status": "error",
      "details": "Player information is invalid"
    });
    return; 
  }

  let query;
  if (player == 'player1') {
    query = {$set: { 
      player1Ready: readyStatus 
    }};
  }
  else {
    query = {$set: { 
      player2Ready: readyStatus  
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
  const updatedRoom = await Room.findOne({ $or: [{ team1: req.body['teamId']}, { team2: req.body['teamId']}] }).populate('team1').populate('team2');
  req.app.io.to(updatedRoom.short_id).emit('team-change', updatedRoom.team1, updatedRoom.team2);

  // TODO Check if all players are ready... 
  if (updatedRoom.team1.player1Ready && updatedRoom.team1.player2Ready 
    && updatedRoom.team2.player1Ready && updatedRoom.team2.player2Ready) {
    // Start the room 
  }

  res.json({
    "status": "success"
  });
});

module.exports = router;
