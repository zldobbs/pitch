
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const User = require('./../../model/User.js');
const Utils = require('./../../utility.js');

router.post('/', async (req, res) => {
  username = req.body['username'].toLowerCase();
  password = req.body['password'];
  confirmPassword = req.body['confirmPassword'];

  if (username == undefined || password == undefined) {
    res.json({
      "status": "error",
      "details": "Missing required fields."
    });
    return;
  }

  if (password != confirmPassword) {
    res.json({
      "status": "error",
      "details": "Passwords do not match."
    });
    return;
  }

  const user = await User.findOne({ username: username }).exec();
  if (user) {
    res.json({
      "status": "error",
      "details": "That username is already taken."
    });
    return;
  }

  let salt = Utils.generateSalt()

  let newUser = new User({
    username: username,
    passHash: Utils.hashPassword(password, salt),
    salt: salt
  })
  newUser.save().then(item => {
    res.json({"status": "success"});
  }).catch(err => {
    console.log('\nDatabase ERROR - ' + new Date(Date.now()).toLocaleString())
    console.log(err)
    res.json({
      "status": "error",
      "details": "There was an error saving to the database."
    });
  });
});

module.exports = router;
