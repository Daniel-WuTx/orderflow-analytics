const router = require('express').Router();
const { getAll, updateRole } = require('../controllers/users.controller');
const { verifyToken, requireAdmin, requireSuperAdmin } = require('../infrastructure/http/middlewares/auth.middleware');

router.get('/',           verifyToken, requireAdmin,      getAll);
router.patch('/:id/role', verifyToken, requireSuperAdmin, updateRole);

module.exports = router;