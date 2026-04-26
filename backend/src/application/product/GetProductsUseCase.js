class GetProductsUseCase {
  constructor({ productRepository }) {
    this.productRepository = productRepository;
  }

  async execute({ search, category, page, limit } = {}) {
    return this.productRepository.findAll({ search, category, page, limit });
  }
}

module.exports = GetProductsUseCase;