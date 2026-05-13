const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/dashboardController');
const { auth } = require('../middleware/auth');
const predictiveRestocking = require('../services/predictiveRestocking');

router.get('/', auth, getDashboardData);

router.get('/restock-suggestions', auth, async (req, res) => {
  try {
    const suggestions = await predictiveRestocking.getRestockSuggestions();
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;