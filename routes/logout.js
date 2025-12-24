const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { logoutHandler } = require('../middleware/tokenSecurity');

// Logout endpoint
router.post('/', protect, logoutHandler);

module.exports = router;

