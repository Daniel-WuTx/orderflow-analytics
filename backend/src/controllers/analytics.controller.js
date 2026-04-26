const pool = require('../infrastructure/db/pool');

// 1. Resumen general del negocio
const getSummary = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*)    FROM users    WHERE role = 'customer')  AS total_customers,
        (SELECT COUNT(*)    FROM orders   WHERE status != 'cancelled') AS total_orders,
        (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status != 'cancelled') AS total_revenue,
        (SELECT COUNT(*)    FROM products WHERE stock > 0)          AS active_products
    `);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
};

// 2. Ventas por mes (últimos 12 meses) — ideal para gráfica de línea
const getSalesByMonth = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
        COUNT(*)                                             AS total_orders,
        ROUND(SUM(total)::numeric, 2)                       AS revenue
      FROM orders
      WHERE status != 'cancelled'
        AND created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener ventas por mes' });
  }
};

// 3. Top 5 productos más vendidos — ideal para gráfica de barras
const getTopProducts = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        p.name,
        SUM(oi.quantity)                AS units_sold,
        ROUND(SUM(oi.quantity * oi.unit_price)::numeric, 2) AS revenue
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN orders o   ON o.id = oi.order_id
      WHERE o.status != 'cancelled'
      GROUP BY p.id, p.name
      ORDER BY units_sold DESC
      LIMIT 5
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener top productos' });
  }
};

// 4. Comportamiento de clientes con WINDOW FUNCTIONS
const getCustomerBehavior = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      WITH customer_stats AS (
        SELECT
          u.id,
          u.name,
          u.email,
          COUNT(o.id)                          AS total_orders,
          COALESCE(SUM(o.total), 0)            AS total_spent,
          COALESCE(AVG(o.total), 0)            AS avg_order_value,
          MAX(o.created_at)                    AS last_order_date
        FROM users u
        LEFT JOIN orders o ON o.user_id = u.id AND o.status != 'cancelled'
        WHERE u.role = 'customer'
        GROUP BY u.id, u.name, u.email
      )
      SELECT
        *,
        RANK() OVER (ORDER BY total_spent DESC)   AS spending_rank,
        RANK() OVER (ORDER BY total_orders DESC)  AS frequency_rank,
        ROUND(
          100.0 * total_spent / NULLIF(SUM(total_spent) OVER (), 0), 2
        ) AS revenue_share_pct
      FROM customer_stats
      ORDER BY total_spent DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener comportamiento de clientes' });
  }
};

// 5. Tendencia de un producto con LAG — detecta crecimiento
const getProductTrend = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      WITH monthly AS (
        SELECT
          p.name                                              AS product_name,
          TO_CHAR(DATE_TRUNC('month', o.created_at), 'YYYY-MM') AS month,
          SUM(oi.quantity)                                    AS units_sold
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        JOIN orders o   ON o.id = oi.order_id
        WHERE o.status != 'cancelled'
        GROUP BY p.name, DATE_TRUNC('month', o.created_at)
      )
      SELECT
        product_name,
        month,
        units_sold,
        LAG(units_sold) OVER (PARTITION BY product_name ORDER BY month) AS prev_month,
        units_sold - LAG(units_sold) OVER (
          PARTITION BY product_name ORDER BY month
        ) AS growth
      FROM monthly
      ORDER BY product_name, month
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener tendencia' });
  }
};

// 6. Segmentación RFM (Recency, Frequency, Monetary)
const getRFMSegmentation = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      WITH rfm AS (
        SELECT
          u.id,
          u.name,
          NOW() - MAX(o.created_at)            AS recency,
          COUNT(o.id)                          AS frequency,
          COALESCE(SUM(o.total), 0)            AS monetary
        FROM users u
        LEFT JOIN orders o ON o.user_id = u.id AND o.status != 'cancelled'
        WHERE u.role = 'customer'
        GROUP BY u.id, u.name
      )
      SELECT
        id, name,
        EXTRACT(DAY FROM recency)::int AS days_since_last_order,
        frequency,
        ROUND(monetary::numeric, 2) AS monetary,
        CASE
          WHEN frequency >= 3 AND monetary >= 200 THEN 'VIP'
          WHEN frequency >= 2 AND monetary >= 100 THEN 'Leal'
          WHEN frequency = 1 AND monetary >= 50   THEN 'Prometedor'
          ELSE                                         'En riesgo'
        END AS segment
      FROM rfm
      ORDER BY monetary DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener segmentación RFM' });
  }
};

module.exports = {
  getSummary,
  getSalesByMonth,
  getTopProducts,
  getCustomerBehavior,
  getProductTrend,
  getRFMSegmentation
};