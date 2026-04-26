class UpdateProductUseCase {
  constructor({ productRepository }) {
    this.productRepository = productRepository;
  }

  async execute(id, { name, description, price, stock, categoryId }) {
    const existing = await this.productRepository.findById(id);
    if (!existing) throw new Error('Producto no encontrado');
    if (price < 0) throw new Error('El precio no puede ser negativo');
    if (stock < 0) throw new Error('El stock no puede ser negativo');

    return this.productRepository.update(id, { name, description, price, stock, categoryId });
  }
}

module.exports = UpdateProductUseCase;