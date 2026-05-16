const Transaction = require('../models/Transaction');
const Product = require('../models/Product');

exports.createTransaction = async (req, res) => {
  try {
    const { items, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items provided for transaction' });
    }

    let totalAmount = 0;
    const transactionItems = [];

    // Validate and calculate items
    for (const item of items) {
      if (!item.product || !item.quantity) {
        return res.status(400).json({ message: 'Invalid transaction item format' });
      }

      const quantity = Number(item.quantity);
      if (Number.isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({ message: 'Invalid quantity for transaction item' });
      }

      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ message: `Product ${item.product} not found` });
      }
      if (product.stock < quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}. Available: ${product.stock}` });
      }

      const itemTotal = product.price * quantity;
      totalAmount += itemTotal;

      transactionItems.push({
        product: product._id,
        productName: product.name,
        quantity,
        price: product.price,
        total: itemTotal
      });

      // Reduce stock
      product.stock -= quantity;
      await product.save();
    }

    // Create transaction
    const transaction = new Transaction({
      transactionId: 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase(),
      items: transactionItems,
      totalAmount,
      paymentMethod,
      cashier: req.user._id
    });

    await transaction.save();
    await transaction.populate('cashier', 'name');

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Transaction creation error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { startDate, endDate, limit = 50 } = req.query;
    let query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const transactions = await Transaction.find(query)
      .populate('cashier', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('cashier', 'name');
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};