const pool = require('../config/db');

// POST /api/orders  — crea una orden completa desde el carrito
const create = async (req, res) => {
  const { items } = req.body;
  // items: [{ product_id, quantity }]

  if (!items || items.length === 0)
    return res.status(400).json({ error: 'El carrito está vacío' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verifica stock de cada producto
    for (const item of items) {
      const { rows } = await client.query(
        'SELECT stock, price FROM products WHERE id = $1', [item.product_id]
      );
      if (!rows[0]) throw new Error(`Producto ${item.product_id} no encontrado`);
      if (rows[0].stock < item.quantity)
        throw new Error(`Stock insuficiente para producto ${item.product_id}`);
      item.unit_price = rows[0].price;
    }

    // Calcula total
    const total = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

    // Crea la orden
    const { rows: orderRows } = await client.query(
      `INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING *`,
      [req.user.id, total]
    );
    const order = orderRows[0];

    // Inserta los ítems (el trigger descuenta stock automáticamente)
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [order.id, item.product_id, item.quantity, item.unit_price]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(order);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};

// GET /api/orders  — historial del usuario autenticado
const getMyOrders = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.*,
              json_agg(json_build_object(
                'product_id', oi.product_id,
                'name',       p.name,
                'quantity',   oi.quantity,
                'unit_price', oi.unit_price
              )) AS items
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN products p     ON p.id = oi.product_id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener órdenes' });
  }
};

// PATCH /api/orders/:id/status  (admin only)
const updateStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Orden no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};

module.exports = { create, getMyOrders, updateStatus };