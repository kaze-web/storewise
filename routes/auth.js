const express = require('express');
const router = express.Router();
const { login, register, getProfile } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// Public routes
router.post('/login', login);
router.post('/register', register);

// Protected routes
router.get('/profile', auth, getProfile);

module.exports = router;