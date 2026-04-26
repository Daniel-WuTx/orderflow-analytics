const router   = require('express').Router();
const upload   = require('../middlewares/upload.middleware');
const ctrl     = require('../controllers/products.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');

router.get('/categories',           ctrl.getCategories);
router.get('/',                     ctrl.getAll);
router.get('/:id',                  ctrl.getOne);
router.post('/',                    verifyToken, requireAdmin, ctrl.create);
router.put('/:id',                  verifyToken, requireAdmin, ctrl.update);
router.delete('/:id',               verifyToken, requireAdmin, ctrl.remove);
router.post('/categories', verifyToken, requireAdmin, ctrl.createCategory);
router.get('/:id/images',                    ctrl.getImages);
router.post('/:id/images',                   verifyToken, requireAdmin, upload.single('image'), ctrl.addImage);
router.delete('/:id/images/:imageId',        verifyToken, requireAdmin, ctrl.deleteImage);
module.exports = router;