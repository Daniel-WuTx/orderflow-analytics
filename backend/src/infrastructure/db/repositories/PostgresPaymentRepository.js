const PaymentRepository = require('../../../domain/payment/PaymentRepository');
const Payment           = require('../../../domain/payment/Payment');
const pool              = require('../pool');

class PostgresPaymentRepository extends PaymentRepository {
  async save(payment) {
    const { rows } = await pool.query(
      `INSERT INTO payment_intents
         (user_id, order_id, idempotency_key, amount, currency, status, provider, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        payment.userId,
        payment.orderId,
        payment.idempotencyKey,
        payment.amount,
        payment.currency,
        payment.status,
        payment.provider,
        JSON.stringify(payment.metadata),
      ]
    );
    return new Payment(rows[0]);
  }

  async findByIdempotencyKey(key) {
    const { rows } = await pool.query(
      'SELECT * FROM payment_intents WHERE idempotency_key = $1',
      [key]
    );
    return rows[0] ? new Payment(rows[0]) : null;
  }

  async findByOrderId(orderId) {
    const { rows } = await pool.query(
      'SELECT * FROM payment_intents WHERE order_id = $1 ORDER BY created_at DESC',
      [orderId]
    );
    return rows.map(r => new Payment(r));
  }

  async updateStatus(id, status, providerId = null) {
    const { rows } = await pool.query(
      `UPDATE payment_intents
       SET status=$1, provider_id=$2
       WHERE id=$3 RETURNING *`,
      [status, providerId, id]
    );
    return rows[0] ? new Payment(rows[0]) : null;
  }
}

module.exports = PostgresPaymentRepository;