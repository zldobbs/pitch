/* routes for login functions */

const express = require('express');
const router = express.Router();

const User = require('../../model/User');
const Utils = require('../../utility.js');

router.post('/', async (req, res) => {
  if (req.body['username'] == undefined || req.body['password'] == undefined) {
    res.json({
      "status": "error",
      "details": "Missing required fields"
    });
    return; 
  }

  const username = req.body['username'].toLowerCase();
  const password = req.body['password'];
  const user = await User.findOne({ username: username }).exec();
  if (!user) {
    res.json({
      "status": "error",
      "details": "Invalid username"
    });
    return; 
  }

  if (Utils.hashPassword(password, user.salt) != user.passHash) {
    res.json({
      "status": "error",
      "details": "Invalid password"
    });
    return; 
  }
  else {
    res.json({
      "status": "success", 
      "username": user.username
    })
  }
});

module.exports = router;
