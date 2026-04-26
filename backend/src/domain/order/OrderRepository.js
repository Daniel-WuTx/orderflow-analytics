class OrderRepository {
  async save(order)              { throw new Error('Not implemented'); }
  async findById(id)             { throw new Error('Not implemented'); }
  async findByUserId(userId)     { throw new Error('Not implemented'); }
  async updateStatus(id, status) { throw new Error('Not implemented'); }
}

module.exports = OrderRepository;