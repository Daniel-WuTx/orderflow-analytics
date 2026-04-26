const router = require('express').Router();
const ctrl   = require('../controllers/orders.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');

router.post('/',            verifyToken, ctrl.create);
router.get('/my',           verifyToken, ctrl.getMyOrders);
router.patch('/:id/status', verifyToken, requireAdmin, ctrl.updateStatus);

module.exports = router;