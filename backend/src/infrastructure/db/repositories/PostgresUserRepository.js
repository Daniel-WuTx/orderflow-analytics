const UserRepository = require('../../../domain/user/UserRepository');
const pool           = require('../pool');

class PostgresUserRepository extends UserRepository {
  async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    );
    return rows[0] || null;
  }

  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1', [id]
    );
    return rows[0] || null;
  }

  async save({ name, email, passwordHash, role = 'customer' }) {
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, email, passwordHash, role]
    );
    return rows[0];
  }

  async updateRole(id, role) {
    const { rows } = await pool.query(
      `UPDATE users SET role = $1 WHERE id = $2
       RETURNING id, name, email, role`,
      [role, id]
    );
    return rows[0] || null;
  }

  async findAll() {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    return rows;
  }
}

module.exports = PostgresUserRepository;