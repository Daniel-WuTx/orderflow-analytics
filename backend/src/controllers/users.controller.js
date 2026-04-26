const pool = require('../infrastructure/db/pool');

const getAll = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, role, created_at
       FROM users ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

const updateRole = async (req, res) => {
  const { role } = req.body;

  if (!['admin', 'customer'].includes(role))
    return res.status(400).json({ error: 'Rol inválido. Solo puedes asignar admin o customer' });

  if (req.params.id === req.user.id)
    return res.status(403).json({ error: 'No puedes cambiar tu propio rol' });

  try {
    // No se puede tocar a otro superadmin
    const { rows: target } = await pool.query(
      'SELECT role FROM users WHERE id = $1', [req.params.id]
    );
    if (!target[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (target[0].role === 'superadmin')
      return res.status(403).json({ error: 'No se puede modificar el rol de un superadmin' });

    const { rows } = await pool.query(
      `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role`,
      [role, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar rol' });
  }
};

module.exports = { getAll, updateRole };