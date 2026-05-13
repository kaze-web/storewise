const Transaction = require('../models/Transaction');
const Product = require('../models/Product');

class PredictiveRestocking {
  // Simple forecasting based on average daily sales over last 30 days
  async getRestockSuggestions() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const salesData = await Transaction.aggregate([
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
            daysCount: {
              $addToSet: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
              }
            }
          }
        },
        {
          $project: {
            name: 1,
            totalSold: 1,
            daysActive: { $size: '$daysCount' },
            avgDailySales: {
              $cond: {
                if: { $eq: [{ $size: '$daysCount' }, 0] },
                then: 0,
                else: { $divide: ['$totalSold', { $size: '$daysCount' }] }
              }
            }
          }
        }
      ]);

      const suggestions = [];

      for (const sale of salesData) {
        const product = await Product.findById(sale._id);
        if (!product) continue;

        // Predict next 7 days sales
        const predictedSales = sale.avgDailySales * 7;

        // Suggest restock if current stock will last less than 14 days
        const daysStockWillLast = product.stock / sale.avgDailySales;
        const shouldRestock = daysStockWillLast < 14;

        if (shouldRestock) {
          const suggestedQuantity = Math.max(
            Math.ceil(predictedSales * 2), // Stock for 2 weeks
            product.minStock * 2
          );

          suggestions.push({
            product: product._id,
            name: product.name,
            currentStock: product.stock,
            avgDailySales: Math.round(sale.avgDailySales * 100) / 100,
            daysStockWillLast: Math.round(daysStockWillLast * 100) / 100,
            suggestedQuantity,
            priority: daysStockWillLast < 7 ? 'high' : 'medium'
          });
        }
      }

      // Sort by priority and days remaining
      suggestions.sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (b.priority === 'high' && a.priority !== 'high') return 1;
        return a.daysStockWillLast - b.daysStockWillLast;
      });

      return suggestions;
    } catch (error) {
      throw error;
    }
  }

  // Get sales trends for a specific product
  async getProductSalesTrend(productId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sales = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          'items.product': productId
        }
      },
      {
        $unwind: '$items'
      },
      {
        $match: { 'items.product': productId }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.total' }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    return sales;
  }
}

module.exports = new PredictiveRestocking();