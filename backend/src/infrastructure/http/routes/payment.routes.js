const router = require('express').Router();
const ctrl   = require('../controllers/payment.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/',                      verifyToken, ctrl.processPayment);
router.get('/order/:orderId',         verifyToken, ctrl.getPaymentStatus);
router.post('/webhook',               ctrl.webhook); // sin auth, Wompi lo llama directamente

module.exports = router;