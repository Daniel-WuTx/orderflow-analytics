const router = require('express').Router();
const ctrl   = require('../controllers/users.controller');
const { verifyToken, requireAdmin, requireSuperAdmin } = require('../middlewares/auth.middleware');

router.get('/',           verifyToken, requireAdmin,      ctrl.getAll);
router.patch('/:id/role', verifyToken, requireSuperAdmin, ctrl.updateRole);

module.exports = router;