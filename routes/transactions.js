const express = require('express');
const router = express.Router();
const {
  createTransaction,
  getTransactions,
  getTransaction
} = require('../controllers/transactionController');
const { auth } = require('../middleware/auth');

router.post('/', auth, createTransaction);
router.get('/', auth, getTransactions);
router.get('/:id', auth, getTransaction);

module.exports = router;