const express = require('express');
const router = express.Router();
const reportService = require('../services/reportService');
const { auth, requireRole } = require('../middleware/auth');

router.get('/sales', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    const report = await reportService.getSalesReport(startDate, endDate);
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/inventory', auth, requireRole(['admin']), async (req, res) => {
  try {
    const report = await reportService.getInventoryReport();
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/sales/pdf', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const report = await reportService.getSalesReport(startDate, endDate);
    const pdfBuffer = await reportService.generatePDFReport(report, 'Sales');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/inventory/pdf', auth, requireRole(['admin']), async (req, res) => {
  try {
    const report = await reportService.getInventoryReport();
    const pdfBuffer = await reportService.generatePDFReport(report, 'Inventory');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory-report.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/sales/excel', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const report = await reportService.getSalesReport(startDate, endDate);
    const excelBuffer = await reportService.generateExcelReport(report, 'Sales');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');
    res.send(excelBuffer);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/inventory/excel', auth, requireRole(['admin']), async (req, res) => {
  try {
    const report = await reportService.getInventoryReport();
    const excelBuffer = await reportService.generateExcelReport(report, 'Inventory');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory-report.xlsx');
    res.send(excelBuffer);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;