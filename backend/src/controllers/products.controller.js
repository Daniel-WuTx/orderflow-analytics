const pool = require('../config/db');

// GET /api/products
const getAll = async (req, res) => {
  const { category, search, page = 1, limit = 12 } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = [];

  if (category) {
    params.push(category);
    conditions.push(`c.slug = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`p.name ILIKE $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const { rows } = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT $${params.push(limit)} OFFSET $${params.push(offset)}`,
      params
    );

    const count = await pool.query(
      `SELECT COUNT(*) FROM products p
       LEFT JOIN categories c ON p.category_id = c.id ${where}`,
      params.slice(0, conditions.length)
    );

    res.json({
      products: rows,
      total: parseInt(count.rows[0].count),
      page: parseInt(page),
      pages: Math.ceil(count.rows[0].count / limit)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// GET /api/products/:id
const getOne = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, c.name AS category_name,
              ROUND(AVG(r.rating), 1) AS avg_rating,
              COUNT(r.id) AS review_count
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN reviews r ON r.product_id = p.id
       WHERE p.id = $1
       GROUP BY p.id, c.name`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener producto' });
  }
};

// POST /api/products  (admin only)
const create = async (req, res) => {
  const { name, description, price, stock, category_id } = req.body;
  if (!name || !price) 
    return res.status(400).json({ error: 'Nombre y precio son requeridos' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO products (name, description, price, stock, category_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description, price, stock ?? 0, category_id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

// PUT /api/products/:id  (admin only)
const update = async (req, res) => {
  const { name, description, price, stock, category_id } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE products
       SET name=$1, description=$2, price=$3, stock=$4, category_id=$5
       WHERE id=$6 RETURNING *`,
      [name, description, price, stock, category_id, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

// DELETE /api/products/:id  (admin only)
const remove = async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM products WHERE id = $1', [req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
};

module.exports = { getAll, getOne, create, update, remove };