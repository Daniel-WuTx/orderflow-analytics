class ProductRepository {
  async findAll({ search, category, page, limit }) { throw new Error('Not implemented'); }
  async findById(id)           { throw new Error('Not implemented'); }
  async save(product)          { throw new Error('Not implemented'); }
  async update(id, data)       { throw new Error('Not implemented'); }
  async delete(id)             { throw new Error('Not implemented'); }
  async findCategories()       { throw new Error('Not implemented'); }
}

module.exports = ProductRepository;