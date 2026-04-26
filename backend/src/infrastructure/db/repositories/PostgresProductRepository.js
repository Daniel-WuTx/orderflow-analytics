const ProductRepository = require('../../../domain/product/ProductRepository');
const Product           = require('../../../domain/product/Product');
const pool              = require('../pool');

class PostgresProductRepository extends ProductRepository {
  async findAll({ search = '', category = '', page = 1, limit = 12 } = {}) {
    const params     = [];
    const conditions = [];

    if (category) {
      params.push(category);
      conditions.push(`c.slug = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`p.name ILIKE $${params.length}`);
    }

    const where  = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

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

    return {
      products: rows.map(r => new Product(r)),
      total:    parseInt(count.rows[0].count),
      page:     parseInt(page),
      pages:    Math.ceil(count.rows[0].count / limit),
    };
  }

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT p.*, c.name AS category_name,
              ROUND(AVG(r.rating), 1) AS avg_rating,
              COUNT(r.id)             AS review_count
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN reviews r    ON r.product_id  = p.id
       WHERE p.id = $1
       GROUP BY p.id, c.name`,
      [id]
    );
    if (!rows[0]) return null;
    return new Product(rows[0]);
  }

  async save(data) {
    const { rows } = await pool.query(
      `INSERT INTO products (name, description, price, stock, category_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.name, data.description, data.price, data.stock ?? 0, data.categoryId]
    );
    return new Product(rows[0]);
  }

  async update(id, data) {
    const { rows } = await pool.query(
      `UPDATE products
       SET name=$1, description=$2, price=$3, stock=$4, category_id=$5
       WHERE id=$6 RETURNING *`,
      [data.name, data.description, data.price, data.stock, data.categoryId, id]
    );
    if (!rows[0]) return null;
    return new Product(rows[0]);
  }

  async delete(id) {
    const { rowCount } = await pool.query(
      'DELETE FROM products WHERE id = $1', [id]
    );
    return rowCount > 0;
  }

  async findCategories() {
    const { rows } = await pool.query('SELECT * FROM categories ORDER BY name');
    return rows;
  }
}

module.exports = PostgresProductRepository;