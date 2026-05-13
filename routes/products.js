const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts
} = require('../controllers/productController');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, getAllProducts);
router.get('/low-stock', auth, getLowStockProducts);
router.get('/:id', auth, getProduct);
router.post('/', auth, requireRole(['admin']), createProduct);
router.put('/:id', auth, requireRole(['admin']), updateProduct);
router.delete('/:id', auth, requireRole(['admin']), deleteProduct);

module.exports = router;