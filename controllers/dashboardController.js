const Transaction = require('../models/Transaction');
const Product = require('../models/Product');

exports.getDashboardData = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Daily sales
    const dailySales = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Total products
    const totalProducts = await Product.countDocuments();

    // Low stock and out-of-stock alerts
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$stock', '$minStock'] }
    }).sort({ stock: 1 });

    const outOfStockCount = await Product.countDocuments({ stock: 0 });
    const lowStockOnlyCount = await Product.countDocuments({
      $expr: {
        $and: [
          { $lte: ['$stock', '$minStock'] },
          { $gt: ['$stock', 0] }
        ]
      }
    });

    // Top selling products (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const topSelling = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.productName' },
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      dailySales: dailySales[0] || { total: 0, count: 0 },
      totalProducts,
      lowStockAlerts: lowStockProducts.length,
      outOfStockCount,
      lowStockOnlyCount,
      lowStockProducts,
      topSellingProducts: topSelling
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};