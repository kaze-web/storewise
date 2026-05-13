const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

class ReportService {
  async getSalesReport(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const report = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          totalSales: { $sum: '$totalAmount' },
          transactionCount: { $sum: 1 },
          items: { $push: '$items' }
        }
      },
      {
        $project: {
          date: '$_id',
          totalSales: 1,
          transactionCount: 1,
          totalItems: {
            $reduce: {
              input: '$items',
              initialValue: 0,
              in: { $add: ['$$value', { $size: '$$this' }] }
            }
          }
        }
      },
      { $sort: { date: 1 } }
    ]);

    const summary = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalTransactions: { $sum: 1 }
        }
      }
    ]);

    return {
      period: { start: startDate, end: endDate },
      dailyData: report,
      summary: summary[0] || { totalRevenue: 0, totalTransactions: 0 }
    };
  }

  async getInventoryReport() {
    const products = await Product.find({})
      .select('name stock minStock price cost category')
      .sort({ name: 1 });

    const lowStock = products.filter(p => p.stock <= p.minStock);
    const outOfStock = products.filter(p => p.stock === 0);

    const totalValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
    const totalCost = products.reduce((sum, p) => sum + (p.stock * p.cost), 0);

    return {
      products,
      summary: {
        totalProducts: products.length,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        totalValue,
        totalCost,
        estimatedProfit: totalValue - totalCost
      }
    };
  }

  generatePDFReport(reportData, type) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header
      doc.fontSize(20).text('StoreWise POS Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`${type} Report`, { align: 'center' });
      doc.moveDown();

      if (type === 'Sales') {
        doc.text(`Period: ${reportData.period.start} to ${reportData.period.end}`);
        doc.moveDown();
        doc.text(`Total Revenue: ₱${reportData.summary.totalRevenue.toFixed(2)}`);
        doc.text(`Total Transactions: ${reportData.summary.totalTransactions}`);
        doc.moveDown();

        // Daily breakdown
        doc.fontSize(12).text('Daily Sales:');
        reportData.dailyData.forEach(day => {
          doc.text(`${day.date}: ₱${day.totalSales.toFixed(2)} (${day.transactionCount} transactions)`);
        });
      } else if (type === 'Inventory') {
        doc.text(`Total Products: ${reportData.summary.totalProducts}`);
        doc.text(`Low Stock Items: ${reportData.summary.lowStockCount}`);
        doc.text(`Out of Stock Items: ${reportData.summary.outOfStockCount}`);
        doc.text(`Total Inventory Value: ₱${reportData.summary.totalValue.toFixed(2)}`);
        doc.moveDown();

        // Product list
        doc.fontSize(12).text('Products:');
        reportData.products.forEach(product => {
          doc.text(`${product.name}: ${product.stock} units (Min: ${product.minStock}) - ₱${product.price}`);
        });
      }

      doc.end();
    });
  }

  async generateExcelReport(reportData, type) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${type} Report`);

    if (type === 'Sales') {
      worksheet.columns = [
        { header: 'Date', key: 'date' },
        { header: 'Total Sales', key: 'totalSales' },
        { header: 'Transactions', key: 'transactionCount' },
        { header: 'Items Sold', key: 'totalItems' }
      ];

      reportData.dailyData.forEach(day => {
        worksheet.addRow({
          date: day.date,
          totalSales: day.totalSales,
          transactionCount: day.transactionCount,
          totalItems: day.totalItems
        });
      });

      // Summary row
      worksheet.addRow({});
      worksheet.addRow({
        date: 'TOTAL',
        totalSales: reportData.summary.totalRevenue,
        transactionCount: reportData.summary.totalTransactions
      });
    } else if (type === 'Inventory') {
      worksheet.columns = [
        { header: 'Product Name', key: 'name' },
        { header: 'Stock', key: 'stock' },
        { header: 'Min Stock', key: 'minStock' },
        { header: 'Price', key: 'price' },
        { header: 'Cost', key: 'cost' },
        { header: 'Category', key: 'category' }
      ];

      reportData.products.forEach(product => {
        worksheet.addRow({
          name: product.name,
          stock: product.stock,
          minStock: product.minStock,
          cost: product.cost,
          price: product.price,
          category: product.category
        });
      });
    }

    return await workbook.xlsx.writeBuffer();
  }
}

module.exports = new ReportService();