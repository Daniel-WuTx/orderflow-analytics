const router = require('express').Router();
const {
  getSummary,
  getSalesByMonth,
  getTopProducts,
  getCustomerBehavior,
  getProductTrend,
  getRFMSegmentation
} = require('../controllers/analytics.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');

router.use(verifyToken, requireAdmin);

router.get('/summary',            getSummary);
router.get('/sales-by-month',     getSalesByMonth);
router.get('/top-products',       getTopProducts);
router.get('/customer-behavior',  getCustomerBehavior);
router.get('/product-trend',      getProductTrend);
router.get('/rfm',                getRFMSegmentation);

module.exports = router;