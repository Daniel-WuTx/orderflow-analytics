const pool = require('../pool');

class PostgresAnalyticsRepository {

  async getSummary() {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM orders)                             AS total_orders,
        (SELECT COALESCE(SUM(total), 0) FROM orders
          WHERE status != 'cancelled')                           AS total_revenue,
        (SELECT COUNT(*) FROM users WHERE role = 'customer')     AS total_customers,
        (SELECT COUNT(*) FROM products WHERE stock > 0)          AS active_products
    `);
    return rows[0];
  }

  async getSalesByMonth() {
    const { rows } = await pool.query(`
      SELECT
        TO_CHAR(month, 'YYYY-MM') AS month,
        total_orders,
        ROUND(revenue::numeric, 2) AS revenue
      FROM mv_sales_by_month
      ORDER BY month ASC
    `);
    return rows;
  }

  async getTopProducts(limit = 10) {
    const { rows } = await pool.query(`
      SELECT
        id,
        name,
        units_sold,
        ROUND(revenue::numeric, 2) AS revenue
      FROM mv_top_products
      ORDER BY revenue DESC
      LIMIT $1
    `, [limit]);
    return rows;
  }

  async getCustomerBehavior(limit = 20) {
    const { rows } = await pool.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        COUNT(o.id)                    AS total_orders,
        ROUND(SUM(o.total)::numeric, 2) AS total_spent
      FROM users u
      JOIN orders o ON o.user_id = u.id
      WHERE u.role = 'customer'
      GROUP BY u.id, u.name, u.email
      ORDER BY total_spent DESC
      LIMIT $1
    `, [limit]);
    return rows;
  }

  async getProductTrend(productId) {
    const { rows } = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', o.created_at), 'YYYY-MM') AS month,
        SUM(oi.quantity)                                        AS units_sold,
        ROUND(SUM(oi.quantity * oi.unit_price)::numeric, 2)    AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.product_id = $1
        AND o.status = 'delivered'
      GROUP BY 1
      ORDER BY 1 ASC
    `, [productId]);
    return rows;
  }

  async getRFM() {
    const { rows } = await pool.query(`
      SELECT
        u.id         AS user_id,
        u.name,
        u.email,
        rfm.recency_days,
        rfm.frequency,
        ROUND(rfm.monetary::numeric, 2) AS monetary,
        rfm.r_score,
        rfm.f_score,
        rfm.m_score,
        (rfm.r_score + rfm.f_score + rfm.m_score) AS rfm_total
      FROM mv_rfm rfm
      JOIN users u ON u.id = rfm.user_id
      ORDER BY rfm_total DESC
    `);
    return rows;
  }

  async refreshViews() {
    await pool.query(`SELECT refresh_analytics_views()`);
  }
  async getUserProfile(userId) {
    // Estadísticas generales del usuario
    const { rows: [stats] } = await pool.query(`
      SELECT
        COUNT(o.id)                                              AS total_orders,
        COALESCE(SUM(o.total) FILTER (WHERE o.status != 'cancelled'), 0) AS total_spent,
        COUNT(o.id) FILTER (WHERE o.status = 'delivered')       AS delivered,
        COUNT(o.id) FILTER (WHERE o.status = 'cancelled')       AS cancelled,
        COUNT(o.id) FILTER (WHERE o.status IN ('pending','processing','shipped')) AS active,
        MAX(o.created_at)                                        AS last_order_at
      FROM orders o
      WHERE o.user_id = $1
    `, [userId]);

    // Productos más comprados por este usuario
    const { rows: topProducts } = await pool.query(`
      SELECT
        p.id,
        p.name,
        p.price,
        SUM(oi.quantity)                    AS times_bought,
        SUM(oi.quantity * oi.unit_price)    AS total_spent
      FROM order_items oi
      JOIN orders o   ON o.id  = oi.order_id
      JOIN products p ON p.id  = oi.product_id
      WHERE o.user_id = $1
        AND o.status  = 'delivered'
      GROUP BY p.id, p.name, p.price
      ORDER BY times_bought DESC
      LIMIT 6
    `, [userId]);

    // Categorías favoritas
    const { rows: topCategories } = await pool.query(`
      SELECT
        c.name                             AS category,
        SUM(oi.quantity)                   AS units,
        ROUND(SUM(oi.quantity * oi.unit_price)::numeric, 2) AS spent
      FROM order_items oi
      JOIN orders o     ON o.id  = oi.order_id
      JOIN products p   ON p.id  = oi.product_id
      JOIN categories c ON c.id  = p.category_id
      WHERE o.user_id = $1
        AND o.status  = 'delivered'
      GROUP BY c.name
      ORDER BY spent DESC
      LIMIT 4
    `, [userId]);

    // Recomendaciones: productos de las categorías favoritas que no ha comprado
    const boughtIds = topProducts.map(p => p.id);
    const favCategoryNames = topCategories.map(c => c.category);

    let recommendations = [];
    if (favCategoryNames.length > 0) {
      const placeholders = favCategoryNames.map((_, i) => `$${i + 2}`).join(',');
      const { rows } = await pool.query(`
        SELECT p.id, p.name, p.price, p.stock, c.name AS category_name
        FROM products p
        JOIN categories c ON c.id = p.category_id
        WHERE c.name IN (${placeholders})
          AND p.stock > 0
          ${boughtIds.length > 0 ? `AND p.id NOT IN (${boughtIds.map((_, i) => `$${favCategoryNames.length + 2 + i}`).join(',')})` : ''}
        ORDER BY RANDOM()
        LIMIT 6
      `, [userId, ...favCategoryNames, ...boughtIds]);
      recommendations = rows;
    }

    return {
      stats: {
        totalOrders:  parseInt(stats.total_orders),
        totalSpent:   parseFloat(stats.total_spent),
        delivered:    parseInt(stats.delivered),
        cancelled:    parseInt(stats.cancelled),
        active:       parseInt(stats.active),
        lastOrderAt:  stats.last_order_at,
      },
      topProducts,
      topCategories,
      recommendations,
    };
  }
}

module.exports = PostgresAnalyticsRepository;