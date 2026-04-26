const router = require('express').Router();
const ctrl   = require('../controllers/cart.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.use(verifyToken);

router.get('/',                        ctrl.getCart);
router.post('/items',                  ctrl.addItem);
router.patch('/items/:productId',      ctrl.updateItem);
router.delete('/items/:productId',     ctrl.removeItem);
router.post('/checkout',               ctrl.checkout);
router.delete('/',                     ctrl.clearCart);

module.exports = router;