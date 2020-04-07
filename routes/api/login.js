/* routes for login functions */

const express = require('express');
const router = express.Router();

const User = require('../../model/User.js');
const Utils = require('../../utility.js');

router.post('/', async (req, res) => {
  const username = req.body['username'].toLowerCase();
  const password = req.body['password'];
  if (username == undefined || password == undefined) {
    res.json({
      "status": "error",
      "details": "Missing required fields"
    });
    return; 
  }

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
