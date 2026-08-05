const jwt = require('jsonwebtoken');
const config = require('../config');

function getJwtSecret() {
  return config.auth.jwtSecret;
}

function verifyAccessToken(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    return null;
  }
}

function signAccessToken(payload, options = {}) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: config.auth.jwtExpiresIn,
    ...options
  });
}

module.exports = {
  getJwtSecret,
  verifyAccessToken,
  signAccessToken
};
