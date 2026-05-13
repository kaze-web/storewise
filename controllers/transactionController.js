const Transaction = require('../models/Transaction');
const Product = require('../models/Product');

exports.createTransaction = async (req, res) => {
  try {
    const { items, paymentMethod } = req.body;
    let totalAmount = 0;
    const transactionItems = [];

    // Validate and calculate items
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ message: `Product ${item.product} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      transactionItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal
      });

      // Reduce stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Create transaction
    const transaction = new Transaction({
      items: transactionItems,
      totalAmount,
      paymentMethod,
      cashier: req.user._id
    });

    await transaction.save();
    await transaction.populate('cashier', 'name');

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
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