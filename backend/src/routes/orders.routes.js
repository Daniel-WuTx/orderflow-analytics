const router = require('express').Router();
const { create, getMyOrders, updateStatus } = require('../controllers/orders.controller');
const { verifyToken, requireAdmin } = require('../infrastructure/http/middlewares/auth.middleware');

router.post('/',              verifyToken, create);
router.get('/my',             verifyToken, getMyOrders);
router.patch('/:id/status',   verifyToken, requireAdmin, updateStatus);

module.exports = router;