class CreateProductUseCase {
  constructor({ productRepository }) {
    this.productRepository = productRepository;
  }

  async execute({ name, description, price, stock, categoryId }) {
    if (!name || !price) throw new Error('Nombre y precio son requeridos');
    if (price < 0)       throw new Error('El precio no puede ser negativo');
    if (stock < 0)       throw new Error('El stock no puede ser negativo');

    return this.productRepository.save({ name, description, price, stock, categoryId });
  }
}

module.exports = CreateProductUseCase;