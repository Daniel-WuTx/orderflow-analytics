// backend/src/infrastructure/http/routes/analytics.routes.js
const { Router } = require('express');
const { verifyToken, requireAdmin, requireSuperAdmin } = require('../middlewares/auth.middleware');
const AnalyticsController = require('../controllers/analytics.controller');
const GetAnalyticsUseCase = require('../../../application/analytics/GetAnalyticsUseCase');
const PostgresAnalyticsRepository = require('../../db/repositories/PostgresAnalyticsRepository');

const router = Router();

const controller = new AnalyticsController({
  getAnalyticsUseCase: new GetAnalyticsUseCase({
    analyticsRepository: new PostgresAnalyticsRepository(),
  }),
});
router.get('/profile/me', verifyToken, controller.getUserProfile);
router.use(verifyToken, requireAdmin);

router.get('/summary',                    controller.getSummary);
router.get('/sales-by-month',             controller.getSalesByMonth);
router.get('/top-products',               controller.getTopProducts);
router.get('/customer-behavior',          controller.getCustomerBehavior);
router.get('/product-trend/:productId',   controller.getProductTrend);
router.get('/rfm',                        controller.getRFM);

router.post('/refresh', requireSuperAdmin, controller.refreshViews);

module.exports = router;