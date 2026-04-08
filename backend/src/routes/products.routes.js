const router = require('express').Router();
const { getAll, getOne, create, update, remove } = require('../controllers/products.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');

router.get('/',     getAll);
router.get('/:id',  getOne);
router.post('/',    verifyToken, requireAdmin, create);
router.put('/:id',  verifyToken, requireAdmin, update);
router.delete('/:id', verifyToken, requireAdmin, remove);

module.exports = router;