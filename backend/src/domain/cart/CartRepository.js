class CartRepository {
  async findByUserId(userId)    { throw new Error('Not implemented'); }
  async save(cart)              { throw new Error('Not implemented'); }
  async delete(userId)          { throw new Error('Not implemented'); }
}

module.exports = CartRepository;