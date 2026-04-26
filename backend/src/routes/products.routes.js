const router  = require('express').Router();
const upload  = require('../infrastructure/http/middlewares/upload.middleware');
const {
  getAll, getOne, create, update, remove,
  getCategories, getImages, addImage, deleteImage
} = require('../controllers/products.controller');
const { verifyToken, requireAdmin } = require('../infrastructure/http/middlewares/auth.middleware');

router.get('/categories',                  getCategories);
router.get('/',                            getAll);
router.get('/:id',                         getOne);
router.post('/',                           verifyToken, requireAdmin, create);
router.put('/:id',                         verifyToken, requireAdmin, update);
router.delete('/:id',                      verifyToken, requireAdmin, remove);
router.get('/:id/images',                  getImages);
router.post('/:id/images',                 verifyToken, requireAdmin, upload.single('image'), addImage);
router.delete('/:id/images/:imageId',      verifyToken, requireAdmin, deleteImage);

module.exports = router;