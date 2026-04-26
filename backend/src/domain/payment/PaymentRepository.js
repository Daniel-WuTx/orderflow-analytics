class PaymentRepository {
  async save(payment)                        { throw new Error('Not implemented'); }
  async findByIdempotencyKey(key)            { throw new Error('Not implemented'); }
  async findByOrderId(orderId)               { throw new Error('Not implemented'); }
  async updateStatus(id, status, providerId) { throw new Error('Not implemented'); }
}

module.exports = PaymentRepository;