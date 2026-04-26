const OrderRepository = require('../../../domain/order/OrderRepository');
const Order           = require('../../../domain/order/Order');
const pool            = require('../pool');

class PostgresOrderRepository extends OrderRepository {
  async save(order) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: orderRows } = await client.query(
        `INSERT INTO orders (user_id, status, total)
         VALUES ($1, $2, $3) RETURNING *`,
        [order.userId, order.status.toString(), order.total]
      );
      const savedOrder = orderRows[0];

      for (const item of order.items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4)`,
          [savedOrder.id, item.productId, item.quantity, item.unitPrice]
        );
      }

      await client.query('COMMIT');
      return new Order({ ...savedOrder, userId: savedOrder.user_id, items: order.items });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT o.*,
              json_agg(json_build_object(
                'id',        oi.id,
                'orderId',   oi.order_id,
                'productId', oi.product_id,
                'quantity',  oi.quantity,
                'unitPrice', oi.unit_price,
                'name',      p.name
              )) AS items
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN products p     ON p.id = oi.product_id
      WHERE o.id = $1
      GROUP BY o.id`,
      [id]
    );
    if (!rows[0]) return null;

    // Mapea user_id a userId explícitamente
    return new Order({
      ...rows[0],
      userId:    rows[0].user_id,
      createdAt: rows[0].created_at,
    });
  }

  async findByUserId(userId) {
    const { rows } = await pool.query(
      `SELECT o.*,
              json_agg(json_build_object(
                'id',        oi.id,
                'orderId',   oi.order_id,
                'productId', oi.product_id,
                'quantity',  oi.quantity,
                'unitPrice', oi.unit_price,
                'name',      p.name
              )) AS items
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN products p     ON p.id = oi.product_id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [userId]
    );
    return rows.map(r => new Order({ ...r, userId: r.user_id, createdAt: r.created_at }));
  }

  async updateStatus(id, status) {
    const { rows } = await pool.query(
      `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );
    if (!rows[0]) return null;
    return new Order({ ...rows[0], items: [] });
  }
}

module.exports = PostgresOrderRepository;