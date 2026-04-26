const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: 'Token inválido o expirado' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!['admin', 'superadmin'].includes(req.user?.role))
    return res.status(403).json({ error: 'Se requiere rol admin' });
  next();
};

const requireSuperAdmin = (req, res, next) => {
  if (req.user?.role !== 'superadmin')
    return res.status(403).json({ error: 'Solo el superadmin puede hacer esto' });
  next();
};

module.exports = { verifyToken, requireAdmin, requireSuperAdmin };