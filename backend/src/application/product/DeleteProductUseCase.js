class DeleteProductUseCase {
  constructor({ productRepository }) {
    this.productRepository = productRepository;
  }

  async execute(id) {
    const existing = await this.productRepository.findById(id);
    if (!existing) throw new Error('Producto no encontrado');

    const deleted = await this.productRepository.delete(id);
    if (!deleted) throw new Error('No se pudo eliminar el producto');
    return { message: 'Producto eliminado' };
  }
}

module.exports = DeleteProductUseCase;