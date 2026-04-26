class GetProductByIdUseCase {
  constructor({ productRepository }) {
    this.productRepository = productRepository;
  }

  async execute(id) {
    const product = await this.productRepository.findById(id);
    if (!product) throw new Error('Producto no encontrado');
    return product;
  }
}

module.exports = GetProductByIdUseCase;