/* Utility functions for backend */ 
const crypto = require('crypto');

function hashPassword(pass, salt) {
  let hash = crypto.createHmac('sha512', salt);
  hash.update(pass);
  let value = hash.digest('hex');
  return value;
}

function generateSalt() {
  return crypto.randomBytes(128).toString('base64');
}

module.exports = {
  hashPassword,
  generateSalt,
}